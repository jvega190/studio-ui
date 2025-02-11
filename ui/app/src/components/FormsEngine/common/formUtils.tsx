/*
 * Copyright (C) 2007-2025 Crafter Software Corporation. All Rights Reserved.
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

import { ContentTypeField, ContentTypeSection } from '../../../models';
import LookupTable from '../../../models/LookupTable';
import ContentType from '../../../models/ContentType';
import { BuiltInControlType } from '../controlMap';
import { RepeatItem } from '../controls/Repeat';
import { NodeSelectorItem } from '../controls/NodeSelector';
import validateFieldValue, { FieldValidityState } from '../validateFieldValue';
import { catchError, forkJoin, map, Observable, of, Subject, switchMap } from 'rxjs';
import {
  FormRequirementsResponse,
  FormsEngineAtoms,
  FormsEngineEditContextProps,
  FormsEngineSourceMap,
  StableFormContextProps
} from '../formsEngineContext';
import { fetchContentXML, fetchDescriptorXML, fetchDetailedItem, lock, unlock } from '../../../services/content';
import { AjaxError } from 'rxjs/ajax';
import { fetchAffectedPackages } from '../../../services/workflow';
import { Dispatch as ReduxDispatch } from 'redux';
import { IntlShape } from 'react-intl/src/types';
import { showSystemNotification } from '../../../state/actions/system';
import { atom, Atom, PrimitiveAtom } from 'jotai/index';
import React, { ReactNode, RefObject } from 'react';
import { XMLBuilder } from 'fast-xml-parser';
import { deserialize, fromString, getInnerHtml } from '../../../utils/xml';
import { nanoid } from 'nanoid';
import { popDialog, pushDialog } from '../../../state/actions/dialogStack';
import alertDialogUrl from '../../../assets/warning.svg';
import PrimaryButton from '../../PrimaryButton';
import { FormattedMessage } from 'react-intl';
import { AlertDialogProps } from '../../AlertDialog';
import { Theme } from '@mui/material/styles';
import { JotaiStore } from '../types';
import { ContentTypeNotFoundError, systemFieldsNotInType, XmlKeys } from './formConsts';
import { v4 as uuid } from 'uuid';

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

/** Takes in a FormsEngine values object and creates the XML representation */
export function buildContentXml(values: LookupTable<unknown>, contentTypesLookup: LookupTable<ContentType>): string {
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

/**
 * Returns the scroll container for the form's container.
 * TODO: After much tweaking and testing, managed to get the form container box itself to be the scrolling element. Asses removal.
 **/
export function getScrollContainer(container: HTMLElement): HTMLElement {
  return container;
}

/**
 * Creates a lookup table of section expanded state (true | false), indexed by section name (e.g. `{ "Hero": true, "SEO": false }`)
 */
export const buildSectionExpandedState = (contentTypeSections: ContentTypeSection[]) => {
  return contentTypeSections.reduce(
    (sectionExpandedState, section) => {
      sectionExpandedState[section.title] = section.expandByDefault;
      return sectionExpandedState;
    },
    {} as Record<string, boolean>
  );
};

export const internalLockContentService: (siteId: string, path: string) => Observable<FormsEngineEditContextProps> = (
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
      fetchAffectedPackages(siteId, path).pipe(
        map((affectedPackages) => ({ ...lockResult, affectedPackages })),
        catchError((error) => of({ ...lockResult, affectedPackages: null, lockError: error.response?.response }))
      )
    )
  );

export const internalUnlockContentService: (siteId: string, path: string) => Observable<FormsEngineEditContextProps> = (
  siteId: string,
  path: string
) =>
  unlock(siteId, path).pipe(
    map(() => ({ locked: false, lockError: null })),
    catchError((error) => of({ locked: true, lockError: error.response?.response }))
  );

