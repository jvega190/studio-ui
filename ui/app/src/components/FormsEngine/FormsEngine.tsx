/*
 * Copyright (C) 2007-2024 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { styled, Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import useEnv from '../../hooks/useEnv';
import { useDispatch } from 'react-redux';
import useActiveSite from '../../hooks/useActiveSite';
import useContentTypes from '../../hooks/useContentTypes';
import React, {
  ChangeEvent,
  ComponentType,
  Dispatch as ReactDispatch,
  ElementType,
  lazy,
  LazyExoticComponent,
  memo,
  MutableRefObject,
  ReactNode,
  RefObject,
  SetStateAction,
  Suspense,
  SyntheticEvent,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ContentTypeField, ContentTypeSection, SandboxItem } from '../../models';
import {
  FormRequirementsResponse,
  FormsEngineAtoms,
  FormsEngineEditContextProps,
  FormsEngineFormApiContextProps,
  FormsEngineFormContextApi,
  FormsEngineGlobalApiContextProps,
  FormsEngineItemMetaContextProps,
  FormsEngineSourceMap,
  ItemContext,
  ItemMetaContext,
  StableFormContext,
  StableFormContextProps,
  StableGlobalContext,
  StableGlobalContextProps
} from './formsEngineContext';
import {
  fetchContentXML,
  fetchDescriptorXML,
  fetchDetailedItem,
  fetchWorkflowAffectedItems,
  lock,
  unlock
} from '../../services/content';
import { fetchDetailedItemComplete } from '../../state/actions/content';
import { catchError, forkJoin, map, Observable, of, Subject, switchMap } from 'rxjs';
import { deserialize, fromString, getInnerHtml } from '../../utils/xml';
import LoadingState from '../LoadingState';
import Paper, { paperClasses } from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Drawer, { drawerClasses, DrawerProps } from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MinimizeIconRounded from '@mui/icons-material/RemoveRounded';
import MaximiseIcon from '@mui/icons-material/OpenInFullRounded';
import CloseFullscreenOutlined from '@mui/icons-material/CloseFullscreenOutlined';
import Close from '@mui/icons-material/Close';
import ItemTypeIcon from '../ItemTypeIcon';
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded';
import ItemPublishingTargetIcon from '../ItemPublishingTargetIcon';
import { getItemPublishingTargetText, getItemStateText } from '../ItemDisplay/utils';
import ItemStateIcon from '../ItemStateIcon';
import Tabs, { TabsProps } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { FieldRequiredStateIndicator } from './common/FieldRequiredStateIndicator';
import Alert from '@mui/material/Alert';
import { createErrorStatePropsFromApiResponse } from '../ApiResponseErrorState';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import TextField from '@mui/material/TextField';
import Button, { ButtonProps } from '@mui/material/Button';
import IFrame from '../IFrame';
import { StickyBox } from './common/StickyBox';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import { copyToClipboard } from '../../utils/system';
import { BuiltInControlType, controlMap } from './controlMap';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { EnhancedDialogProps } from '../EnhancedDialog';
import useEnhancedDialogContext from '../EnhancedDialog/useEnhancedDialogContext';
import useLocale from '../../hooks/useLocale';
import { v4 as uuid } from 'uuid';
import { prettyPrintPerson } from '../../utils/object';
import { ArrowUpward, EditOffOutlined, EditOutlined } from '@mui/icons-material';
import ContentType from '../../models/ContentType';
import { SearchBar } from '../SearchBar';
import validateFieldValue, {
  createCleanValuesObject,
  FieldValidityState,
  isEmptyValue,
  isFieldRequired,
  systemFieldsNotInType,
  XmlKeys
} from './validateFieldValue';
import { UnknownControl } from './common/UnknownControl';
import LookupTable from '../../models/LookupTable';
import { XMLBuilder } from 'fast-xml-parser';
import { ControlProps } from './types';
import { toColor } from '../../utils/string';
import { NodeSelectorItem } from './controls/NodeSelector';
import { RepeatItem } from './controls/Repeat';
import Chip, { chipClasses } from '@mui/material/Chip';
import SecondaryButton from '../SecondaryButton';
import Fab from '@mui/material/Fab';
import useDebouncedInput from '../../hooks/useDebouncedInput';
import MenuOpenIcon from '@mui/icons-material/MenuOpenRounded';
import useUpdateRefs from '../../hooks/useUpdateRefs';
import { Fade } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';
import { showSystemNotification } from '../../state/actions/system';
import { Dispatch as ReduxDispatch } from 'redux';
import { IntlShape } from 'react-intl/src/types';
import { displayWithPendingChangesConfirm } from '../GlobalDialogManager';
import AlertTitle from '@mui/material/AlertTitle';
import { WorkflowCancellationDialogProps } from '../WorkflowCancellationDialog/utils';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grow from '@mui/material/Grow';
import { UIBlocker } from '../UIBlocker';
import PrimaryButton from '../PrimaryButton';
import { pushDialog } from '../../state/actions/dialogStack';
import FieldEmptyStateIndicator from './common/FieldEmptyStateIndicator';
import useFetchSandboxItems from '../../hooks/useFetchSandboxItems';
import { buildFileUrl } from '../../services/plugin';
import { FormsEngineField } from './common/FormsEngineField';
import ErrorBoundary from '../ErrorBoundary';
import { debounceTime } from 'rxjs/operators';
import { ControlSkeleton } from './common/ControlSkeleton';
import { Atom, atom, createStore, Provider, useAtom, useAtomValue, useStore } from 'jotai';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import useSelection from '../../hooks/useSelection';
import ApiResponse from '../../models/ApiResponse';
import { PrimitiveAtom } from 'jotai/index';
import usePreviousValue from '../../hooks/usePreviousValue';
import { areTuplesEqual } from '../../utils/array';
import { AjaxError } from 'rxjs/ajax';
import { ErrorState } from '../ErrorState';

// TODO:
//  - PathNav and other ares to open new edit form
//  - Edit template & controller
//  - Update Audience Targeting panel to use new form engine controls
//  - Store collapsed ToC state & add to preference manager
//  - AI
//  - Field diff & rollback
//  - Edit template on form
//  - View/edit content type?
//  - Enabling editing (from read only to edit mode) for embedded components considering deeper nesting that 1 too
//  - AI to summarise changes for the save comment
//  - Control guidelines: autoFocus
//  - API to retrieve inherited props from an item that doesn't yet exist (is being created)
//  - Rollback confirm with diff
//  - Docs notes:
//    - Controls should manage autoFocus; make sure their internal controls reacts to changes in autoFocus or use effect to focus programmatically
//    - Should test controls in a root form and in a nested form
//  - Settings:
//     - Enable tabbing through control menu button
//     - Permanently hide ToC (though also controlled by the tab bar button)
//     - Colour blind mode:
//        - required field indicators to show check instead of asterisk when valid
//     - Flush control cache?
//     - Close after saving & options
//     - Whether to open node selector items in edit if the main item area (instead of edit button) is clicked

type JotaiStore = ReturnType<typeof createStore>;

const ItemNotFoundError = Symbol('ItemNotFoundError');
const ContentTypeNotFoundError = Symbol('ContentTypeNotFoundError');
const InvalidParamsError = Symbol('InvalidParamsError');
const UnknownError = Symbol('UnknownError');

export interface BaseProps extends Partial<UpdateModeProps & RepeatModeProps & CreateModeProps> {
  stackIndex?: number;
  stackTransitionEnded?: boolean;
  readonly?: boolean;
  /** Whether the form is rendered in a dialog. Causes various layout adjustments. **/
  isDialog?: boolean;
  onClose?: EnhancedDialogProps['onClose'];
  onMinimize?: EnhancedDialogProps['onMinimize'];
  onFullScreen?: EnhancedDialogProps['onFullScreen'];
  onCancelFullScreen?: EnhancedDialogProps['onCancelFullScreen'];
  /** The form will render only the specified fields from the main content type being worked with */
  fieldsToRender?: ContentTypeField[];
  onSave?(result: {
    dom: Document | Element;
    xml: string;
    values: LookupTable<unknown>;
  }): Partial<{ close: boolean }> | undefined;
}

export interface UpdateModeProps {
  update: {
    path: string;
    modelId?: string;
    values?: LookupTable<unknown>;
  };
}

export interface RepeatModeProps {
  repeat: {
    fieldId: string;
    index?: number;
    values?: RepeatItem;
  };
}

export interface CreateModeProps {
  create: {
    path: string;
    contentTypeId: string;
  };
}

export type FormsEngineProps = BaseProps & (UpdateModeProps | RepeatModeProps | CreateModeProps);

/**
 * Formats a FormsEngine values object with "hints" for attributes or other specifics for the XML serialiser to serialise
 * the content as a CrafterCMS content xml.
 **/
function prepareValuesForXmlSerialising(
  fields: LookupTable<ContentTypeField>,
  values: LookupTable<unknown>,
  contentTypesLookup: LookupTable<ContentType>
): LookupTable<unknown> {
  const jObj = { ...values };
  Object.entries(jObj).forEach(([id, value]) => {
    const field = fields[id];
    const fieldType = field?.type as BuiltInControlType;
    switch (fieldType) {
      case 'repeat':
      case 'node-selector': {
        const isRepeat = fieldType === 'repeat';
        jObj[id] = {
          '@:item-list': true,
          item: isRepeat
            ? (value as RepeatItem[]).map((item) =>
                prepareValuesForXmlSerialising(field.fields, item, contentTypesLookup)
              )
            : (value as NodeSelectorItem[]).map((item) => {
                if (item.component == null) {
                  return item;
                }
                const contentType = contentTypesLookup[(item.component[XmlKeys.contentTypeId] as string)?.trim()];
                if (!contentType) {
                  console.error(`Content type not found for embedded component`, item.component);
                  return item;
                }
                const component = prepareValuesForXmlSerialising(
                  contentType.fields,
                  item.component,
                  contentTypesLookup
                );
                component['@:id'] = component[XmlKeys.modelId];
                return { ...item, '@:inline': true, component };
              })
        };
        break;
      }
      case 'rte': {
        jObj[id] = { __cdata__: value };
        break;
      }
      case 'checkbox-group': {
        jObj[id] = { item: value };
        break;
      }
      default:
        break;
    }
  });
  return jObj;
}

/**
 * Takes in a FormsEngine values object and creates the XML representation
 **/
