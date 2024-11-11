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
  forwardRef,
  lazy,
  LazyExoticComponent,
  MutableRefObject,
  SetStateAction,
  Suspense,
  SyntheticEvent,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ContentTypeField, ContentTypeSection, SandboxItem } from '../../models';
import {
  createInitialState,
  FormsEngineContext,
  FormsEngineContextApi,
  FormsEngineContextApiProps,
  FormsEngineContextProps,
  FormsEngineSourceMap
} from './formsEngineContext';
import {
  fetchContentXML,
  fetchDescriptorXML,
  fetchSandboxItem,
  fetchWorkflowAffectedItems,
  lock,
  unlock
} from '../../services/content';
import { fetchSandboxItemComplete } from '../../state/actions/content';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { createElements, deserialize, fromString, getInnerHtml, newXMLDocument, serialize } from '../../utils/xml';
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
import Tabs from '@mui/material/Tabs';
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
  isEmptyValue,
  isFieldRequired,
  retrieveFieldValue,
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
import useItemsByPath from '../../hooks/useItemsByPath';
import { parseDetailedItemToSandboxItem } from '../../utils/content';
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
import ApiResponse from '../../models/ApiResponse';
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
import useSubject from '../../hooks/useSubject';
import { debounceTime } from 'rxjs/operators';
import { ControlSkeleton } from './common/ControlSkeleton';

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

const buildInitialFieldValidityState = (
  contentTypeFields: LookupTable<ContentTypeField> | ContentTypeField[],
  values: LookupTable<unknown>
): FormsEngineContextProps['fieldValidityState'] => {
  return (Array.isArray(contentTypeFields) ? contentTypeFields : Object.values(contentTypeFields)).reduce(
    (fieldValidityState, field) => {
      const fieldId = field.id;
      fieldValidityState[fieldId] = {
        isValid: validateFieldValue(field, retrieveFieldValue(field, values)),
        messages: null
      };
      if (fieldValidityState[fieldId].isValid === false) {
        fieldValidityState[fieldId].messages = ['This field is required.'];
      }
      return fieldValidityState;
    },
    {} as FormsEngineContextProps['fieldValidityState']
  );
};

interface LockResult {
  locked: boolean;
  error: ApiResponse;
  affectedItemsInWorkflow?: SandboxItem[];
}

const internalLockContentService: (siteId: string, path: string) => Observable<LockResult> = (siteId, path) =>
  lock(siteId, path).pipe(
    map(() => ({ locked: true, error: null })),
    catchError((error) => of({ locked: false, error: error.response?.response })),
    switchMap((lockResult) =>
      fetchWorkflowAffectedItems(siteId, path).pipe(
        map((affectedItemsInWorkflow) => ({ ...lockResult, affectedItemsInWorkflow })),
        catchError((error) => of({ ...lockResult, affectedItemsInWorkflow: null, error: error.response?.response }))
      )
    )
  );

