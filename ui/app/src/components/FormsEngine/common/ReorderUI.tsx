import { CSSProperties, SyntheticEvent, useEffect, useRef, useState } from 'react';
import {
  draggable,
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { createPortal, flushSync } from 'react-dom';
import GripVertical from '@mui/icons-material/DragIndicatorRounded';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import invariant from 'tiny-invariant';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Box from '@mui/material/Box';
import { SxProps } from '@mui/system';
import FieldBox from './FieldBox';
import List from '@mui/material/List';
import { NodeSelectorItem, NodeSelectorProps } from '../controls/NodeSelector';
import FormsEngineField from './FormsEngineField';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';

// https://atlassian.design/components/pragmatic-drag-and-drop/about
// https://stackblitz.com/github/alexreardon/pdnd-react-tailwind

type Orientation = 'horizontal' | 'vertical';

type ItemState =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-over'; closestEdge: Edge | null };

type TItemData = { [itemDataKey]: true; taskId: NodeSelectorItem['key'] };

const edgeToOrientationMap: Record<Edge, Orientation> = {
  top: 'horizontal',
  bottom: 'horizontal',
  left: 'vertical',
  right: 'vertical'
};

const orientationStyles: Record<Orientation, SxProps> = {
  horizontal: {
    height: `var(--line-thickness)`,
    left: `var(--terminal-radius)`,
    right: 0,
    '::before': {
      left: `var(--negative-terminal-size)`
    }
  },
  vertical: {
    width: `var(--line-thickness)`,
    top: 'var(--terminal-radius)',
    bottom: 0,
    '::before': { top: 'var(--negative-terminal-size)' }
  }
};

const edgeStyles: Record<Edge, SxProps> = {
  top: {
    top: 'var(--line-offset)',
    '::before': { top: 'var(--offset-terminal)' }
  },
  right: {
    right: 'var(--line-offset)',
    '::before': { right: 'var(--offset-terminal)' }
  },
  bottom: {
    bottom: 'var(--line-offset)',
    '::before': { bottom: 'var(--offset-terminal)' }
  },
  left: {
    left: 'var(--line-offset)',
    '::before': { left: 'var(--offset-terminal)' }
  }
};

const strokeSize = 2;
const terminalSize = 8;
const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2;
const idle: ItemState = { type: 'idle' };
const itemDataKey = Symbol('item');

function DropIndicator({ edge, gap }: { edge: Edge; gap: string }) {
  const lineOffset = `calc(-0.5 * (${gap} + ${strokeSize}px))`;
  const orientation = edgeToOrientationMap[edge];
  return (
    <Box
      style={
        {
          '--line-thickness': `${strokeSize}px`,
          '--line-offset': `${lineOffset}`,
          '--terminal-size': `${terminalSize}px`,
          '--terminal-radius': `${terminalSize / 2}px`,
          '--negative-terminal-size': `-${terminalSize}px`,
          '--offset-terminal': `${offsetToAlignTerminalWithLine}px`
        } as CSSProperties
      }
      sx={{
        position: 'absolute',
        zIndex: 10,
        bgcolor: 'primary.main',
        pointerEvents: 'none',
        '::before': {
          position: 'absolute',
          content: '""',
          width: `var(--terminal-size)`,
          height: `var(--terminal-size)`,
          boxSizing: 'border-box',
          borderWidth: `var(--line-thickness)`,
          borderStyle: 'solid',
          borderColor: 'primary.main',
          borderRadius: 5
        },
        ...orientationStyles[orientation],
        ...edgeStyles[edge]
      }}
      // className={`absolute z-10 bg-blue-700 pointer-events-none before:content-[''] before:w-[--terminal-size] before:h-[--terminal-size] box-border before:absolute before:border-[length:--line-thickness] before:border-solid before:border-blue-700 before:rounded-full ${orientationStyles[orientation]} ${[edgeStyles[edge]]}`}
    />
  );
}

function Item({ item }: { item: NodeSelectorItem }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<ItemState>(idle);

  useEffect(() => {
    const element = ref.current;
    invariant(element);
    return combine(
      draggable({
        element,
        getInitialData() {
          return getItemData(item);
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px'
            }),
            render({ container }) {
              setState({ type: 'preview', container });
            }
          });
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState(idle);
        }
      }),
      dropTargetForElements({
        element,
        canDrop({ source }) {
          // not allowing dropping on yourself
          if (source.element === element) {
            return false;
          }
          // only allowing tasks to be dropped on me
          return isTaskData(source.data);
        },
        getData({ input }) {
          const data = getItemData(item);
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom']
          });
        },
        getIsSticky() {
          return true;
        },
        onDragEnter({ self }) {
          const closestEdge = extractClosestEdge(self.data);
          setState({ type: 'is-dragging-over', closestEdge });
        },
        onDrag({ self }) {
          const closestEdge = extractClosestEdge(self.data);

          // Only need to update react state if nothing has changed.
          // Prevents re-rendering.
          setState((current) => {
            if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
              return current;
            }
            return { type: 'is-dragging-over', closestEdge };
          });
        },
        onDragLeave() {
          setState(idle);
        },
        onDrop() {
          setState(idle);
        }
      })
    );
  }, [item]);

  return (
    <>
      <ListItemButton
        data-item-id={item.key}
        ref={ref}
        className="relative"
        sx={[state.type === 'is-dragging' && { opacity: 0.4 }]}
      >
        <ListItemIcon className="w-6 flex justify-center">
          <GripVertical fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={item.value} />
        {state.type === 'is-dragging-over' && state.closestEdge ? (
          <DropIndicator edge={state.closestEdge} gap="8px" />
        ) : null}
      </ListItemButton>
      {state.type === 'preview' ? createPortal(<DragPreview task={item} />, state.container) : null}
    </>
  );
}