function buildContentXml(values: LookupTable<unknown>, contentTypesLookup: LookupTable<ContentType>): string {
  const rootContentType: ContentType = contentTypesLookup[values[XmlKeys.contentTypeId] as string];
  const rootObjectType = rootContentType.type;
  const jObj = prepareValuesForXmlSerialising(rootContentType.fields, values, contentTypesLookup);
  rootObjectType === 'component' && (jObj['@:id'] = jObj.objectId);
  const builder = new XMLBuilder({
    format: true,
    indentBy: '\t',
    ignoreAttributes: false,
    attributeNamePrefix: '@:',
    cdataPropName: '__cdata__',
    suppressBooleanAttributes: false
  });
  const xml = builder.build({ [`${rootObjectType}`]: jObj });
  return xml as string;
}

function getScrollContainer(container: HTMLElement): HTMLElement {
  return container;
}

const buildSectionExpandedState = (contentTypeSections: ContentTypeSection[]) => {
  return contentTypeSections.reduce(
    (sectionExpandedState, section) => {
      sectionExpandedState[section.title] = section.expandByDefault;
      return sectionExpandedState;
    },
    {} as Record<string, boolean>
  );
};

const internalLockContentService: (siteId: string, path: string) => Observable<FormsEngineEditContextProps> = (
  siteId,
  path
) =>
  lock(siteId, path).pipe(
    map(() => ({ locked: true, lockError: null })),
    catchError((error: AjaxError) => {
      // switch (error.status) {
      //   case 404: {
      //     throw error;
      //   }
      //   case 409: {
      //     // content already locked...
      //   }
      // }
      return of({ locked: false, lockError: error.response?.response });
    }),
    switchMap((lockResult) =>
      fetchWorkflowAffectedItems(siteId, path).pipe(
        map((affectedItemsInWorkflow) => ({ ...lockResult, affectedItemsInWorkflow })),
        catchError((error) => of({ ...lockResult, affectedItemsInWorkflow: null, lockError: error.response?.response }))
      )
    )
  );

const internalUnlockContentService: (siteId: string, path: string) => Observable<FormsEngineEditContextProps> = (
  siteId: string,
  path: string
) =>
  unlock(siteId, path).pipe(
    map(() => ({ locked: false, lockError: null })),
    catchError((error) => of({ locked: true, lockError: error.response?.response }))
  );

const deserializeContentDom = (contentDom: XMLDocument | Element) => {
  if (!contentDom) return null;
  return deserialize(contentDom, {
    ignoreAttributes: true,
    isArray(tagName: string, jPath: string) {
      // Ideally, we would extract all collection types (item selector, repeat) that have
      // this sort of syntax to avoid false positives.
      // e.g.collectionFieldIds.map((fieldId) => `${rootTagName}.${fieldId}.item`).includes(jPath);
      return jPath.endsWith('.item');
    }
  })[(contentDom as XMLDocument).documentElement?.tagName ?? (contentDom as Element).tagName];
};

const createSourceMap = (descriptorXml: string) => {
  const descriptorDom = fromString(descriptorXml);
  const sourceMap: FormsEngineSourceMap = {};
  descriptorDom.querySelectorAll(':scope > [crafter-source]').forEach((element) => {
    if (element.innerHTML.trim() === '') {
      // Seen `folder-name` in the descriptor getting inherited in the case of Home.
      // Home's <folder-name /> tag is empty and the merger puts in the level descriptor folder-name — despite it being emtpy too.
      return;
    }
    sourceMap[element.tagName] = element.getAttribute('crafter-source');
  });
  return sourceMap;
};

const fetchRequirements: (args: {
  siteId: string;
  path: string;
  modelId: string;
  readonly: boolean;
  contentTypesById: LookupTable<ContentType>;
}) => Observable<FormRequirementsResponse> = ({ siteId, path, modelId, readonly, contentTypesById }) => {
  // Good to start with the lock so that posterior fetch of the item comes with the lock status. If we need
  // to fetch the content type, will need the item first to determine its content type id, but currently relying
  // on a separate load for all content types. Alternatively, we could fetch all types here too if we get a form
  // requirements service.
  return (
    readonly
      ? of({ locked: false, lockError: null, affectedItemsInWorkflow: null } as FormsEngineEditContextProps)
      : internalLockContentService(siteId, path)
  ).pipe(
    switchMap((lockResult) =>
      forkJoin([
        fetchDetailedItem(siteId, path),
        of(lockResult),
        fetchContentXML(siteId, path),
        fetchDescriptorXML(siteId, path, { flatten: false })
        // fetchConfigurationXML(siteId, `/content-types${item.contentTypeId}/form-definition.xml`, 'studio'),
        // fetchContentType(siteId, item.contentTypeId),
        // of(null)
        // importPlugin({
        //   site: siteId,
        //   type: 'examples',
        //   name: 'forms-engine',
        //   file: 'index.js',
        //   id: 'org.craftercms'
        // }).catch(() => null)
      ])
    ),
    map(([item, lockResult, contentXml, descriptorXml]) => {
      let contentType = contentTypesById[item.contentTypeId];
      if (!contentType) {
        throw ContentTypeNotFoundError;
      }
      let contentDom: XMLDocument | Element = fromString(contentXml);
      if (modelId) {
        contentDom = contentDom.querySelector(`[id="${modelId}"]`);
        contentType = contentTypesById[getInnerHtml(contentDom.querySelector(':scope > content-type'))];
      }
      const contentObject = deserializeContentDom(contentDom);
      const sourceMap = createSourceMap(descriptorXml);
      const props: FormRequirementsResponse = {
        item,
        contentObject,
        sourceMap,
        locked: lockResult.locked,
        lockError: lockResult.lockError,
        affectedItemsInWorkflow: lockResult.affectedItemsInWorkflow,
        // If opening as readonly, lock result is of no consequence. If opened for edit, will set to readonly
        // if there was an error locking the content (the item is not locked).
        // readonly: readonly || !lockResult.locked,
        contentType,
        pathInSite: createPathInProject(path)
      };
      return props;
    })
  );
};

const createPathInProject = (fullPath: string) => {
  /* Example:
   *   item.path = '/site/website/headless-cms-solutions/enterprise/index.xml'
   *   pieces = item.path.split('/').slice(3)
   *     ==> ['headless-cms-solutions', 'enterprise', 'index.xml']
   *   pieces.slice(0, result.length - 2)
   *     ==> ['headless-cms-solutions'] */
  const pieces = fullPath
    .split('/')
    // .slice(3) removes the first empty string created by the leading slash (''),
    // 'site', and whatever comes after (e.g. 'components' in /site/components,
    // or 'website' in /site/website).
    .slice(3);
  // .slice(0, length - 2) removes the folder name and file name.
  // In the case of no folder name, it will return an empty string.
  return `/${pieces.slice(0, pieces.length - 2).join('/')}/`.replace(/\/+/g, '/');
};

const DenseTab = styled(Tab)(({ theme }) => ({ minHeight: 0, padding: theme.spacing(1) }));

const displayFormBeingSavedSnack = (dispatch: ReduxDispatch, formatMessage: IntlShape['formatMessage']) => {
  dispatch(
    showSystemNotification({
      message: formatMessage({ defaultMessage: 'Content is being saved, please wait...' })
    })
  );
};

// Note: These persist past the closing of the form.
const lazyControlMap = new Map<string, LazyExoticComponent<ComponentType>>();
const addLazyControl = (url: string) => {
  lazyControlMap.set(
    url,
    lazy(() =>
      import(/* @vite-ignore */ url)
        .then((m) => {
          if (m.default) return m;
          else return { default: ControlPluginNoDefaultError };
        })
        .catch((reason) => {
          console.error(
            // TODO: Docs or internal URL
            `An error occurred loading the control. The form attempted to load the control from \`${url}\`. Forms Engine v1 controls are not compatible with this version. If you haven't migrated this control, please check the migration guide at https://docs.craftercms.org/.\n\n`,
            reason
          );
          return { default: ControlPluginError };
        })
    )
  );
};

const getTargetHeight = (isDialog: boolean, isFullScreen: boolean, theme: Theme) =>
  isDialog ? `calc(100vh - ${isFullScreen ? 0 : theme.spacing(4)})` : '100%';

const renderFieldControl = (
  field: ContentTypeField,
  atoms: FormsEngineAtoms['valueByFieldId'],
  autoFocus: boolean,
  readonly: boolean,
  contentType: ContentType
) => {
  const fieldId = field.id;
  return (
    <ControlWrapper
      key={fieldId}
      field={field}
      atom={atoms[fieldId]}
      readonly={readonly}
      autoFocus={autoFocus}
      contentType={contentType}
    />
  );
};

const getFieldAtomValue = (atom: Atom<unknown>, store: JotaiStore) => store.get(atom);

const stackFormCountAtom = atom(0);
const versionCommentAtom = atom('');

function createValueAtoms(
  field: ContentTypeField,
  initialValue: unknown,
  formContextRef: RefObject<Pick<StableFormContextProps, 'fieldUpdates$' | 'changedFieldIds' | 'originalValues'>>
): [PrimitiveAtom<unknown>, Atom<FieldValidityState>] {
  let isInitialization = true;
  const valueAtom = atom(initialValue);
  return [
    valueAtom,
    atom((get) => {
      const value = get(valueAtom);
      if (isInitialization) {
        isInitialization = false;
      } else {
        if (value !== formContextRef.current.originalValues[field.id]) {
          formContextRef.current.changedFieldIds.add(field.id);
        } else {
          formContextRef.current.changedFieldIds.delete(field.id);
        }
        formContextRef.current.fieldUpdates$.next(field.id);
      }
      return validateFieldValue(field, value);
    })
  ];
}

const createReadonlyAtom = (lockedResultAtom: Atom<FormsEngineEditContextProps>) =>
  atom((get) => !get(lockedResultAtom).locked);

const extractValueAtoms: (store: JotaiStore, valueAtoms: LookupTable<Atom<unknown>>) => LookupTable<unknown> = (
  store,
  valueAtoms
) =>
  Object.entries(valueAtoms).reduce((values, [fieldId, valueAtom]) => {
    values[fieldId] = store.get(valueAtom);
    return values;
  }, {});

const createFormStackData: (mixin?: Partial<StableFormContextProps>) => StableFormContextProps = (mixin) => {
  const data: StableFormContextProps = {
    atoms: null,
    changedFieldIds: new Set<string>(),
    fieldUpdates$: new Subject<string>(),
    initialized: false,
    itemMeta: null,
    originalValues: null,
    props: null,
    state: null,
    ...mixin
  };
  return data;
};