/** Takes in the CrafterCMS content XML document and JS object with the values */
export const deserializeContentDom = (contentDom: XMLDocument | Element): LookupTable<unknown> => {
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

export function createSourceMap(descriptorXml: string): FormsEngineSourceMap {
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
}

export const createPathInProject = (fullPath: string) => {
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

export const displayFormBeingSavedSnack = (dispatch: ReduxDispatch, formatMessage: IntlShape['formatMessage']) => {
  dispatch(
    showSystemNotification({ message: formatMessage({ defaultMessage: 'Content is being saved, please wait...' }) })
  );
};

/** Calculates the height for the main form wrapper */
export const getTargetHeight = (isDialog: boolean, isFullScreen: boolean, theme: Theme) =>
  isDialog ? `calc(100vh - ${isFullScreen ? 0 : theme.spacing(4)})` : '100%';

/**
 * Creates the value and validity atoms for a give field.
 **/
export function createFieldAtoms(
  field: ContentTypeField,
  initialValue: unknown,
  formContextRef: RefObject<Pick<StableFormContextProps, 'fieldUpdates$' | 'changedFieldIds' | 'originalValues'>>
): [PrimitiveAtom<unknown>, Atom<FieldValidityState>] {
  let isInitialization = true;
  const valueAtom = atom(initialValue);
  return [
    valueAtom,
    atom((get) => {
      // TODO: It would be best for this to be in a different place and be a sort of effect.
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

/** Creates the readonly flag property atom based on the lock result atom */
export const createReadonlyAtom = (lockedResultAtom: Atom<FormsEngineEditContextProps>) =>
  atom((get) => !get(lockedResultAtom).locked);

export function createFormStackData(mixin?: Partial<StableFormContextProps>): StableFormContextProps {
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
}

// TODO: This is useful for the whole system. Move.
export function showAlert({
  message,
  children,
  dispatch
}: {
  message?: string;
  children?: ReactNode;
  dispatch: ReduxDispatch;
}) {
  const id = nanoid();
  dispatch(
    pushDialog({
      id,
      component: 'craftercms.components.AlertDialog',
      allowFullScreen: false,
      allowMinimize: false,
      props: {
        body: message,
        children,
        imageUrl: alertDialogUrl,
        sxs: { image: { pb: 1 } },
        buttons: (
          <PrimaryButton fullWidth autoFocus onClick={() => dispatch(popDialog({ id }))}>
            <FormattedMessage defaultMessage="Accept" />
          </PrimaryButton>
        )
      } as Partial<AlertDialogProps>
    })
  );
}

/** Retrieves the value of an atom from the supplied jotai store */
export const getFieldAtomValue = (atom: Atom<unknown>, store: JotaiStore) => store.get(atom);

/**
 * Retrieves the values from the form atoms and returns them in a lookup table.
 */
export const extractValueAtoms: (store: JotaiStore, valueAtoms: LookupTable<Atom<unknown>>) => LookupTable<unknown> = (
  store,
  valueAtoms
) =>
  Object.entries(valueAtoms).reduce((values, [fieldId, valueAtom]) => {
    values[fieldId] = store.get(valueAtom);
    return values;
  }, {});

/**
 * Retrieves all the data requirements to show an update form
 * TODO: Create a backend API to fetch this data at once.
 */
export function fetchUpdateRequirements({
  siteId,
  path,
  modelId,
  readonly,
  contentTypesById
}: {
  siteId: string;
  path: string;
  modelId: string;
  readonly: boolean;
  contentTypesById: LookupTable<ContentType>;
}): Observable<FormRequirementsResponse> {
  // Good to start with the lock so that posterior fetch of the item comes with the lock status. If we need
  // to fetch the content type, will need the item first to determine its content type id, but currently relying
  // on a separate load for all content types. Alternatively, we could fetch all types here too if we get a form
  // requirements service.
  return (
    readonly
      ? of({ locked: false, lockError: null, affectedPackages: null } as FormsEngineEditContextProps)
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
        affectedPackages: lockResult.affectedPackages,
        // If opening as readonly, lock result is of no consequence. If opened for edit, will set to readonly
        // if there was an error locking the content (the item is not locked).
        // readonly: readonly || !lockResult.locked,
        contentType,
        pathInSite: createPathInProject(path)
      };
      return props;
    })
  );
}

/**
 * Creates a FormsEngineAtoms object with default values. Allows overriding defaults via `mixin` argument.
 **/
export function createFormsEngineAtoms(mixin?: Partial<FormsEngineAtoms>): FormsEngineAtoms {
  const atoms: FormsEngineAtoms = {
    isSubmitting: atom(false),
    hasPendingChanges: atom(false),
    valueByFieldId: {},
    validationByFieldId: {},
    lockResult: null,
    readonly: null,
    versionComment: atom(''),
    ...mixin
  };
  return atoms;
}

/**
 * Creates the value and validity atoms for a field and sets them on to the target object.
 **/
export function setFieldAtoms(
  stableFormContextRef: RefObject<StableFormContextProps>,
  contentType: ContentType,
  fieldLookup: LookupTable<ContentTypeField>,
  fieldId: string,
  atomsTarget: FormsEngineAtoms,
  value: unknown
): void {
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
  const [valueAtom, validityAtom] = createFieldAtoms(field, value, stableFormContextRef);
  atomsTarget.valueByFieldId[fieldId] = valueAtom;
  atomsTarget.validationByFieldId[fieldId] = validityAtom;
}

export type SystemPropsObject = Record<XmlKeys, string | boolean>;

export function createObjectWithSystemProps(
  contentType: ContentType,
  mixin?: Partial<SystemPropsObject>
): SystemPropsObject {
  const dateIsoString = new Date().toISOString();
  const contentObject: SystemPropsObject = {
    [XmlKeys.modelId]: mixin?.[XmlKeys.modelId] ?? uuid(),
    [XmlKeys.internalName]: mixin?.[XmlKeys.internalName] ?? '',
    [XmlKeys.contentTypeId]: contentType.id,
    [XmlKeys.displayTemplate]: contentType.displayTemplate ?? '',
    [XmlKeys.templateNotRequired]: contentType.displayTemplate ? 'false' : 'true',
    [XmlKeys.mergeStrategy]: contentType.mergeStrategy ?? 'inherit-levels',
    [XmlKeys.dateCreated]: mixin?.[XmlKeys.dateCreated] ?? dateIsoString,
    [XmlKeys.dateCreatedDt]: mixin?.[XmlKeys.dateCreatedDt] ?? dateIsoString,
    [XmlKeys.dateModified]: mixin?.[XmlKeys.dateModified] ?? dateIsoString,
    [XmlKeys.dateModifiedDt]: mixin?.[XmlKeys.dateModifiedDt] ?? dateIsoString,
    [XmlKeys.savedAsDraft]: mixin?.[XmlKeys.savedAsDraft] ?? 'false',
    // // TODO: folderName? fileName?
    [XmlKeys.folderName]: mixin?.[XmlKeys.folderName] ?? '',
    [XmlKeys.fileName]: mixin?.[XmlKeys.fileName] ?? 'index.xml'
  };
  return contentObject;
}