const internalUnlockContentService: (siteId: string, path: string) => Observable<LockResult> = (
  siteId: string,
  path: string
) =>
  unlock(siteId, path).pipe(
    map(() => ({ locked: false, error: null })),
    catchError((error) => of({ locked: true, error: error.response?.response }))
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
}) => Observable<Partial<FormsEngineContextProps>> = ({ siteId, path, modelId, readonly, contentTypesById }) => {
  // Good to start with the lock so that posterior fetch of the item comes with the lock status. If we need
  // to fetch the content type, will need the item first to determine its content type id, but currently relying
  // on a separate load for all content types. Alternatively, we could fetch all types here too if we get a form
  // requirements service.
  return (
    readonly
      ? of({ locked: false, error: null, affectedItemsInWorkflow: null } as LockResult)
      : internalLockContentService(siteId, path)
  ).pipe(
    switchMap((lockResult) =>
      forkJoin([
        fetchSandboxItem(siteId, path),
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
      let contentDom: XMLDocument | Element = fromString(contentXml);
      if (modelId) {
        contentDom = contentDom.querySelector(`[id="${modelId}"]`);
        contentType = contentTypesById[getInnerHtml(contentDom.querySelector(':scope > content-type'))];
      }
      const contentObject = deserializeContentDom(contentDom);
      const values = createCleanValuesObject(contentType.fields, contentObject, contentTypesById);
      const sourceMap = createSourceMap(descriptorXml);
      return {
        item,
        values,
        sourceMap,
        originalValuesJson: JSON.stringify(values),
        contentDom,
        locked: lockResult.locked,
        lockError: lockResult.error,
        affectedItemsInWorkflow: lockResult.affectedItemsInWorkflow,
        // If opening as readonly, lock result is of no consequence. If opened for edit, will set to readonly
        // if there was an error locking the content (the item is not locked).
        readonly: readonly || !lockResult.locked,
        contentXml,
        contentTypeXml: null,
        contentType,
        pathInProject: createPathInProject(path),
        fieldValidityState: buildInitialFieldValidityState(contentType.fields, values),
        requirementsFetched: true,
        sectionExpandedState: buildSectionExpandedState(contentType.sections)
        // formsEngineExtensions: null
        // formsStack: [
        //   !modelId && {
        //     path: '/site/website/index.xml',
        //     modelId: '310b0c87-c3ca-4da0-4aa2-7002a318d7ce'
        //   }
        // ].filter(Boolean)
      };
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

export const FormsEngine = forwardRef<HTMLDivElement, FormsEngineProps>(function (props, ref) {
  // region const {...} = props
  const {
    create,
    update,
    repeat,
    stackIndex,
    stackTransitionEnded,
    fieldsToRender,
    isDialog = false,
    readonly: readonlyProp = false,
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
  const parentState = useContext(FormsEngineContext);
  const parentContextApi = useContext(FormsEngineContextApi);
  const effectRefs = useUpdateRefs({ contentTypesById, parentState, stackIndex, fieldsToRender });
  const valueSettersRef = useRef<Record<string, (value: unknown) => void>>({});
  const fieldUpdates$ = useSubject<string>();

  // region Context
  // eslint-disable-next-line prefer-const -- state is reassigned and don't want to split the declaration.
  let [state, setState] = useState<FormsEngineContextProps>(() => {
    // Stacked forms state come from the parent context formsStackState. `state` is reassigned below.
    return parentState?.formsStackState ? null : createInitialState({ readonly: readonlyProp });
  });
  if (parentState) state = parentState.formsStackState[stackIndex];
  const stateRef = useUpdateRefs(state);
  const contextApi = useMemo<FormsEngineContextApiProps>(() => {
    const hasParentContext = Boolean(parentContextApi);
    const update = <K extends keyof FormsEngineContextProps>(
      newStateOrKey: K | Partial<FormsEngineContextProps>,
      newState?: FormsEngineContextProps[K]
    ) => {
      let nextState: FormsEngineContextProps;
      if (typeof newStateOrKey === 'string') {
        nextState = { ...stateRef.current, [newStateOrKey]: newState };
      } else {
        nextState = { ...stateRef.current, ...newStateOrKey };
      }
      if (hasParentContext) {
        parentContextApi.updateStackedFormState(effectRefs.current.stackIndex, nextState);
      } else {
        setState(nextState);
      }
    };
    const api: FormsEngineContextApiProps = {
      update,
      pushForm(formProps: FormsEngineProps) {
        if (hasParentContext) {
          update('previousScrollTopPosition', getScrollContainer(containerRef.current).scrollTop);
          parentContextApi.pushForm(formProps);
        } else {
          const newState: FormsEngineContextProps = createInitialState({ readonly: formProps.readonly ?? false });
          update({
            formsStackProps: [...stateRef.current.formsStackProps, formProps],
            formsStackState: [...stateRef.current.formsStackState, newState]
          });
        }
      },
      popForm() {
        if (hasParentContext) {
          parentContextApi.popForm();
        } else {
          update({
            formsStackProps: stateRef.current.formsStackProps.slice(0, -1),
            formsStackState: stateRef.current.formsStackState.slice(0, -1)
          });
        }
      },
      updateValue(fieldId, value) {
        stateRef.current.changedFieldIds.add(fieldId);
        fieldUpdates$.next(fieldId);
        update({
          hasPendingChanges: true,
          values: { ...stateRef.current.values, [fieldId]: value },
          fieldValidityState: stateRef.current.contentType.fields[fieldId]
            ? {
                ...stateRef.current.fieldValidityState,
                [fieldId]: {
                  messages: null,
                  isValid: validateFieldValue(stateRef.current.contentType.fields[fieldId], value)
                }
              }
            : stateRef.current.fieldValidityState
        });
      },
      rollbackValue(fieldId) {
        const originalValues = JSON.parse(stateRef.current.originalValuesJson);
        const value = originalValues[fieldId];
        stateRef.current.changedFieldIds.delete(fieldId);
        fieldUpdates$.next(fieldId);
        update({
          hasPendingChanges: stateRef.current.changedFieldIds.size > 0,
          values: { ...stateRef.current.values, [fieldId]: value },
          fieldValidityState: stateRef.current.contentType.fields[fieldId]
            ? {
                ...stateRef.current.fieldValidityState,
                [fieldId]: {
                  messages: null,
                  isValid: validateFieldValue(stateRef.current.contentType.fields[fieldId], value)
                }
              }
            : stateRef.current.fieldValidityState
        });
      },
      handleTabChange(event, newValue) {
        update('activeTab', newValue);
      },
      handleToggleSectionAccordion(event, expanded) {
        api.setAccordionExpandedState(event.currentTarget.getAttribute('data-section-id'), expanded);
      },
      handleViewFieldHelpText(event, field) {
        event.preventDefault();
        const key = field.id;
        update('fieldHelpExpandedState', {
          ...stateRef.current.fieldHelpExpandedState,
          [key]: !stateRef.current.fieldHelpExpandedState[key]
        });
      },
      setAccordionExpandedState(sectionId, expanded) {
        update('sectionExpandedState', {
          ...stateRef.current.sectionExpandedState,
          [sectionId]: expanded
        });
      },
      updateStackedFormState(stackIndex, childFormState) {
        // Nothing depends on `formsStackState` itself to re-render so not treating as immutable
        // for efficiency and speed (avoid `concat` & `slice`).
        stateRef.current.formsStackState[stackIndex] = childFormState;
        update('formsStackState', stateRef.current.formsStackState);
      }
    };
    return api;
  }, [parentContextApi, stateRef, effectRefs, fieldUpdates$]);
  // endregion

  const requirementsFetched = state.requirementsFetched;
  const hasStackedForms = state.formsStackProps.length > 0;
  const liveUpdatedItem = useItemsByPath()[update?.path ?? parentState?.item.path];

  useImperativeHandle(ref, () => containerRef.current);

  // Version comment generator
  useEffect(() => {
    const produceMessage = (fieldsChanged: string[]) => {
      if (fieldsChanged.length === 0) return '';
      return fieldsChanged.length > 1
        ? `Updated ${fieldsChanged.slice(0, -1).join(', ')} and ${fieldsChanged[fieldsChanged.length - 1]}`
        : `Updated ${fieldsChanged[fieldsChanged.length - 1]}`;
    };
    const sub = fieldUpdates$.pipe(debounceTime(500)).subscribe(() => {
      const state = stateRef.current;
      const fieldsToRender = state.contentType.fields;
      if (effectRefs.current.fieldsToRender) {
        effectRefs.current.fieldsToRender.forEach((field) => {
          fieldsToRender[field.id] = field;
        });
      }
      const fieldsChanged = Array.from(state.changedFieldIds).flatMap(
        (f) => fieldsToRender[f === 'folder-name' ? 'file-name' : f]?.name ?? []
      );
      const currentMessage = state.versionComment.trim();
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
      contextApi.update('versionComment', newMessage);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [contextApi, effectRefs, fieldUpdates$, stateRef]);

  // Fetch/prepare requirements
  useEffect(() => {
    // TODO:
    //  - Content type not found
    //  - Item/Content not found
    //  - Invalid params (e.g. create mode without a content type id)
    // TODO: don't want to refetch unnecessarily (e.g. content types by id ref updated), but currently this is
    //   excluding refetching if siteId or other props change.
    // TODO: Consider backend that provides all form requirements: form def xml, context xml, sandbox/detailed item, affected workflow, lock(?)
    if (!requirementsFetched && contentTypesById) {
      let parentState = effectRefs.current.parentState;
      const getCurrentFormParentState = () =>
        // In the form stack, the present form being opened would be in the last position [length-1], the parent form
        // state would be on [length-2] if it is nested (e.g. Root => Component(L1) => Repeat(L2)|Component(L2)). Otherwise,
        // the parent should be the root.
        (parentState = parentState.formsStackState[parentState.formsStackState.length - 2] ?? parentState);
      if (
        // A repeat group is being opened as a stacked form.
        parentState &&
        repeat?.fieldId
      ) {
        parentState = getCurrentFormParentState();
        const newState: Partial<FormsEngineContextProps> = {};
        newState.item = parentState.item;
        newState.locked = parentState.locked;
        // newState.contentDom = parentState.contentDom.querySelector(`:scope > ${repeat.fieldId}`);
        // newState.contentXml = newState.contentDom.outerHTML;
        newState.contentType = parentState.contentType;
        newState.pathInProject = parentState.pathInProject;
        newState.values =
          repeat.values ?? createCleanValuesObject(fieldsToRender, {}, effectRefs.current.contentTypesById);
        newState.originalValuesJson = JSON.stringify(newState.values);
        newState.fieldValidityState = buildInitialFieldValidityState(fieldsToRender, newState.values);
        newState.readonly = parentState.readonly;
        newState.requirementsFetched = true;
        contextApi.update(newState);
      } else if (
        // An embedded component is being opened as a stacked form.
        parentState &&
        update?.modelId
      ) {
        parentState = getCurrentFormParentState();
        const newState: Partial<FormsEngineContextProps> = {};
        newState.item = parentState.item;
        newState.locked = parentState.locked;
        // newState.contentDom = parentState.contentDom.querySelector(`[id="${update.modelId}"]`);
        // newState.contentXml = newState.contentDom.outerHTML;
        // newState.contentType =
        //   effectRefs.current.contentTypesById[getInnerHtml(newState.contentDom.querySelector(':scope > content-type'))];
        newState.contentType = effectRefs.current.contentTypesById[update.values[XmlKeys.contentTypeId] as string];
        newState.pathInProject = parentState.pathInProject;
        newState.values = update.values;
        newState.originalValuesJson = JSON.stringify(update.values);
        newState.fieldValidityState = buildInitialFieldValidityState(newState.contentType.fields, newState.values);
        newState.readonly = readonlyProp ?? parentState.readonly;
        newState.sectionExpandedState = buildSectionExpandedState(newState.contentType.sections);
        newState.requirementsFetched = true;
        if (newState.readonly === parentState.readonly) {
          contextApi.update(newState);
        } else {
          const sub = internalLockContentService(siteId, newState.item.path).subscribe((result) => {
            newState.locked = result.locked;
            newState.lockError = result.error;
            newState.readonly = !result.locked;
            newState.affectedItemsInWorkflow = result.affectedItemsInWorkflow;
            contextApi.update(newState);
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
        const contentType = contentTypesById[create.contentTypeId];
        const contentDom = newXMLDocument(contentType.type);
        const values = createCleanValuesObject(
          contentType.fields,
          {
            objectId: newModelId,
            [XmlKeys.contentTypeId]: contentType.id,
            'display-template': contentType.displayTemplate,
            'no-template-required': Boolean(contentType.displayTemplate ? 'false' : 'true'),
            'merge-strategy': 'inherit-levels',
            createdDate: dateIsoString,
            createdDate_dt: dateIsoString,
            lastModifiedDate: dateIsoString,
            lastModifiedDate_dt: dateIsoString
          },
          contentTypesById
        );
        createElements(contentDom.documentElement, values);
        const contentXml = serialize(contentDom);
        // TODO: Sourcemap? How can we determine what would be inherited by this content? New API?
        contextApi.update({
          values,
          originalValuesJson: JSON.stringify(values),
          contentType,
          contentDom,
          contentXml,
          readonly: false,
          pathInProject: create.path,
          fieldValidityState: buildInitialFieldValidityState(contentType.fields, values),
          requirementsFetched: true,
          sectionExpandedState: buildSectionExpandedState(contentType.sections)
        });
      } /* if (isUpdateMode) */ else {
        const subscription = fetchRequirements({
          siteId,
          path: update.path,
          modelId: update.modelId,
          readonly: readonlyProp,
          contentTypesById
        }).subscribe((newState) => {
          dispatch(fetchSandboxItemComplete({ item: newState.item }));
          contextApi.update(newState);
        });
        return () => subscription.unsubscribe();
      }
    }
  }, [
    requirementsFetched,
    siteId,
    dispatch,
    contentTypesById,
    create,
    update,
    repeat,
    readonlyProp,
    effectRefs,
    fieldsToRender,
    contextApi
  ]);

  const sourceMapPaths = useMemo(() => {
    return state.sourceMap ? Object.values(state.sourceMap).map((path) => path) : [];
  }, [state.sourceMap]);
  useFetchSandboxItems(sourceMapPaths);

  // Keep the state.item up to date with updates from the socket
  useEffect(() => {
    // It'd be good to have a sandboxItem.lastSystemUpdateDate to know if updates other than the content itself have happened
    if (requirementsFetched && liveUpdatedItem) {
      contextApi.update('item', parseDetailedItemToSandboxItem(liveUpdatedItem));
      // TODO: Re-fetch content?
    }
  }, [contextApi, liveUpdatedItem, requirementsFetched]);

  // Resize observer attached to the [scroll] container
  useLayoutEffect(() => {
    if (containerRef.current) {
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
      const resizeObserver = new ResizeObserver((entries) =>
        entries.forEach(() => setValues(container.getBoundingClientRect()))
      );
      resizeObserver.observe(document.documentElement);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [
    theme.breakpoints.values.lg,
    // `requirementsFetched` isn't used inside the effect, but it is used as a way to
    // trigger the effect when the containerRef is set.
    requirementsFetched,
    // `isFullScreen` isn't used inside the effect but want to trigger the calculations when changed.
    isFullScreen
  ]);

  // Restore previous scroll position if provided.
  useEffect(() => {
    // Only a single stacked form is rendered at a time, so the scroll position of stacked forms is stored before opening a new one for later restoration here.
    if (containerRef.current) {
      const container: HTMLElement = getScrollContainer(containerRef.current);
      // Restore the previous scroll position
      if (state.previousScrollTopPosition != null) {
        container.scrollTop = state.previousScrollTopPosition;
      }
    }
  }, [
    state.previousScrollTopPosition,
    // `requirementsFetched` isn't used inside the effect, but it is used as a way to
    // trigger the effect when the containerRef is set.
    requirementsFetched
  ]);

  // Freeze/manage scroll when stacked forms are open, and set the --scroll-top css property for stacked
  // forms to position themselves at the right position.
  useLayoutEffect(() => {
    if (requirementsFetched && hasStackedForms) {
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
  }, [requirementsFetched, hasStackedForms]);

  // If rendered in a dialog, update the dialog's isSubmitting and hasPendingChanges. Only the root form.
  // Stacked forms have their own changes and submit state management.
  useEffect(() => {
    if (!parentContextApi) {
      updateSubmittingOrHasPendingChanges?.({
        isSubmitting: state.isSubmitting,
        hasPendingChanges: state.hasPendingChanges
      });
    }
  }, [state.isSubmitting, state.hasPendingChanges, parentContextApi, updateSubmittingOrHasPendingChanges]);

  // If the form is rendered in/as a dialog, take up the whole screen minus
  // top/bottom margins (2 top, 2 bottom). If not a dialog, take up the whole screen.
  const targetHeight = isDialog ? `calc(100vh - ${isFullScreen ? 0 : theme.spacing(4)})` : '100%';

  if (!requirementsFetched) {
    return (
      <LoadingState
        sx={{ height: targetHeight }}
        title={<FormattedMessage defaultMessage="Please wait" />}
        subtitle={<FormattedMessage defaultMessage="Gathering content information" />}
      />
    );
  }

  const readonly = state.readonly;
  const affectsWorkflowItems = state.affectedItemsInWorkflow?.length > 0;
  const isStackedForm = Boolean(parentState);
  const isEmbedded = Boolean(update?.modelId);
  const isCreateMode = Boolean(create?.path);
  const isRepeatMode = Boolean(repeat?.fieldId);
  const isLargeContainer = containerStats?.isLargeContainer;
  const contentType = state.contentType;
  const contentTypeFields = contentType.fields;
  const contentTypeSections = contentType.sections;
  const { handleToggleSectionAccordion } = contextApi;
  const { activeTab, sectionExpandedState } = state;
  const objectId = state.values[XmlKeys.modelId] as string;
  const values = state.values;
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
    const childState = state.formsStackState[state.formsStackState.length - 1];
    // Note: This is executed in the context of the parent form.
    // Executed in the case of escape, backdrop click or form close button click.
    const doClose = () => {
      // Unlock item if necessary
      const childProps = state.formsStackProps[state.formsStackProps.length - 1];
      // If it is not an "update" (e.g. repeat, create), should not unlock.
      if (!childState.readonly && childProps.update) {
        // No model id means it is a shared component and should be unlocked.
        let shouldUnlock = !childProps.update.modelId;
        if (!shouldUnlock) {
          // This is an embedded component...
          const stateStack = [state, ...state.formsStackState];
          stateStack.pop();
          // Unlock only if the parent form is readonly since, unlocking the embedded means unlocking the parent
          // document hence, if parent form is not readonly, it is being edited and shouldn't be unlocked.
          // This logic assumes the form stack is sequential so the parent component would be right before in the state stack.
          shouldUnlock = stateStack[stateStack.length - 1].readonly;
        }
        shouldUnlock && internalUnlockContentService(siteId, childState.item.path).subscribe();
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
      values={values}
      fieldsToRender={fieldsToRender}
      containerRef={containerRef}
      contextApi={contextApi}
      contentTypeFields={contentTypeFields}
      fieldValidityState={state.fieldValidityState}
      contentTypeSections={contentTypeSections}
      sectionExpandedState={sectionExpandedState}
      setOpenDrawerSidebar={setOpenDrawerSidebar}
    />
  );
  // endregion

  const currentStackedFormProps = hasStackedForms ? state.formsStackProps[state.formsStackProps.length - 1] : null;
  let stackedFormKey = undefined;
  if (hasStackedForms) {
    if (currentStackedFormProps.update) {
      stackedFormKey = `${currentStackedFormProps.update.path}_${currentStackedFormProps.update.modelId}_${state.formsStackProps.length}`;
    } else if (currentStackedFormProps.create) {
      stackedFormKey = `${currentStackedFormProps.create.path}_${currentStackedFormProps.create.contentTypeId}_${state.formsStackProps.length}`;
    } else if (currentStackedFormProps.repeat) {
      stackedFormKey = `${currentStackedFormProps.repeat.fieldId}_${state.formsStackProps.length}`;
    }
  }

  const disableSave = state.isSubmitting || (affectsWorkflowItems && !acceptedWorkflowCancellation);
  const handleSave: ButtonProps['onClick'] = (e) => {
    contextApi.update({ isSubmitting: true });
    setTimeout(() => {
      const xml = buildContentXml(values, contentTypesById);
      const dom = fromString(xml);
      contextApi.update({
        contentXml: xml,
        contentDom: dom,
        isSubmitting: false,
        hasPendingChanges: false,
        originalValuesJson: JSON.stringify(values)
      });
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

  const updateEditEnablement = (enableEdit: boolean, callback?: (lockResult: LockResult) => void) => {
    if (enablingEditInProgress) return;
    const doEditEnablement = (restoreValues: boolean = false) => {
      // TODO: Re-fetch content when enabling edit?
      setEnablingEditInProgress(true);
      const service = enableEdit ? internalLockContentService : internalUnlockContentService;
      service(siteId, state.item.path).subscribe((lockResult) => {
        setEnablingEditInProgress(false);
        contextApi.update({
          locked: lockResult.locked,
          lockError: lockResult.error,
          readonly: !lockResult.locked,
          affectedItemsInWorkflow: lockResult?.affectedItemsInWorkflow ?? null,
          hasPendingChanges: false,
          values: restoreValues ? JSON.parse(state.originalValuesJson) : state.values
        });
        callback?.(lockResult);
      });
    };
    // If hasPendingChanges, should prompt user to save before enabling edit.
    if (!enableEdit && state.hasPendingChanges) {
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
      if (state.isSubmitting) {
        displayFormBeingSavedSnack(dispatch, formatMessage);
      } else if (state.hasPendingChanges) {
        // This is assuming the EnhancedDialog will handle showing the close without saving confirm.
        doClose();
      } else if (
        readonly ||
        // If is an embedded component opened as a stacked form, unlocking is necessary
        // unless the parent was opened readonly but this one was requested for edit. So:
        // Is embedded? Is stacked (i.e. has a parent state)? The parent state matches readonly status.
        (isEmbedded && parentState && Boolean(readonly) === Boolean(parentState.readonly))
      ) {
        doClose();
      } else {
        internalUnlockContentService(siteId, state.item.path).subscribe(() => {
          doClose();
        });
      }
    };
  }

  const renderFieldControl = (field: ContentTypeField, autoFocus: boolean) => {
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
    if (!valueSettersRef.current[fieldId]) {
      valueSettersRef.current[fieldId] = (newValue) => contextApi.updateValue(fieldId, newValue);
    }
    return (
      <ErrorBoundary key={fieldId}>
        <Suspense fallback={<ControlSkeleton label={field.name} />}>
          <Control
            // Only auto-focus on controls that are not readonly.
            // Focus might not work consistently on disabled controls anyway.
            autoFocus={autoFocus && !readonly}
            value={values[fieldId]}
            setValue={valueSettersRef.current[fieldId]}
            field={field}
            contentType={contentType}
            readonly={readonly}
          />
        </Suspense>
      </ErrorBoundary>
    );
  };

  const bodyFragment = (
    <Box
      data-model-id={objectId}
      data-area-id="formContainer"
      ref={containerRef}
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
      <UIBlocker open={state.isSubmitting} />
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
            isLargeContainer={isLargeContainer}
            useCollapsedToC={useCollapsedToC}
            setCollapsedToC={setCollapsedToC}
            contextApi={contextApi}
            isEmbedded={isEmbedded}
            state={state}
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
                            props: { items: state.affectedItemsInWorkflow } as WorkflowCancellationDialogProps
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
              {state.lockError && (
                <Alert severity="error">
                  {createErrorStatePropsFromApiResponse(state.lockError, formatMessage).message}
                </Alert>
              )}
              {fieldsToRender ? (
                <Paper sx={{ p: 2 }}>
                  {fieldsToRender.map((field, index) => renderFieldControl(field, index === 0))}
                </Paper>
              ) : (
                contentTypeSections.map((section, sectionIndex) => (
                  <Accordion
                    key={sectionIndex}
                    expanded={sectionExpandedState[section.title]}
                    onChange={handleToggleSectionAccordion}
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
                        renderFieldControl(contentTypeFields[fieldId], sectionIndex === 0 && fieldIndex === 0)
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
                    {state.hasPendingChanges ? (
                      <Grow in={state.hasPendingChanges}>
                        <Paper sx={{ p: 1 }} className="space-y-half">
                          <TextField
                            size="small"
                            multiline
                            fullWidth
                            label={<FormattedMessage defaultMessage="Version Comment" />}
                            value={state.versionComment}
                            onChange={(e) => contextApi.update('versionComment', e.target.value)}
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
                              control={
                                <Checkbox
                                  size="small"
                                  checked={false}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    // (e.target.checked);
                                  }}
                                />
                              }
                            />
                          </div>
                          <PrimaryButton
                            fullWidth
                            variant="contained"
                            onClick={handleSave}
                            disabled={disableSave}
                            loading={state.isSubmitting}
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
          <FormsEngine
            key={stackedFormKey}
            stackIndex={state.formsStackProps.length - 1}
            stackTransitionEnded={!disableStackedFormDrawerAutoFocus}
            {...currentStackedFormProps}
            isDialog={isDialog}
            onClose={handleCloseDrawerForm}
          />
        )}
      </Drawer>
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
    <FormsEngineContext.Provider value={state}>
      <FormsEngineContextApi.Provider value={contextApi}>
        {parentState ? <Fade in={stackTransitionEnded} mountOnEnter children={bodyFragment} /> : bodyFragment}
      </FormsEngineContextApi.Provider>
    </FormsEngineContext.Provider>
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
  contextApi,
  contentTypeFields,
  fieldValidityState,
  contentTypeSections,
  sectionExpandedState,
  setOpenDrawerSidebar,
  fieldsToRender,
  values
}: {
  containerRef: MutableRefObject<HTMLDivElement>;
  contextApi: FormsEngineContextApiProps;
  contentTypeFields: LookupTable<ContentTypeField>;
  fieldValidityState: FormsEngineContextProps['fieldValidityState'];
  contentTypeSections: ContentTypeSection[];
  sectionExpandedState: FormsEngineContextProps['sectionExpandedState'];
  // TODO: Should send the handleCloseDrawerSidebar instead of allowing direct access to setOpenDrawerSidebar. Consider scroll freeze.
  setOpenDrawerSidebar: ReactDispatch<SetStateAction<boolean>>;
  fieldsToRender: ContentTypeField[];
  values: LookupTable<unknown>;
}) {
  const expandedSectionIds = Object.entries(sectionExpandedState).flatMap(([key, expanded]) => (expanded ? [key] : []));
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
      contextApi.setAccordionExpandedState(sectionId, true);
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
    contextApi.setAccordionExpandedState(itemId, expanded);
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
    const isRequired = isFieldRequired(field);
    return (
      <TreeItem
        key={fieldId}
        itemId={fieldId}
        data-field-id={fieldId}
        onClick={handleFieldTreeItemClick}
        label={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <span>{field.name}</span>
            {isRequired ? (
              <FieldRequiredStateIndicator isValid={fieldValidityState[fieldId]?.isValid} />
            ) : (
              <FieldEmptyStateIndicator isEmpty={isEmptyValue(field, values[fieldId])} />
            )}
          </Box>
        }
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
// endregion

// region EditModeHeader
function EditModeHeader({
  contextApi,
  isEmbedded,
  state,
  theme,
  objectId,
  activeTab,
  isLargeContainer,
  useCollapsedToC,
  setCollapsedToC
}: {
  contextApi: FormsEngineContextApiProps;
  isEmbedded: boolean;
  state: FormsEngineContextProps;
  theme: Theme;
  objectId: string;
  activeTab: number;
  isLargeContainer: boolean;
  useCollapsedToC: boolean;
  setCollapsedToC: ReactDispatch<SetStateAction<boolean>>;
}) {
  const readonly = state.readonly;
  const item = state.item;
  const localeConf = useLocale();
  const { handleTabChange } = contextApi;
  const itemLabel = isEmbedded ? (state.values[XmlKeys.internalName] as string) : item.label;
  const typeIconItem: Pick<SandboxItem, 'systemType' | 'mimeType'> = isEmbedded
    ? { systemType: 'component', mimeType: 'application/xml' }
    : item;
  const formattedCreator = prettyPrintPerson(item.creator);
  const formattedCreationDate = new Intl.DateTimeFormat(localeConf.localeCode, {
    dateStyle: 'short'
  }).format(new Date(item.dateCreated));
  const formattedModifier = prettyPrintPerson(item.modifier);
  const formattedModifiedDate = new Intl.DateTimeFormat(localeConf.localeCode, {
    dateStyle: 'short'
  }).format(new Date(item.dateModified));
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
                  onClick={() => copyToClipboard(state.values[XmlKeys.modelId] as string)}
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

export default FormsEngine;
