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

import { ElementType } from 'react';
import { ContentTypeField } from '../../models';
import { BuiltInControlType } from './controlMap';
import ContentType from '../../models/ContentType';
import LookupTable from '../../models/LookupTable';
import { NodeSelectorItem } from './controls/NodeSelector';

export enum XmlKeys {
  modelId = 'objectId',
  contentTypeId = 'content-type',
  displayTemplate = 'display-template',
  mergeStrategy = 'merge-strategy',
  fileName = 'file-name',
  folderName = 'folder-name',
  internalName = 'internal-name'
}

// These are not in the content type definition
export const systemFieldsNotInType = [
  XmlKeys.contentTypeId,
  XmlKeys.displayTemplate,
  'no-template-required',
  XmlKeys.mergeStrategy,
  XmlKeys.modelId,
  XmlKeys.fileName,
  XmlKeys.folderName,
  XmlKeys.internalName,
  'createdDate',
  'createdDate_dt',
  'lastModifiedDate',
  'lastModifiedDate_dt'
];

export const validatorsMap: Record<BuiltInControlType, ElementType> = {
  repeat: null,
  'auto-filename': null,
  'aws-file-upload': null,
  'box-file-upload': null,
  'checkbox-group': null,
  checkbox: null,
  'date-time': null,
  disabled: null,
  dropdown: null,
  'file-name': null,
  forcehttps: null,
  'image-picker': null,
  input: null,
  'internal-name': null,
  label: null,
  'link-input': null,
  'link-textarea': null,
  'linked-dropdown': null,
  'locale-selector': null,
  'node-selector': null,
  'numeric-input': null,
  'page-nav-order': null,
  rte: null,
  textarea: null,
  time: null,
  'transcoded-video-picker': null,
  uuid: null,
  'video-picker': null
};

const arrayFieldExtractor = (field: ContentTypeField, values: unknown): unknown => {
  // Controls needn't worry about packaging as `items: { item: [] }`, but when it first gets deserialised, it will have that format.
  const value = values[field.id]?.item ?? values[field.id];
  return Array.isArray(value) ? value : [];
};
const textFieldExtractor = (field: ContentTypeField, values: unknown): unknown => values[field.id] ?? '';
const booleanFieldExtractor = (field: ContentTypeField, values: unknown): unknown =>
  (values[field.id] === true || values[field.id] === 'true') ?? false;

export const valueRetrieverLookup: Record<BuiltInControlType, (field: ContentTypeField, values: unknown) => unknown> = {
  'auto-filename': textFieldExtractor,
  'aws-file-upload': null,
  'box-file-upload': null,
  'checkbox-group': arrayFieldExtractor,
  checkbox: booleanFieldExtractor,
  'date-time': null,
  disabled: booleanFieldExtractor,
  dropdown: textFieldExtractor,
  'file-name': textFieldExtractor,
  forcehttps: null,
  'image-picker': textFieldExtractor,
  input: textFieldExtractor,
  'internal-name': textFieldExtractor,
  label: textFieldExtractor,
  'link-input': textFieldExtractor,
  'link-textarea': textFieldExtractor,
  'linked-dropdown': textFieldExtractor,
  'locale-selector': textFieldExtractor,
  repeat: arrayFieldExtractor,
  'node-selector': arrayFieldExtractor,
  'numeric-input': textFieldExtractor, // Should this parse to number?
  'page-nav-order': null,
  rte: textFieldExtractor,
  textarea: textFieldExtractor,
  time: null,
  'transcoded-video-picker': textFieldExtractor,
  uuid: textFieldExtractor,
  'video-picker': textFieldExtractor
};

export function validateFieldValue(field: ContentTypeField, currentValue: unknown): boolean {
  const isRequired = isFieldRequired(field);
  const isEmpty = isEmptyValue(field, currentValue);
  if (!isRequired && isEmpty) {
    // If not required and its empty, then it's valid.
    return true;
  } else if (!isEmpty) {
    // FE2 TODO: Add other validation types (max length, etc)...
    return true;
  }
  return false;
}

export function isEmptyValue(field: ContentTypeField, currentValue: unknown): boolean {
  return (
    !currentValue ||
    (typeof currentValue === 'string' && currentValue.trim() === '') ||
    (Array.isArray(currentValue) && currentValue.length === 0)
  );
}

export function createCleanValuesObject(
  contentTypeFields: LookupTable<ContentTypeField> | ContentTypeField[],
  xmlDeserialisedValues: LookupTable<unknown>,
  contentTypesLookup: LookupTable<ContentType>
): LookupTable<unknown> {
  const values = {};
  systemFieldsNotInType.forEach((systemFieldId) => {
    if (systemFieldId in xmlDeserialisedValues) {
      values[systemFieldId] = xmlDeserialisedValues[systemFieldId] ?? '';
    }
  });
  (Array.isArray(contentTypeFields) ? contentTypeFields : Object.values(contentTypeFields)).forEach((field) => {
    values[field.id] = retrieveFieldValue(field, xmlDeserialisedValues);
    const controlType = field.type as BuiltInControlType;
    if (controlType === 'node-selector' || controlType === 'repeat') {
      values[field.id] = values[field.id].map(
        controlType === 'repeat'
          ? (item: LookupTable<unknown>) => createCleanValuesObject(field.fields, item, contentTypesLookup)
          : (item: NodeSelectorItem) => {
              try {
                return item.component
                  ? {
                      ...item,
                      component: createCleanValuesObject(
                        contentTypesLookup[(item.component[XmlKeys.contentTypeId] as string).trim()].fields,
                        item.component,
                        contentTypesLookup
                      )
                    }
                  : item;
              } catch (e) {
                console.error(e);
                return item;
              }
            }
      );
    }
  });
  return values;
}

export function retrieveFieldValue<T = unknown>(field: ContentTypeField, values: Record<string, unknown>): T {
  if (!valueRetrieverLookup[field.type]) {
    console.warn(`No value retriever for field ${field.id} of type ${field.type}`);
  }
  return valueRetrieverLookup[field.type]?.(field, values) ?? values[field.id];
}

export function isFieldRequired(field: ContentTypeField): boolean {
  return Boolean(field.validations?.required?.value);
}

export default validateFieldValue;