function Root(props: FormsEngineProps) {
  const store = useMemo(() => createStore(), []); // TODO: Use stable memo?
  const stableGlobalContextRef = useRef<StableGlobalContextProps>();
  if (!stableGlobalContextRef.current) {
    stableGlobalContextRef.current = {
      api: null,
      formsStackData: [createFormStackData({ props })]
    };
  }
  stableGlobalContextRef.current.api = useMemo<FormsEngineGlobalApiContextProps>(() => {
    const setCount = (factor: 1 | -1) => {
      const currentCount = store.get(stackFormCountAtom);
      store.set(stackFormCountAtom, currentCount + factor);
    };
    const api: FormsEngineGlobalApiContextProps = {
      pushForm(props) {
        stableGlobalContextRef.current.formsStackData.push(createFormStackData({ props }));
        setCount(1);
      },
      popForm() {
        stableGlobalContextRef.current.formsStackData.pop();
        setCount(-1);
      },
      updateProps(stackIndex, formProps) {
        stableGlobalContextRef.current.formsStackData[stackIndex].props = formProps;
      },
      setStateCache(stackIndex, state) {
        stableGlobalContextRef.current.formsStackData[stackIndex].state = state;
      }
    };
    return api;
  }, [store]);
  return (
    <ErrorBoundary>
      <StableGlobalContext.Provider value={stableGlobalContextRef.current}>
        <Provider store={store}>
          <Prepper {...props} />
        </Provider>
      </StableGlobalContext.Provider>
    </ErrorBoundary>
  );
}

function Prepper(props: FormsEngineProps) {
  const { create, update, repeat, fieldsToRender, readonly: readonlyProp, stackIndex = 0, isDialog } = props;
  const siteId = useActiveSiteId();
  const dispatch = useDispatch();
  const contentTypesById = useContentTypes();
  const [contentTypesLoaded, setContentTypesLoaded] = useState(Boolean(contentTypesById));
  const { formsStackData, api } = useContext(StableGlobalContext);
  const [itemMeta, setItemMeta] = useState<FormsEngineItemMetaContextProps>(formsStackData[stackIndex].itemMeta);
  const [ready, setReady] = useState(false);
  const [prepError, setPrepError] = useState<symbol>();
  const store = useStore();
  const theme = useTheme();
  const { isFullScreen = false } = useEnhancedDialogContext() ?? {};
  const previousProps = usePreviousValue(props);
  const effectRefs = useUpdateRefs({ contentTypesById, previousProps });
  const stableFormContextRef = useRef<StableFormContextProps>(formsStackData[stackIndex]);

  const contextApi = useMemo<FormsEngineFormApiContextProps>(() => {
    const getInitialValues = () => stableFormContextRef.current.originalValues;
    const rollbackAtom = (atom: PrimitiveAtom<unknown>, value: unknown) => store.set(atom, value);
    const internalRollbackValue = (initialValues: LookupTable<unknown>, fieldId: string) => {
      const value = initialValues[fieldId];
      const atom = stableFormContextRef.current.atoms.valueByFieldId[fieldId];
      rollbackAtom(atom, value);
    };
    const api: FormsEngineFormApiContextProps = {
      rollback() {
        const initialValues = getInitialValues();
        Object.keys(initialValues).forEach((fieldId) => {
          internalRollbackValue(initialValues, fieldId);
        });
      },
      rollbackField(fieldId: string) {
        internalRollbackValue(getInitialValues(), fieldId);
      },
      setValuesCheckpoint(values: LookupTable<unknown>) {
        stableFormContextRef.current.originalValues = values;
        stableFormContextRef.current.changedFieldIds.clear();
      }
    };
    return api;
  }, [store]);

  const liveUpdatedItem = useSelection((state) =>
    // If we're in create mode, there's no item yet. If updating, we can get the path from props or parent props in the case of repeat mode.
    create
      ? undefined
      : state.content.itemsByPath[props?.update?.path ?? formsStackData[stackIndex - 1]?.props?.update?.path]
  );

  api.updateProps(stackIndex, props);

  useEffect(() => {
    if (!liveUpdatedItem) {
      setReady(false);
    }
  }, [liveUpdatedItem]);

  useEffect(() => {
    contentTypesById && setContentTypesLoaded(true);
  }, [contentTypesById]);

  // Fetch/prepare requirements
  useEffect(() => {
    // TODO:
    //  - Content type not found
    //  - Item/Content not found
    //  - Invalid params (e.g. create mode without a content type id)
    // TODO: Consider backend that provides all form requirements: form def xml, context xml, sandbox/detailed item, affected workflow, lock(?)
    const previousProps = effectRefs.current.previousProps;
    if (
      // Missing or bad combination of props
      [create, update, repeat].filter(Boolean).length !== 1 ||
      // Update prop but no path
      (update && !update.path?.trim()) ||
      // Create prop but no path or content type id
      (create && (!create.path?.trim() || !create.contentTypeId?.trim())) ||
      // Repeat prop but no field id
      (repeat && !repeat.fieldId?.trim())
    ) {
      setPrepError(InvalidParamsError);
    } else if (
      stableFormContextRef.current.initialized &&
      (!previousProps ||
        // Note: Make sure to include all relevant props here
        areTuplesEqual([
          [create, previousProps.create],
          [fieldsToRender, previousProps.fieldsToRender],
          [readonlyProp, previousProps.readonly],
          [repeat?.fieldId, previousProps.repeat?.fieldId],
          [repeat?.values, previousProps.repeat?.values],
          [stackIndex, previousProps.stackIndex ?? 0],
          [update?.modelId, previousProps.update?.modelId],
          [update?.path, previousProps.update?.path],
          [update?.values, previousProps.update?.values]
        ]))
    ) {
      setReady(true);
    } else if (contentTypesLoaded) {
      // TODO: If props are changed, things can be left off... previous item locked, edits get lost, etc.
      //  Not sure how much support for prop changes we should implement.
      if (stableFormContextRef.current.initialized) {
        console.error('Changing props for the FormsEngine component is not fully supported.');
      }
      const isChildForm = stackIndex > 0;
      // In the form stack, the present form being opened would be in the last position [length-1], the parent form
      // state would be on [length-2] if it is nested (e.g. Root => Component(L1) => Repeat(L2)|Component(L2)). Otherwise,
      // the parent should be the root.
      const parentStackData = isChildForm ? formsStackData[stackIndex - 1] : null;
      const parentAtoms = isChildForm ? parentStackData.atoms : null;
      const {
        id: parentId,
        contentType: parentContentType,
        pathInSite: parentPathInSite,
        path: parentPath
      } = parentStackData?.itemMeta ?? {};
      const initializeState = (
        atoms: FormsEngineAtoms,
        values: LookupTable<unknown>,
        itemMeta: FormsEngineItemMetaContextProps
      ) => {
        stableFormContextRef.current.atoms = atoms;
        stableFormContextRef.current.initialized = true;
        stableFormContextRef.current.originalValues = values;
        stableFormContextRef.current.itemMeta = itemMeta;
        setItemMeta(stableFormContextRef.current.itemMeta);
        setReady(true);
      };
      const createAtom = (
        contentType: ContentType,
        fieldLookup: LookupTable<ContentTypeField>,
        fieldId: string,
        atomsTarget: FormsEngineAtoms,
        value: unknown
      ) => {
        let field = fieldLookup[fieldId];
        if (!field) {
          // TODO: Discuss `folder-name`. When should it be here, when not? Could/should we remove?
          if (fieldId === 'folder-name') {
            field = {
              defaultValue: undefined,
              description: '',
              fields: undefined,
              helpText: '',
              properties: undefined,
              sortable: false,
              type: '',
              validations: undefined,
              values: undefined,
              id: 'folder-name',
              name: 'Folder Name'
            };
          } else {
            !systemFieldsNotInType.includes(fieldId) &&
              console.warn(`Field ${fieldId} not found in content type "${contentType.name}" (${contentType.id})`);
            return;
          }
        }
        const [valueAtom, validityAtom] = createValueAtoms(field, value, stableFormContextRef);
        atomsTarget.valueByFieldId[fieldId] = valueAtom;
        atomsTarget.validationByFieldId[fieldId] = validityAtom;
      };
      if (
        // A repeat group is being opened as a stacked form.
        isChildForm &&
        repeat?.fieldId
      ) {
        const contentType: ContentType = effectRefs.current.contentTypesById[parentContentType.id];
        if (!contentType) {
          return setPrepError(ContentTypeNotFoundError);
        }
        const parentLockResult = store.get(parentAtoms.lockResult);
        const isParentLocked = parentLockResult.locked;
        const lockResultAtom = atom<FormsEngineEditContextProps>({
          locked: isParentLocked,
          lockError: parentLockResult.lockError,
          affectedItemsInWorkflow: parentLockResult.affectedItemsInWorkflow
        });
        const readonlyAtom = createReadonlyAtom(lockResultAtom);
        const atoms: FormsEngineAtoms = {
          isSubmitting: atom(false),
          hasPendingChanges: atom(false),
          valueByFieldId: {},
          validationByFieldId: {},
          lockResult: lockResultAtom,
          readonly: readonlyAtom
        };
        const atomValueCreator: Parameters<typeof createCleanValuesObject>[3] = (fieldId, value) => {
          createAtom(contentType, contentType.fields[repeat.fieldId].fields, fieldId, atoms, value);
        };
        const values =
          repeat.values ??
          createCleanValuesObject(fieldsToRender, {}, effectRefs.current.contentTypesById, atomValueCreator);

        // If repeat.values was provided, `createCleanValuesObject` didn't run; hence, atomValueCreator needs to be run manually.
        repeat.values && Object.keys(values).forEach((fieldId) => atomValueCreator(fieldId, values[fieldId]));

        initializeState(atoms, values, {
          id: parentId,
          path: parentPath,
          sourceMap: null,
          pathInSite: parentPathInSite,
          contentType: parentContentType
        });
      } else if (
        // An embedded component is being opened as a stacked form.
        isChildForm &&
        update?.modelId
      ) {
        const contentType: ContentType =
          effectRefs.current.contentTypesById[update.values[XmlKeys.contentTypeId] as string];
        if (!contentType) {
          return setPrepError(ContentTypeNotFoundError);
        }
        const parentLockResult = store.get(parentAtoms.lockResult);
        const isParentLocked = parentLockResult.locked;
        const isParentReadonly = store.get(parentAtoms.readonly);
        const readonly = readonlyProp ?? isParentReadonly;
        const atoms: FormsEngineAtoms = {
          isSubmitting: atom(false),
          hasPendingChanges: atom(false),
          valueByFieldId: {},
          validationByFieldId: {},
          lockResult: null,
          readonly: null
        };
        const values = update.values;
        Object.entries(values).forEach(([fieldId, value]) => {
          const [valueAtom, validityAtom] = createValueAtoms(contentType.fields[fieldId], value, stableFormContextRef);
          atoms.valueByFieldId[fieldId] = valueAtom;
          atoms.validationByFieldId[fieldId] = validityAtom;
        });
        const setStateValues = (locked: boolean, lockError: ApiResponse, affectedItemsInWorkflow: SandboxItem[]) => {
          const lockResultAtom = atom<FormsEngineEditContextProps>({
            locked,
            lockError,
            affectedItemsInWorkflow
          });
          atoms.lockResult = lockResultAtom;
          atoms.readonly = createReadonlyAtom(lockResultAtom);
          initializeState(atoms, values, {
            id: values[XmlKeys.modelId] as string,
            path: update.path,
            sourceMap: null,
            pathInSite: parentPathInSite,
            contentType: contentType
          });
        };

        if (readonly === isParentReadonly) {
          setStateValues(isParentLocked, parentLockResult.lockError, parentLockResult.affectedItemsInWorkflow);
        } else {
          const sub = internalLockContentService(siteId, update.path).subscribe((result) => {
            setStateValues(result.locked, result.lockError, result.affectedItemsInWorkflow);
          });
          return () => sub.unsubscribe();
        }
      } else if (
        // Create mode (stacked or not)
        create
      ) {
        // Create mode
        const dateIsoString = new Date().toISOString();
        const newModelId = uuid();
        const contentType = effectRefs.current.contentTypesById[create.contentTypeId];
        if (!contentType) {
          return setPrepError(ContentTypeNotFoundError);
        }
        const lockResultAtom = atom<FormsEngineEditContextProps>({
          locked: false,
          lockError: null,
          affectedItemsInWorkflow: null
        });
        const atoms: FormsEngineAtoms = {
          isSubmitting: atom(false),
          hasPendingChanges: atom(false),
          valueByFieldId: {},
          validationByFieldId: {},
          lockResult: lockResultAtom,
          readonly: createReadonlyAtom(lockResultAtom)
        };
        const values = createCleanValuesObject(
          contentType.fields,
          {
            [XmlKeys.modelId]: newModelId,
            [XmlKeys.contentTypeId]: contentType.id,
            'display-template': contentType.displayTemplate,
            'no-template-required': Boolean(contentType.displayTemplate ? 'false' : 'true'),
            'merge-strategy': 'inherit-levels',
            createdDate: dateIsoString,
            createdDate_dt: dateIsoString,
            lastModifiedDate: dateIsoString,
            lastModifiedDate_dt: dateIsoString
          },
          contentTypesById,
          (fieldId, value) => {
            createAtom(contentType, contentType.fields, fieldId, atoms, value);
          }
        );

        initializeState(atoms, values, {
          id: newModelId,
          // TODO: Should/can we somehow deduce the target path?
          path: null,
          // TODO: Sourcemap? How can we determine what would be inherited by this content? New API?
          sourceMap: null,
          pathInSite: create.path,
          contentType
        });
      } /* if (isUpdateMode) */ else {
        const subscription = fetchRequirements({
          siteId,
          path: update.path,
          modelId: update.modelId,
          readonly: readonlyProp,
          contentTypesById
        })
          .pipe(
            catchError((error: AjaxError | symbol) => {
              if (typeof error === 'symbol') {
                return of(error);
              }
              switch (error.status) {
                case 404:
                  return of(ItemNotFoundError);
                default:
                  console.error(error);
                  return of(UnknownError);
              }
            })
          )
          .subscribe((requirements) => {
            if (typeof requirements === 'symbol') {
              return setPrepError(requirements);
            }
            dispatch(fetchDetailedItemComplete(requirements.item));
            const lockResultAtom = atom<FormsEngineEditContextProps>({
              locked: requirements.locked,
              lockError: requirements.lockError,
              affectedItemsInWorkflow: requirements.affectedItemsInWorkflow
            });
            const atoms: FormsEngineAtoms = {
              isSubmitting: atom(false),
              hasPendingChanges: atom(false),
              valueByFieldId: {},
              validationByFieldId: {},
              lockResult: lockResultAtom,
              readonly: createReadonlyAtom(lockResultAtom)
            };
            const values = createCleanValuesObject(
              requirements.contentType.fields,
              requirements.contentObject,
              contentTypesById,
              (fieldId, value) => {
                createAtom(requirements.contentType, requirements.contentType.fields, fieldId, atoms, value);
              }
            );
            initializeState(atoms, values, {
              id: values[XmlKeys.modelId] as string,
              path: requirements.item.path,
              // TODO: Sourcemap? How can we determine what would be inherited by this content? New API?
              sourceMap: requirements.sourceMap,
              pathInSite: requirements.pathInSite,
              contentType: requirements.contentType
            });
          });
        return () => subscription.unsubscribe();
      }
    }
  }, [
    contentTypesById,
    contentTypesLoaded,
    create,
    dispatch,
    effectRefs,
    fieldsToRender,
    formsStackData,
    readonlyProp,
    repeat,
    siteId,
    stackIndex,
    store,
    update
  ]);

  if (prepError) {
    let error: ReactNode;
    // TODO: Improve errors
    switch (prepError) {
      case ItemNotFoundError:
        error = <FormattedMessage defaultMessage="The item was not found" />;
        break;
      case ContentTypeNotFoundError:
        error = <FormattedMessage defaultMessage="The content type was not found" />;
        break;
      case InvalidParamsError:
        error = <FormattedMessage defaultMessage="The form was opened with an incorrect set of arguments" />;
        break;
      case UnknownError:
      default:
        error = <FormattedMessage defaultMessage="An error occurred preparing the form" />;
        break;
    }
    return <ErrorState title="Error" message={error} />;
  } else if (
    ready &&
    // Create doesn't need the liveUpdateItem, but otherwise, it should be preset before proceeding to rendering a form
    (create || liveUpdatedItem)
  ) {
    return (
      <FormsEngineFormContextApi.Provider value={contextApi}>
        <StableFormContext.Provider value={stableFormContextRef.current}>
          <ItemContext.Provider value={liveUpdatedItem}>
            <ItemMetaContext.Provider value={itemMeta}>
              <Form {...props} />
            </ItemMetaContext.Provider>
          </ItemContext.Provider>
        </StableFormContext.Provider>
      </FormsEngineFormContextApi.Provider>
    );
  } else {
    return (
      <LoadingState
        sx={{ height: getTargetHeight(isDialog, isFullScreen, theme) }}
        title={<FormattedMessage defaultMessage="Please wait" />}
        subtitle={<FormattedMessage defaultMessage="Gathering content information" />}
      />
    );
  }
}

