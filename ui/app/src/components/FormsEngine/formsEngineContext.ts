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

import { createContext, MutableRefObject, SyntheticEvent, useContext } from 'react';
import { ContentTypeField, SandboxItem } from '../../models';
import PluginDescriptor from '../../models/PluginDescriptor';
import ContentType from '../../models/ContentType';
import ApiResponse from '../../models/ApiResponse';
import { FormsEngineProps } from './FormsEngine';
import LookupTable from '../../models/LookupTable';

export type FormsEngineSourceMap = LookupTable<string>;

export interface FormsEngineContextProps {
  readonly: boolean;
  values: LookupTable<unknown>;
  originalValuesJson: string;
  sourceMap: FormsEngineSourceMap;
  contentType: ContentType;
  fieldValidityState: LookupTable<{ isValid: boolean; messages: string[] }>;
  item: SandboxItem;
  locked: boolean;
  lockError: ApiResponse;
  affectedItemsInWorkflow: SandboxItem[];
  pathInProject: string;
  requirementsFetched: boolean;
  isSubmitting: boolean;
  hasPendingChanges: boolean;
  changedFieldIds: Set<string>;
  versionComment: string;
  // TODO: Move to local state?
  fieldHelpExpandedState: LookupTable<boolean>;
  formsStackProps: FormsEngineProps[];
  formsStackState: FormsEngineContextProps[];
  previousScrollTopPosition: number;
  sectionExpandedState: LookupTable<boolean>;
  activeTab: number;
  // TODO Remove if not in use:
  formsEngineExtensions: PluginDescriptor;
  contentDom: XMLDocument | Element;
  contentXml: string;
  contentTypeXml: string;
}

export interface FormsEngineContextApi {
  update: {
    (newState: Partial<FormsEngineContextProps>): void;
    <K extends keyof FormsEngineContextProps>(key: K, value: FormsEngineContextProps[K]): void;
  };
  updateValue: (fieldId: string, value: unknown) => void;
  handleTabChange(event: SyntheticEvent, newValue: number): void;
  setAccordionExpandedState(sectionId: string, expanded: boolean): void;
  handleToggleSectionAccordion(event: SyntheticEvent, expanded: boolean): void;
  handleViewFieldHelpText(event: SyntheticEvent, field: ContentTypeField): void;
  pushForm(formProps: FormsEngineProps): void;
  popForm(): void;
  updateStackedFormState(stackIndex: number, state: FormsEngineContextProps): void;
}

export type FormsEngineContextType = [FormsEngineContextProps, MutableRefObject<FormsEngineContextApi>];

export const FormsEngineContext = createContext<FormsEngineContextType>(null);

export function useFormsEngineContext() {
  const context = useContext(FormsEngineContext);
  if (!context) {
    throw new Error('useFormEngineContext must be used within a FormEngineContextProvider');
  }
  return context;
}