function DragPreview({ task }: { task: NodeSelectorItem }) {
  return <div className="border-solid rounded p-2 bg-white">{task.value}</div>;
}

function getItemData(task: NodeSelectorItem): TItemData {
  return { [itemDataKey]: true, taskId: task.key };
}

function isTaskData(data: Record<string | symbol, unknown>): data is TItemData {
  return data[itemDataKey] === true;
}

export function ReorderUI({
  value,
  field,
  onCancel,
  onDone
}: NodeSelectorProps & {
  onCancel(event: SyntheticEvent): void;
  onDone(event: SyntheticEvent, items: NodeSelectorItem[]): void;
}) {
  const [items, setItems] = useState(value);

  useEffect(() => {
    return monitorForElements({
      canMonitor({ source }) {
        return isTaskData(source.data);
      },
      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data;
        const targetData = target.data;

        if (!isTaskData(sourceData) || !isTaskData(targetData)) {
          return;
        }

        const indexOfSource = items.findIndex((task) => task.key === sourceData.taskId);
        const indexOfTarget = items.findIndex((task) => task.key === targetData.taskId);

        if (indexOfTarget < 0 || indexOfSource < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

        // Using `flushSync` so we can query the DOM straight after this line
        flushSync(() => {
          setItems(
            reorderWithEdge({
              list: items,
              startIndex: indexOfSource,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: 'vertical'
            })
          );
        });
        // Being simple and just querying for the task after the drop.
        // We could use react context to register the element in a lookup,
        // and then we could retrieve that element after the drop and use
        // `triggerPostMoveFlash`. But this gets the job done.
        const element = document.querySelector(`[data-item-id="${sourceData.taskId}"]`);
        if (element instanceof HTMLElement) {
          triggerPostMoveFlash(element);
        }
      }
    });
  }, [items]);

  return (
    <FormsEngineField
      field={field}
      menu={false}
      action={
        <>
          <Button size="small" onClick={onCancel}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button size="small" disabled={items === value} onClick={(e) => onDone(e, items)}>
            <FormattedMessage defaultMessage="Done" />
          </Button>
        </>
      }
    >
      <FieldBox>
        <List>
          {items.map((task) => (
            <Item key={task.key} item={task} />
          ))}
        </List>
      </FieldBox>
    </FormsEngineField>
  );
}

export default ReorderUI;