function Form(props: FormsEngineProps) {
  // region const {...} = props
  const {
    create,
    update,
    repeat,
    stackIndex = 0,
    stackTransitionEnded,
    fieldsToRender,
    isDialog = false,
    onSave,
    onClose: onCloseProp
  } = props;
  // endregion
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const { guestBase } = useEnv();
  const dispatch = useDispatch();
  const activeSite = useActiveSite();
  const siteId = activeSite.id;
  const contentTypesById = useContentTypes();
  const containerRef = useRef<HTMLDivElement>();
  const [containerStats, setContainerStats] = useState<{
    // TODO: Not using all of this. Clean up.
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    isLargeContainer: boolean;
  }>(null);
  const [openDrawerSidebar, setOpenDrawerSidebar] = useState(false);
  const {
    isFullScreen = false,
    updateSubmittingOrHasPendingChanges,
    onClose: enhancedDialogOnClose
  } = useEnhancedDialogContext() ?? {};
  const [disableStackedFormDrawerAutoFocus, setDisableStackedFormDrawerAutoFocus] = useState(true);
  const [enablingEditInProgress, setEnablingEditInProgress] = useState(false);
  const [acceptedWorkflowCancellation, setAcceptedWorkflowCancellation] = useState(false);
  const [collapsedToC, setCollapsedToC] = useState(false); // Controls the Table of Contents being collapsed under a drawer or visible
  const store = useStore();
  const { api: contextApi, formsStackData } = useContext(StableGlobalContext);
  const stableFormContext = useContext(StableFormContext);
  const formContextApi = useContext(FormsEngineFormContextApi);
  const { fieldUpdates$, changedFieldIds, state: stateCache } = stableFormContext;
  const item = useContext(ItemContext);
  const { id, contentType, sourceMap } = useContext(ItemMetaContext);
  const [isSubmitting, setIsSubmitting] = useAtom(stableFormContext.atoms.isSubmitting);
  const [hasPendingChanges, setHasPendingChanges] = useAtom(stableFormContext.atoms.hasPendingChanges);
  const readonly = useAtomValue(stableFormContext.atoms.readonly);
  const [lockStatus, setLockStatus] = useAtom(stableFormContext.atoms.lockResult);
  const [sectionExpandedState, setSectionExpandedState] = useState<LookupTable<boolean>>(
    () => stateCache?.sectionExpandedState ?? buildSectionExpandedState(contentType.sections)
  );
  const [activeTab, setActiveTab] = useState<number>(0);
  const [versionComment, setVersionComment] = useAtom(versionCommentAtom);
  const stackFormCount = useAtomValue(stackFormCountAtom);
  const isStackedForm = stackIndex > 0;
  const hasStackedForms = !isStackedForm && stackFormCount > 0;
  const effectRefs = useUpdateRefs({
    store,
    contentTypesById,
    stackIndex,
    fieldsToRender,
    sectionExpandedState,
    collapsedToC
  });

  // Restore previous scroll position if provided.
  const previousScrollTopPosition = stateCache?.previousScrollTopPosition;
  useLayoutEffect(() => {
    // Only a single stacked form is rendered at a time, so the scroll position of stacked forms is stored before opening a new one for later restoration here.
    if (containerRef.current != null && previousScrollTopPosition != null) {
      // Restore the previous scroll position
      const container: HTMLElement = getScrollContainer(containerRef.current);
      container.scrollTop = previousScrollTopPosition;
    }
    // Once mounted back, clean the state cache. Assumes everything should have grabbed the cached values by now.
    // contextApi.deleteStateCache(stackIndex);
    return () => {
      // Getting the count directly from the store provides the latest value. React may not have been updated `stackFormCount` yet.
      const currentCount = effectRefs.current.store.get(stackFormCountAtom);
      // If the count is greater than the stackIndex, a new form is being opened, so store the scroll position before dismounting.
      if (currentCount > stackIndex) {
        contextApi.setStateCache(stackIndex, {
          collapsedToC: effectRefs.current.collapsedToC,
          previousScrollTopPosition: getScrollContainer(containerRef.current).scrollTop,
          sectionExpandedState: effectRefs.current.sectionExpandedState
        });
      }
    };
  }, [contextApi, effectRefs, previousScrollTopPosition, stackIndex]);

  // Version comment generator
  useEffect(() => {
    const produceMessage = (fieldsChanged: string[]) => {
      if (fieldsChanged.length === 0) return '';
      return fieldsChanged.length > 1
        ? `Updated ${fieldsChanged.slice(0, -1).join(', ')} and ${fieldsChanged[fieldsChanged.length - 1]}`
        : `Updated ${fieldsChanged[fieldsChanged.length - 1]}`;
    };
    const sub = fieldUpdates$.pipe(debounceTime(300)).subscribe(() => {
      // String-type fields have auto-rollback detection; the fieldUpdates$ will emit anyway. Checking if the fieldId
      // emitted is in changedFieldIds should tell if the field was rolled back.
      setHasPendingChanges(changedFieldIds.size > 0);
      const fieldsToRender = contentType.fields;
      if (effectRefs.current.fieldsToRender) {
        effectRefs.current.fieldsToRender.forEach((field) => {
          fieldsToRender[field.id] = field;
        });
      }
      const fieldsChanged = Array.from(changedFieldIds).flatMap(
        (f) => fieldsToRender[f === 'folder-name' ? 'file-name' : f]?.name ?? []
      );
      const currentMessage = store.get(versionCommentAtom).trim();
      const newMessage = produceMessage(fieldsChanged);
      if (
        // If message is blank, no point in checking if the user has altered the message.
        currentMessage !== '' &&
        // A repeated field is reporting changes, no need to set
        (currentMessage === newMessage ||
          // The version comment hasn't been manually altered by the user (i.e. if the current message is the same
          // as the message generated without the last field added to changedFieldIds, we can assume the message
          // has not been altered by user input)
          currentMessage !== produceMessage(fieldsChanged.slice(0, -1)))
      ) {
        // Do not set a new message
        return;
      }
      store.set(versionCommentAtom, newMessage);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [changedFieldIds, contentType.fields, effectRefs, setHasPendingChanges, fieldUpdates$, store]);

  const sourceMapPaths = useMemo(() => (sourceMap ? Object.values(sourceMap).map((path) => path) : []), [sourceMap]);
  useFetchSandboxItems(sourceMapPaths);

  // Resize observer attached to the [scroll] container
  useLayoutEffect(() => {
    if (containerRef.current) {
      const resize$ = new Subject<void>();
      const container: HTMLElement = getScrollContainer(containerRef.current);
      const setValues = (rect: DOMRect) => {
        const width = rect.width;
        container.style.setProperty('--container-width', `${width}px`);
        container.style.setProperty('--container-height', `${rect.height}px`);
        setContainerStats({
          x: rect.x,
          y: rect.y,
          top: rect.top,
          right: rect.right,
          left: rect.left,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          isLargeContainer: width >= theme.breakpoints.values.lg
        });
      };
      const resizeObserver = new ResizeObserver(() => {
        resize$.next();
      });
      const subscription = resize$.pipe(debounceTime(300)).subscribe(() => {
        setValues(container.getBoundingClientRect());
      });
      resizeObserver.observe(document.documentElement);
      return () => {
        resizeObserver.disconnect();
        subscription.unsubscribe();
      };
    }
  }, [
    theme.breakpoints.values.lg,
    // `isFullScreen` isn't used inside the effect but want to trigger the calculations when changed.
    isFullScreen
  ]);

  // Freeze/manage scroll when stacked forms are open, and set the --scroll-top css property for stacked
  // forms to position themselves at the right position.
  useLayoutEffect(() => {
    if (hasStackedForms) {
      const scrollContainer = getScrollContainer(containerRef.current);
      // Store the current scroll position to restore
      const scrollTop = scrollContainer.scrollTop;
      const scrollLeft = scrollContainer.scrollLeft;
      // Disable scrolling
      scrollContainer.style.overflow = 'hidden';
      // Restore the scroll position
      scrollContainer.scrollTop = scrollTop;
      scrollContainer.scrollLeft = scrollLeft;
      scrollContainer.style.setProperty('--scroll-top', `${scrollTop}px`);
      return () => {
        scrollContainer.style.overflow = '';
      };
    }
  }, [hasStackedForms]);

  // If rendered in a dialog, update the dialog's isSubmitting and hasPendingChanges. Only the root form.
  // Stacked forms have their own changes and submit state management.
  useEffect(() => {
    if (!isStackedForm) {
      updateSubmittingOrHasPendingChanges?.({ isSubmitting, hasPendingChanges });
    }
  }, [isSubmitting, hasPendingChanges, isStackedForm, updateSubmittingOrHasPendingChanges]);

  // If the form is rendered in/as a dialog, take up the whole screen minus
  // top/bottom margins (2 top, 2 bottom). If not a dialog, take up the whole screen.
  const targetHeight = getTargetHeight(isDialog, isFullScreen, theme);

  const affectsWorkflowItems = lockStatus.affectedItemsInWorkflow?.length > 0;
  const isEmbedded = Boolean(update?.modelId);
  const isCreateMode = Boolean(create?.path);
  const isRepeatMode = Boolean(repeat?.fieldId);
  const isLargeContainer = containerStats?.isLargeContainer;
  const contentTypeFields = contentType.fields;
  const contentTypeSections = contentType.sections;
  const objectId = id;

  const handleSectionExpandedChange = (fieldId: string, expanded: boolean) => {
    setSectionExpandedState({
      ...sectionExpandedState,
      [fieldId]: expanded
    });
  };
  const handleOpenDrawerSidebar = () => {
    const scroller = getScrollContainer(containerRef.current);
    scroller.style.setProperty('--scroll-top', `${containerRef.current.scrollTop}px`);
    scroller.style.overflowY = 'hidden';
    setOpenDrawerSidebar(true);
  };
  const handleCloseDrawerSidebar: DrawerProps['onClose'] = () => {
    containerRef.current.style.overflowY = '';
    setOpenDrawerSidebar(false);
  };
  const handleCloseDrawerForm: DrawerProps['onClose'] = () => {
    if (!hasStackedForms) return;
    const childState = {
      isSubmitting: store.get(formsStackData[formsStackData.length - 1].atoms.isSubmitting),
      hasPendingChanges: store.get(formsStackData[formsStackData.length - 1].atoms.hasPendingChanges),
      readonly: store.get(formsStackData[formsStackData.length - 1].atoms.readonly)
    };
    // Note: This is executed in the context of the parent form.
    // Executed in the case of escape, backdrop click or form close button click.
    const doClose = () => {
      // Unlock item if necessary
      const childProps = formsStackData[formsStackData.length - 1].props;
      // If it is not an "update" (e.g. repeat, create), should not unlock.
      if (!childState.readonly && childProps.update) {
        // No model id means it is a shared component and should be unlocked.
        let shouldUnlock = !childProps.update.modelId;
        if (!shouldUnlock) {
          // This is an embedded component...
          // Unlock only if the parent form is readonly since, unlocking the embedded means unlocking the parent
          // document hence, if parent form is not readonly, it is being edited and shouldn't be unlocked.
          // This logic assumes the form stack is sequential so the parent component would be right before in the state stack.
          shouldUnlock = store.get(formsStackData[formsStackData.length - 2].atoms.readonly);
        }
        shouldUnlock && internalUnlockContentService(siteId, childProps.update?.path).subscribe();
      }
      // Only unlock scroll if this is the last item in the forms stack
      childProps.stackIndex === 0 && (containerRef.current.style.overflowY = '');
      contextApi.popForm();
    };
    if (childState.isSubmitting) {
      displayFormBeingSavedSnack(dispatch, formatMessage);
    } else if (childState.hasPendingChanges) {
      displayWithPendingChangesConfirm(dispatch, doClose);
    } else {
      doClose();
    }
  };
  // region const tableOfContents = (...)
  const useCollapsedToC = isLargeContainer ? collapsedToC : true;
  const tableOfContents = (
    <TableOfContents
      handleSectionExpandedChange={handleSectionExpandedChange}
      atoms={stableFormContext.atoms}
      fieldsToRender={fieldsToRender}
      containerRef={containerRef}
      contentTypeFields={contentTypeFields}
      contentTypeSections={contentTypeSections}
      sectionExpandedState={sectionExpandedState}
      setOpenDrawerSidebar={setOpenDrawerSidebar}
    />
  );
  // endregion

  const currentStackedFormProps = hasStackedForms ? formsStackData[formsStackData.length - 1].props : null;
  let stackedFormKey = undefined;
  if (hasStackedForms) {
    if (currentStackedFormProps.update) {
      stackedFormKey = `${currentStackedFormProps.update.path}_${currentStackedFormProps.update.modelId ?? ''}_${stackFormCount}`;
    } else if (currentStackedFormProps.create) {
      stackedFormKey = `${currentStackedFormProps.create.path}_${currentStackedFormProps.create.contentTypeId}_${stackFormCount}`;
    } else if (currentStackedFormProps.repeat) {
      stackedFormKey = `${currentStackedFormProps.repeat.fieldId}_${stackFormCount}`;
    }
  }

  const disableSave = isSubmitting || (affectsWorkflowItems && !acceptedWorkflowCancellation);
  const handleSave: ButtonProps['onClick'] = (e) => {
    setIsSubmitting(isSubmitting);
    setTimeout(() => {
      const values = extractValueAtoms(store, stableFormContext.atoms.valueByFieldId);
      const xml = buildContentXml(values, contentTypesById);
      const dom = fromString(xml);
      setIsSubmitting(false);
      setHasPendingChanges(false);
      formContextApi.setValuesCheckpoint(values);
      const instructions = onSave?.({ dom, xml, values });
      if (instructions?.close) {
        setTimeout(() => {
          // Executing the onClose without the timeout, causes values set at the control prior to closing to get lost somehow.
          // Putting the timeout at the control works too, but prefer to simply it for controls and absorb the complexity here.
          (isStackedForm ? onCloseProp : enhancedDialogOnClose)?.(e, null);
        });
      }
    }, 1000);
  };

  const updateEditEnablement = (enableEdit: boolean, callback?: (lockResult: FormsEngineEditContextProps) => void) => {
    if (enablingEditInProgress || isCreateMode) return;
    const doEditEnablement = (restoreValues: boolean = false) => {
      // TODO: Re-fetch content when enabling edit?
      setEnablingEditInProgress(true);
      const service = enableEdit ? internalLockContentService : internalUnlockContentService;
      service(siteId, item.path).subscribe((lockResult) => {
        setEnablingEditInProgress(false);
        setHasPendingChanges(false);
        if (restoreValues) {
          formContextApi.rollback();
        }
        setLockStatus({
          locked: lockResult.locked,
          lockError: lockResult.lockError,
          affectedItemsInWorkflow: lockResult?.affectedItemsInWorkflow ?? null
        });
        callback?.(lockResult);
      });
    };
    // If hasPendingChanges, should prompt user to save before enabling edit.
    if (!enableEdit && hasPendingChanges) {
      return displayWithPendingChangesConfirm(
        dispatch,
        () => doEditEnablement(true),
        <FormattedMessage defaultMessage="Discard unsaved changes?" />
      );
    }
    doEditEnablement();
  };

  const handleEnableEditing: ButtonProps['onClick'] = () => {
    updateEditEnablement(true);
  };

  const handleDisableEditing: ButtonProps['onClick'] = () => {
    updateEditEnablement(false);
  };

  let handleClose: ButtonProps['onClick'];
  if (enhancedDialogOnClose || onCloseProp) {
    handleClose = (e) => {
      const doClose = () => {
        // Stacked forms receive the onClose prop from the parent form.
        (isStackedForm ? onCloseProp : enhancedDialogOnClose)(e, null);
      };
      if (isSubmitting) {
        displayFormBeingSavedSnack(dispatch, formatMessage);
      } else if (hasPendingChanges) {
        // This is assuming the EnhancedDialog will handle showing the close without saving confirm.
        doClose();
      } else if (
        readonly ||
        // If is an embedded component opened as a stacked form, unlocking is necessary only if the
        // parent readonly status is different from that of the present component.
        // Is embedded? Is stacked? The parent state matches readonly status.
        (isEmbedded &&
          isStackedForm &&
          Boolean(readonly) === Boolean(store.get(formsStackData[stackIndex - 1].atoms.readonly)))
      ) {
        doClose();
      } else {
        internalUnlockContentService(siteId, item.path).subscribe(() => {
          doClose();
        });
      }
    };
  }

  const bodyFragment = (
    <Box
      ref={containerRef}
      data-model-id={objectId}
      data-area-id="formContainer"
      sx={{
        display: 'flex',
        height: targetHeight,
        flexDirection: 'column',
        position: 'relative',
        overflow: 'auto',
        '.space-y > :not([hidden]) ~ :not([hidden])': { mt: 1 },
        '.space-y-half > :not([hidden]) ~ :not([hidden])': { mt: 0.5 },
        '.space-x > :not([hidden]) ~ :not([hidden])': { ml: 1 },
        '.space-y-2 > :not([hidden]) ~ :not([hidden])': { mt: 2 }
      }}
    >
      <UIBlocker open={isSubmitting} />
      <Paper square component="header" data-area-id="formHeader" elevation={0}>
        <Box component={Container} display="flex" alignItems="center" justifyContent="space-between" pt={2}>
          <Typography variant="body2" color="textSecondary">
            <span title={siteId}>{activeSite.name}</span> / <span title={contentType.id}>{contentType.name}</span>
          </Typography>
          <div>
            {props.onMinimize && (
              <Tooltip title={<FormattedMessage defaultMessage="Miminize" />}>
                <IconButton size="small" onClick={props.onMinimize}>
                  <MinimizeIconRounded />
                </IconButton>
              </Tooltip>
            )}
            {(props.onCancelFullScreen || props.onFullScreen) && (
              <Tooltip title={<FormattedMessage defaultMessage="Maximize" />}>
                <IconButton size="small" onClick={isFullScreen ? props.onCancelFullScreen : props.onFullScreen}>
                  {isFullScreen ? <CloseFullscreenOutlined /> : <MaximiseIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            {handleClose && (
              <Tooltip title={<FormattedMessage defaultMessage="Close" />}>
                <IconButton size="small" onClick={handleClose}>
                  <Close />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </Box>
        {isRepeatMode ? (
          <Container sx={{ py: 1 }}>
            <Typography variant="h6" component="h3">
              Item # {repeat.index + 1}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <FormattedMessage
                defaultMessage="{name} Repeat Group"
                values={{ name: contentType.fields[repeat.fieldId].name }}
              />
            </Typography>
          </Container>
        ) : isCreateMode ? (
          <CreateModeHeader contentType={contentType} path={create?.path} />
        ) : (
          <EditModeHeader
            handleTabChange={(e, value) => setActiveTab(value)}
            isLargeContainer={isLargeContainer}
            useCollapsedToC={useCollapsedToC}
            setCollapsedToC={setCollapsedToC}
            isEmbedded={isEmbedded}
            atoms={stableFormContext.atoms}
            theme={theme}
            objectId={objectId}
            activeTab={activeTab}
          />
        )}
        <Divider />
      </Paper>
      <Box
        sx={{
          display: activeTab === 0 ? 'inherit' : 'none',
          px: 0,
          py: 2,
          backgroundColor: theme.palette.background.default
        }}
      >
        <Container maxWidth={isLargeContainer ? 'xl' : undefined}>
          <Grid container spacing={2}>
            <Grid item xs={useCollapsedToC ? 'auto' : true}>
              <StickyBox data-area-id="stickySidebar">
                {useCollapsedToC ? (
                  <IconButton size="small" onClick={handleOpenDrawerSidebar}>
                    <MenuRounded />
                  </IconButton>
                ) : (
                  tableOfContents
                )}
              </StickyBox>
            </Grid>
            <Grid item xs={useCollapsedToC ? 8.3 : 7} className="space-y" data-area-id="formBody">
              {affectsWorkflowItems && (
                <Alert
                  severity="warning"
                  variant="outlined"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        dispatch(
                          pushDialog({
                            component: 'craftercms.components.WorkflowCancellationDialog',
                            props: { items: lockStatus.affectedItemsInWorkflow } as WorkflowCancellationDialogProps
                          })
                        );
                      }}
                    >
                      Review
                    </Button>
                  }
                >
                  <AlertTitle>
                    <FormattedMessage defaultMessage="Publish Cancellation Warning" />
                  </AlertTitle>
                  <FormattedMessage defaultMessage="The item is part of a publishing package. Editing it will cancel the entire package." />
                </Alert>
              )}
              {lockStatus.lockError && (
                <Alert severity="error">
                  {createErrorStatePropsFromApiResponse(lockStatus.lockError, formatMessage).message}
                </Alert>
              )}
              {fieldsToRender ? (
                <Paper sx={{ p: 2 }}>
                  {fieldsToRender.map((field, index) =>
                    renderFieldControl(
                      field,
                      stableFormContext.atoms.valueByFieldId,
                      index === 0,
                      readonly,
                      contentType
                    )
                  )}
                </Paper>
              ) : (
                contentTypeSections.map((section, sectionIndex) => (
                  <Accordion
                    key={sectionIndex}
                    expanded={sectionExpandedState[section.title]}
                    onChange={(event, expanded) => {
                      handleSectionExpandedChange(event.currentTarget.getAttribute('data-section-id'), expanded);
                    }}
                    sx={{
                      borderLeftColor: toColor(section.title, 0.7),
                      borderLeftWidth: 5,
                      borderLeftStyle: 'solid',
                      borderTopLeftRadius: theme.shape.borderRadius,
                      borderBottomLeftRadius: theme.shape.borderRadius,
                      borderTopRightRadius: theme.shape.borderRadius,
                      borderBottomRightRadius: theme.shape.borderRadius
                    }}
                  >
                    <AccordionSummary data-section-id={section.title}>{section.title}</AccordionSummary>
                    <AccordionDetails className="space-y-2">
                      {section.fields.map((fieldId, fieldIndex) =>
                        renderFieldControl(
                          contentTypeFields[fieldId],
                          stableFormContext.atoms.valueByFieldId,
                          sectionIndex === 0 && fieldIndex === 0,
                          readonly,
                          contentType
                        )
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
              {/* Spacer */}
              <Box minHeight={100} justifyContent="center" alignItems="center" display="flex">
                <Tooltip title={<FormattedMessage defaultMessage="Back to top" />}>
                  <Fab onClick={() => containerRef.current.scroll({ top: 0, behavior: 'smooth' })}>
                    <ArrowUpward />
                  </Fab>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs>
              <StickyBox className="space-y">
                {readonly ? (
                  <>
                    <Alert severity="info" variant="outlined" icon={<EditOffOutlined />}>
                      <FormattedMessage defaultMessage="Readonly mode" />
                    </Alert>
                    <SecondaryButton
                      fullWidth
                      variant="outlined"
                      onClick={handleEnableEditing}
                      loading={enablingEditInProgress}
                    >
                      <FormattedMessage defaultMessage="Edit" />
                    </SecondaryButton>
                  </>
                ) : (
                  <>
                    {hasPendingChanges ? (
                      <Grow in={hasPendingChanges}>
                        <Paper sx={{ p: 1 }} className="space-y-half">
                          <TextField
                            size="small"
                            multiline
                            fullWidth
                            label={<FormattedMessage defaultMessage="Version Comment" />}
                            value={versionComment}
                            onChange={(e) => setVersionComment(e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <div>
                            {affectsWorkflowItems && (
                              <FormControlLabel
                                title={formatMessage({
                                  defaultMessage:
                                    'The item is part of a publishing package. Editing it will cancel the entire package.'
                                })}
                                label={<FormattedMessage defaultMessage="Accept publish cancellation" />}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={acceptedWorkflowCancellation}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                      setAcceptedWorkflowCancellation(e.target.checked);
                                    }}
                                  />
                                }
                              />
                            )}
                            <FormControlLabel
                              label={<FormattedMessage defaultMessage="Close after saving" />}
                              control={<Checkbox size="small" checked={false} />}
                            />
                          </div>
                          <PrimaryButton
                            fullWidth
                            variant="contained"
                            onClick={handleSave}
                            disabled={disableSave}
                            loading={isSubmitting}
                          >
                            <FormattedMessage defaultMessage="Save" />
                          </PrimaryButton>
                          {isStackedForm && isEmbedded && (
                            <FormHelperText sx={{ textAlign: 'center' }}>
                              <FormattedMessage defaultMessage="Changes are saved with the main item." />
                            </FormHelperText>
                          )}
                        </Paper>
                      </Grow>
                    ) : (
                      <Alert severity="info" variant="outlined">
                        <FormattedMessage defaultMessage="No changes detected" />
                      </Alert>
                    )}
                    {!isCreateMode && (
                      <>
                        {/* For embedded components, only allow releasing the lock if it's the top form.
                        If is a stacked form, only release via the parent form. */}
                        {!readonly && !(isEmbedded && isStackedForm) && (
                          <SecondaryButton
                            fullWidth
                            variant="outlined"
                            onClick={handleDisableEditing}
                            loading={enablingEditInProgress}
                          >
                            <FormattedMessage defaultMessage="Unlock" />
                          </SecondaryButton>
                        )}
                        {/* For embedded components, only allow publishing if it's the top form.
                        If is a stacked form, publish via the parent form. */}
                        {!(isEmbedded && isStackedForm) && (
                          <>
                            <Button fullWidth variant="outlined">
                              <FormattedMessage defaultMessage="Publish" />
                            </Button>
                            <Button fullWidth variant="outlined">
                              <FormattedMessage defaultMessage="Unpublish" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                {handleClose && (
                  <Button fullWidth variant="outlined" disabled={enablingEditInProgress} onClick={handleClose}>
                    <FormattedMessage defaultMessage="Close" />
                  </Button>
                )}
              </StickyBox>
            </Grid>
          </Grid>
        </Container>
      </Box>
      {/* region Other tabs... */}
      {/* TODO: All tabs other than 0 should be pluggable? */}
      {activeTab === 1 && (
        <IFrame
          url={guestBase}
          title="Preview"
          sx={{ display: 'flex', flex: '1' }}
          styles={{ iframe: { height: null } }}
        />
      )}
      {/* endregion */}
      {/* region Stacked Form Drawer */}
      {stackIndex === 0 && (
        <Drawer
          open={hasStackedForms}
          anchor="right"
          variant="temporary"
          disablePortal
          data-area-id="stackedFormDrawer"
          onClose={handleCloseDrawerForm}
          // Autofocus combined with absolute positioning (as opposed to the default fixed) causes the
          // scroll position to jump off the page (where the drawer panel is shown at) and looks like it
          // is the background element the one that's moving/animating in a jittery fashion.
          disableAutoFocus={disableStackedFormDrawerAutoFocus}
          onTransitionExited={() => {
            setDisableStackedFormDrawerAutoFocus(true);
          }}
          onTransitionEnd={
            // onTransitionEnd keeps triggering after the Drawer transition has finished on certain interactions (e.g. when hovering buttons)
            // This callback is also invoked during other transitions other than the Drawer's open transition.
            disableStackedFormDrawerAutoFocus
              ? (e) => {
                  // Make sure it is the drawer paper that finished transitioning before considering the transition complete.
                  if ((e.target as HTMLElement).getAttribute('data-area-id') !== 'stackedFormDrawerPaper') return;
                  const paper = containerRef.current.querySelector(
                    `[data-area-id="stackedFormDrawer"] .${drawerClasses.paper}`
                  ) as HTMLDivElement;
                  // TODO: Could paper ever be null here?
                  // Check that the focus was moved inside the paper by the autoFocus prop in the control.
                  // If focus is not on the paper, move it to it.
                  if (!paper.contains(document.activeElement)) {
                    paper.focus();
                  }
                  setDisableStackedFormDrawerAutoFocus(false);
                }
              : undefined
          }
          sx={{
            top: 'var(--scroll-top)',
            position: 'absolute',
            [`& > .${paperClasses.root}`]: {
              top: 0,
              width: 'calc(var(--container-width) - 100px)',
              height: isDialog ? `var(--container-height)` : '100vh',
              position: 'absolute'
            }
          }}
          PaperProps={{ 'data-area-id': 'stackedFormDrawerPaper' }}
        >
          {hasStackedForms && (
            <Prepper
              key={stackedFormKey}
              stackIndex={formsStackData.length - 1}
              {...currentStackedFormProps}
              stackTransitionEnded={!disableStackedFormDrawerAutoFocus}
              isDialog={isDialog}
              onClose={handleCloseDrawerForm}
            />
          )}
        </Drawer>
      )}
      {/* endregion */}
      {/* region Sidebar Drawer */}
      <Drawer
        open={openDrawerSidebar}
        variant="temporary"
        disablePortal
        // The transitionDuration is set to 0 for when closing so it doesn't impede the scrollIntoView
        // in case a section/field was clicked. Ideally, the transition would still occur in the case of
        // closing the drawer without a section/field clicked (i.e. escape key or backdrop click), but
        // that would require an additional piece of state, so leaving like this for now.
        transitionDuration={openDrawerSidebar ? undefined : 0}
        onClose={handleCloseDrawerSidebar}
        sx={{
          position: 'absolute',
          [`& > .${paperClasses.root}`]: {
            p: 2,
            top: 'var(--scroll-top)',
            width: 300,
            height: isDialog ? `var(--container-height)` : '100vh',
            position: 'absolute'
          }
        }}
      >
        {tableOfContents}
      </Drawer>
      {/* endregion */}
    </Box>
  );

  return (
    // The Fade provides some transitioning for the stacked forms that show without the Slide
    // transition since the Drawer is already open and there's only one.
    isStackedForm ? <Fade in={stackTransitionEnded} mountOnEnter children={bodyFragment} /> : bodyFragment
  );
}

interface ControlWrapperProps {
  field: ContentTypeField;
  autoFocus: boolean;
  readonly: boolean;
  contentType: ContentType;
  atom: Atom<unknown>;
}

const ControlWrapper = memo(function (props: ControlWrapperProps) {
  const siteId = useActiveSiteId();
  const { field, autoFocus, readonly, contentType, atom } = props;
  const [value, setValue] = useAtom(atom);
  const fieldId = field.id;
  let Control: ElementType<ControlProps>;
  if (field.properties.plugin) {
    const url = buildFileUrl(
      siteId,
      field.properties.plugin.type,
      field.properties.plugin.name,
      field.properties.plugin.filename,
      field.properties.plugin.pluginId
    );
    if (!lazyControlMap.has(url)) addLazyControl(url);
    Control = lazyControlMap.get(url);
  } else {
    Control = controlMap[field.type] ?? UnknownControl;
  }
  return (
    <ErrorBoundary key={fieldId}>
      <Suspense fallback={<ControlSkeleton label={field.name} />}>
        <Control
          // Only auto-focus on controls that are not readonly.
          // Focus might not work consistently on disabled controls anyway.
          autoFocus={autoFocus && !readonly}
          value={value}
          setValue={setValue}
          field={field}
          contentType={contentType}
          readonly={readonly}
        />
      </Suspense>
    </ErrorBoundary>
  );
});

function ControlPluginError({ field }: ControlProps) {
  return (
    <FormsEngineField field={field} menu={false}>
      <Alert
        severity="error"
        variant="standard"
        sx={(theme) => ({ border: 'none', strong: { fontWeight: theme.typography.fontWeightMedium } })}
      >
        <FormattedMessage
          defaultMessage="Unable to load the {name} ({id}) control. The control may be absent or contain errors in the code. Check the browser console for error details."
          values={{
            name: field.name,
            id: field.id
          }}
        />
      </Alert>
    </FormsEngineField>
  );
}

function ControlPluginNoDefaultError({ field }: ControlProps) {
  return (
    <FormsEngineField field={field} menu={false}>
      <Alert
        severity="error"
        variant="standard"
        sx={(theme) => ({ border: 'none', strong: { fontWeight: theme.typography.fontWeightMedium } })}
      >
        <FormattedMessage
          defaultMessage="Unable to render {name} ({id}) control. No default export found. A control's JavaScript file should export a React component as `default`. Please check <docs>the documentation</docs>."
          values={{
            name: field.name,
            id: field.id,
            // TODO: Docs or internal link
            docs: (str) => (
              <a href="https://docs.craftercms.org" target="_blank">
                {str}
              </a>
            )
          }}
        />
      </Alert>
    </FormsEngineField>
  );
}

// region TableOfContents
function TableOfContents({
  containerRef,
  handleSectionExpandedChange,
  contentTypeFields,
  contentTypeSections,
  sectionExpandedState,
  setOpenDrawerSidebar,
  fieldsToRender,
  atoms
}: {
  containerRef: MutableRefObject<HTMLDivElement>;
  handleSectionExpandedChange(fieldId: string, expanded: boolean): void;
  contentTypeFields: LookupTable<ContentTypeField>;
  contentTypeSections: ContentTypeSection[];
  sectionExpandedState: LookupTable<boolean>;
  // TODO: Should send the handleCloseDrawerSidebar instead of allowing direct access to setOpenDrawerSidebar. Consider scroll freeze.
  setOpenDrawerSidebar: ReactDispatch<SetStateAction<boolean>>;
  fieldsToRender: ContentTypeField[];
  atoms: FormsEngineAtoms;
}) {
  const expandedSectionIds = useMemo(
    () => Object.entries(sectionExpandedState).flatMap(([key, expanded]) => (expanded ? [key] : [])),
    [sectionExpandedState]
  );
  const scrollToTarget = (target: Element) => {
    // Wait for the drawer to hide so the transition focus doesn't impede the scrollIntoView.
    // When the sidebar is a drawer, the hide transition is set to 0 for this to work with minimal timeout.
    setTimeout(() => {
      getScrollContainer(containerRef.current).style.overflowY = '';
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  };
  const handleSectionTreeItemClick = (event: SyntheticEvent) => {
    setOpenDrawerSidebar(false);
    const sectionId = event.currentTarget.parentElement.getAttribute('data-section-id');
    if (!sectionExpandedState[sectionId]) {
      handleSectionExpandedChange(sectionId, true);
    }
    scrollToTarget(containerRef.current.querySelector(`[data-area-id="formBody"] [data-section-id="${sectionId}"]`));
  };
  const handleFieldTreeItemClick = (event: SyntheticEvent) => {
    setOpenDrawerSidebar(false);
    const fieldId = event.currentTarget.parentElement.getAttribute('data-field-id');
    scrollToTarget(containerRef.current.querySelector(`[data-area-id="formBody"] [data-field-id="${fieldId}"]`));
  };
  const handleItemExpansionToggleClick = (event: SyntheticEvent, itemId: string, expanded: boolean) => {
    event.stopPropagation(); // Avoid accordion expansion
    handleSectionExpandedChange(itemId, expanded);
    setOpenDrawerSidebar(false);
  };
  const [searchFieldValue, setSearchFieldValue] = useState('');
  const [filteredFields, setFilteredFields] = useState<ContentTypeField[]>(null);
  const contentTypeFieldsArray = fieldsToRender ?? Object.values(contentTypeFields);
  const onKeyword$ = useDebouncedInput((value) => {
    if (!value?.trim()) {
      return setFilteredFields(null);
    }
    const keyword = value.toLowerCase();
    setFilteredFields(contentTypeFieldsArray.filter((field) => field.name.toLowerCase().includes(keyword)));
  });
  const createFieldTreeItem = (field: ContentTypeField) => {
    const fieldId = field.id;
    return (
      <TreeItem
        key={fieldId}
        itemId={fieldId}
        data-field-id={fieldId}
        onClick={handleFieldTreeItemClick}
        label={<TreeItemLabel field={field} atoms={atoms} />}
      />
    );
  };
  return (
    <>
      <SearchBar
        dense
        sx={{ mb: 1 }}
        showActionButton={searchFieldValue !== ''}
        keyword={searchFieldValue}
        onChange={(value) => {
          setSearchFieldValue(value);
          onKeyword$.next(value);
        }}
      />
      <SimpleTreeView
        selectedItems={[]}
        expansionTrigger="iconContainer"
        onItemExpansionToggle={handleItemExpansionToggleClick}
        expandedItems={expandedSectionIds}
      >
        {filteredFields?.map(createFieldTreeItem) ??
          fieldsToRender?.map(createFieldTreeItem) ??
          contentTypeSections.map((section) => (
            <TreeItem
              key={section.title}
              itemId={section.title}
              data-section-id={section.title}
              label={section.title}
              onClick={handleSectionTreeItemClick}
              children={section.fields.map((fieldId) => createFieldTreeItem(contentTypeFields[fieldId]))}
            />
          ))}
      </SimpleTreeView>
      {/* Spacer: */}
      <Box sx={{ minHeight: 50 }} />
    </>
  );
}
function TreeItemLabel({
  field,
  atoms
}: {
  field: ContentTypeField;
  atoms: Pick<FormsEngineAtoms, 'valueByFieldId' | 'validationByFieldId'>;
}) {
  const value = useAtomValue(atoms.valueByFieldId[field.id]);
  const validity = useAtomValue(atoms.validationByFieldId[field.id]);
  const isRequired = isFieldRequired(field);
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <span>{field.name}</span>
      {isRequired ? (
        <FieldRequiredStateIndicator isValid={validity.isValid} />
      ) : (
        <FieldEmptyStateIndicator isEmpty={isEmptyValue(field, value)} />
      )}
    </Box>
  );
}
// endregion

// region EditModeHeader
function EditModeHeader({
  handleTabChange,
  isEmbedded,
  atoms,
  theme,
  objectId,
  activeTab,
  isLargeContainer,
  useCollapsedToC,
  setCollapsedToC
}: {
  handleTabChange: TabsProps['onChange'];
  isEmbedded: boolean;
  atoms: FormsEngineAtoms;
  theme: Theme;
  objectId: string;
  activeTab: number;
  isLargeContainer: boolean;
  useCollapsedToC: boolean;
  setCollapsedToC: ReactDispatch<SetStateAction<boolean>>;
}) {
  const item = useContext(ItemContext);
  const store = useStore();
  const readonly = useAtomValue(atoms.readonly);
  const localeConf = useLocale();
  const itemLabel = isEmbedded
    ? (getFieldAtomValue(atoms.valueByFieldId[XmlKeys.internalName], store) as string)
    : item.label;
  const typeIconItem: Pick<SandboxItem, 'systemType' | 'mimeType'> = isEmbedded
    ? { systemType: 'component', mimeType: 'application/xml' }
    : item;
  const formattedCreator = prettyPrintPerson(item.sandbox.creator);
  const formattedCreationDate = new Intl.DateTimeFormat(localeConf.localeCode, {
    dateStyle: 'short'
  }).format(new Date(item.sandbox.dateCreated));
  const formattedModifier = prettyPrintPerson(item.sandbox.modifier);
  const formattedModifiedDate = new Intl.DateTimeFormat(localeConf.localeCode, {
    dateStyle: 'short'
  }).format(new Date(item.sandbox.dateModified));
  return (
    <>
      <Container className="space-y" sx={{ py: 1 }}>
        <Box display="flex" alignItems="end" justifyContent="space-between">
          <Box className="space-y" sx={{ flexBasis: '50%' }}>
            {/* Item display */}
            <Box display="flex" alignItems="center" className="space-x">
              <ItemTypeIcon item={typeIconItem} sx={{ color: 'info.main' }} />
              <Typography>{itemLabel}</Typography>
              {readonly && (
                <Chip
                  sx={{ [`.${chipClasses.label}`]: { display: 'flex', alignItems: 'center' } }}
                  color="warning"
                  variant="outlined"
                  label={
                    <>
                      <FormattedMessage defaultMessage="Readonly" />
                      <EditOffOutlined fontSize="small" sx={{ ml: 1 }} />
                    </>
                  }
                />
              )}
            </Box>
            {/* Item metadata */}
            <div>
              <Typography
                variant="body2"
                color="textSecondary"
                display="flex"
                alignItems="center"
                sx={{ flexWrap: 'wrap', em: { fontWeight: 600 } }}
              >
                <Box component="span" display="flex" alignItems="center" marginRight={1}>
                  <CalendarTodayRounded sx={{ mr: 0.25 }} fontSize="inherit" />
                  <span>
                    <FormattedMessage
                      defaultMessage="Created {when} by {who}"
                      values={{
                        who: <em title={formattedCreator.tooltip}>{formattedCreator.display}</em>,
                        when: formattedCreationDate
                      }}
                    />
                  </span>
                </Box>
                <Box component="span" display="flex" alignItems="center">
                  <EditOutlined sx={{ mr: 0.25 }} fontSize="inherit" />
                  <span>
                    <FormattedMessage
                      defaultMessage="Updated {when} by {who}"
                      values={{
                        who: <em title={formattedModifier.tooltip}>{formattedModifier.display}</em>,
                        when: formattedModifiedDate
                      }}
                    />
                  </span>
                </Box>
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                display="flex"
                alignItems="center"
                sx={{ flexWrap: 'wrap' }}
              >
                <Box component="span" display="flex" alignItems="center" marginRight={1}>
                  <ItemPublishingTargetIcon
                    fontSize="inherit"
                    styles={{ root: { marginRight: theme.spacing(0.25) } }}
                    item={item}
                  />{' '}
                  {getItemPublishingTargetText(item.stateMap)}
                </Box>
                <Box component="span" display="flex" alignItems="center">
                  <ItemStateIcon
                    fontSize="inherit"
                    styles={{ root: { marginRight: theme.spacing(0.25) } }}
                    item={item}
                  />{' '}
                  {getItemStateText(item.stateMap, { user: item.lockOwner?.username })}
                </Box>
              </Typography>
            </div>
          </Box>
          <Box className="space-y" display="flex" flexDirection="column" alignItems="end" sx={{ maxWidth: '50%' }}>
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              sx={{ overflow: 'hidden', maxWidth: '100%' }}
            >
              <Box
                component="span"
                title={item.path}
                sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {item.path}
                {/* Super-long test path: /Lorem/Ipsum/is/simply/dummy/text/of/the/printing/and/typesetting/industry/Lorem/Ipsum/has/been/the/industrys/standard/dummy/text/ever/since/the/1500s/when/an/unknown/printer/took/a/galley/of/type/and/scrambled/it/to/make/a/type/specimen/book.xml */}
              </Box>
              <Tooltip title={<FormattedMessage defaultMessage="Copy path to clipboard" />}>
                <IconButton size="small" onClick={() => copyToClipboard(item.path)} sx={{ padding: '1px', ml: 1 }}>
                  <ContentCopyRounded fontSize="inherit" sx={{ color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Typography>
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              sx={{ overflow: 'hidden', maxWidth: '100%' }}
            >
              <Box
                component="span"
                title={objectId}
                sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {objectId}
              </Box>
              <Tooltip title={<FormattedMessage defaultMessage="Copy ID to clipboard" />}>
                <IconButton
                  size="small"
                  sx={{ padding: '1px', ml: 1 }}
                  onClick={() =>
                    copyToClipboard(getFieldAtomValue(atoms.valueByFieldId[XmlKeys.modelId], store) as string)
                  }
                >
                  <ContentCopyRounded fontSize="inherit" sx={{ color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Typography>
          </Box>
        </Box>
      </Container>
      <Container maxWidth="xl" sx={{ display: 'flex' }}>
        {isLargeContainer && (
          <Tooltip title={<FormattedMessage defaultMessage="Collapse table of contents" />}>
            <IconButton size="small" onClick={() => setCollapsedToC(!useCollapsedToC)} sx={{ mr: 0.5 }}>
              <MenuOpenIcon
                sx={{
                  // Add transform to rotate 180deg when collapsed
                  transform: useCollapsedToC ? 'rotate(180deg)' : 'none',
                  // Animate the rotation
                  transition: theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shortest
                  })
                }}
              />
            </IconButton>
          </Tooltip>
        )}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 0 }}>
          <DenseTab label={<FormattedMessage defaultMessage="Form" />} />
          <DenseTab label={<FormattedMessage defaultMessage="Preview" />} />
          <DenseTab label={<FormattedMessage defaultMessage="History" />} />
          <DenseTab label={<FormattedMessage defaultMessage="References" />} />
          <DenseTab label={<FormattedMessage defaultMessage="Template" />} />
          <DenseTab label={<FormattedMessage defaultMessage="Controller" />} />
          <DenseTab label={<FormattedMessage defaultMessage="Settings" />} />
        </Tabs>
      </Container>
    </>
  );
}
// endregion

// region CreateModeHeader
const itemTypeTranslations = defineMessages({
  component: { defaultMessage: 'Component' },
  page: { defaultMessage: 'Page' },
  taxonomy: { defaultMessage: 'Taxonomy' }
});
function CreateModeHeader({ contentType, path }: { path: string; contentType: ContentType }) {
  const { formatMessage } = useIntl();
  const itemType = contentType.type;
  return (
    <Container sx={{ py: 1 }}>
      <Typography variant="h6" component="h2" display="flex" alignItems="center">
        <ItemTypeIcon item={{ systemType: itemType, mimeType: 'application/xml' }} sx={{ color: 'info.main', mr: 1 }} />
        <FormattedMessage
          defaultMessage='Create new "{name}" {type}'
          values={{
            name: contentType.name,
            type:
              itemType in itemTypeTranslations ? formatMessage(itemTypeTranslations[itemType]).toLowerCase() : itemType
          }}
        />
      </Typography>
      <Typography color="textSecondary" variant="body2" children={path} />
    </Container>
  );
}
// endregion

export default Root;
