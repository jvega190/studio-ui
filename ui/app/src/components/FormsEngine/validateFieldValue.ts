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
import { RepeatItem } from './controls/Repeat';

export enum XmlKeys {
  modelId = 'objectId',
  contentTypeId = 'content-type',
  displayTemplate = 'display-template',
  mergeStrategy = 'merge-strategy',
  fileName = 'file-name',
  folderName = 'folder-name',
  internalName = 'internal-name',
  templateNotRequired = 'no-template-required',
  dateCreated = 'createdDate',
  dateModified = 'lastModifiedDate'
}

// These are not in the content type definition
export const systemFieldsNotInType = [
  XmlKeys.contentTypeId,
  XmlKeys.displayTemplate,
  XmlKeys.templateNotRequired,
  XmlKeys.mergeStrategy,
  XmlKeys.modelId,
  XmlKeys.fileName,
  XmlKeys.folderName,
  XmlKeys.internalName,
  XmlKeys.dateCreated,
  `${XmlKeys.dateCreated}_dt`,
  XmlKeys.dateModified,
  `${XmlKeys.dateModified}_dt`
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

type ValueRetriever<T = unknown> = (value: unknown, field: ContentTypeField) => T;

const arrayFieldExtractor: ValueRetriever<unknown[]> = (value) =>
  // Controls needn't worry about packaging as `items: { item: [] }`, but when it first gets deserialised, it will have that format.
  Array.isArray(value) ? value : ((value as Record<'item', unknown[]>)?.item ?? []);
const textFieldExtractor: ValueRetriever<string> = (value) => (value && String(value)) ?? '';
const booleanFieldExtractor: ValueRetriever<boolean> = (value) => (value === true || value === 'true') ?? false;

export const valueRetrieverLookup: Record<BuiltInControlType, ValueRetriever> = {
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

export interface FieldValidityState {
  isValid: boolean;
  messages: string[];
}

export function validateFieldValue(field: ContentTypeField, currentValue: unknown): FieldValidityState {
  let isValid = false;
  const isRequired = isFieldRequired(field);
  const isEmpty = isEmptyValue(field, currentValue);
  if (!isRequired && isEmpty) {
    // If not required and its empty, then it's valid.
    isValid = true;
  } else if (!isEmpty) {
    // FE2 TODO: Add other validation types (max length, etc)...
    isValid = true;
  }
  return {
    isValid,
    messages: isValid ? null : ['This field is required.']
  };
}

export function isEmptyValue(field: ContentTypeField, currentValue: unknown): boolean {
  return (
    !currentValue ||
    (typeof currentValue === 'string' && currentValue.trim() === '') ||
    (Array.isArray(currentValue) && currentValue.length === 0)
  );
}

/**
 * Takes in the raw deserialized values from a content XML and returns a clean object with the values ran through the
 * field's value retriever.
 * @param contentTypeFields The fields of the content type
 * @param xmlDeserializedValues The raw deserialized values from the content XML
 * @param contentTypesLookup A lookup table of content types
 * @param fieldCallback A callback to run for each field
 **/
export function createCleanValuesObject(
  contentTypeFields: LookupTable<ContentTypeField> | ContentTypeField[],
  xmlDeserializedValues: LookupTable<unknown>,
  contentTypesLookup: LookupTable<ContentType>,
  fieldCallback?: (fieldId: string, value: unknown) => void
): LookupTable<unknown> {
  const values = {};
  systemFieldsNotInType.forEach((systemFieldId) => {
    if (systemFieldId in xmlDeserializedValues) {
      values[systemFieldId] = xmlDeserializedValues[systemFieldId] ?? '';
      fieldCallback?.(systemFieldId, values[systemFieldId]);
    }
  });
  (Array.isArray(contentTypeFields) ? contentTypeFields : Object.values(contentTypeFields)).forEach((field) => {
    values[field.id] = createCleanValueForField(xmlDeserializedValues[field.id], field, contentTypesLookup);
    fieldCallback?.(field.id, values[field.id]);
  });
  return values;
}

export function createCleanValueForField<T = unknown>(
  xmlDeserializedValue: unknown,
  field: ContentTypeField,
  contentTypesLookup: LookupTable<ContentType>
): T {
  const value = retrieveFieldValue<T>(field, xmlDeserializedValue);
  const controlType = field.type as BuiltInControlType;
  switch (controlType) {
    case 'repeat': {
      return (value as Array<RepeatItem>).map((item) =>
        createCleanValuesObject(field.fields, item, contentTypesLookup)
      ) as T;
    }
    case 'node-selector': {
      return (value as Array<NodeSelectorItem>).map((item) => {
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
      }) as T;
    }
  }
  return value;
}

export function retrieveFieldValue<T = unknown>(field: ContentTypeField, value: unknown): T {
  const retriever: ValueRetriever<T> | undefined = valueRetrieverLookup[field.type];
  if (!retriever) {
    console.warn(`No value retriever for field ${field.id} of type ${field.type}`);
    return Array.isArray(value) ? (arrayFieldExtractor(value, field) as T) : (value as T);
  }
  return retriever(value, field);
}

export function isFieldRequired(field: ContentTypeField): boolean {
  return Boolean(field.validations?.required?.value);
}

export default validateFieldValue;
