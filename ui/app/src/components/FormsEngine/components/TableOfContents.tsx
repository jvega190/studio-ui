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

import React, { RefObject, SyntheticEvent, useContext, useMemo, useState } from 'react';
import { ContentTypeField } from '../../../models';
import { FormsEngineAtoms, ItemMetaContext, StableFormContext } from '../lib/formsEngineContext';
import { getScrollContainer } from '../lib/formUtils';
import useDebouncedInput from '../../../hooks/useDebouncedInput';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import SearchBar from '../../SearchBar';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import Box from '@mui/material/Box';
import { useAtomValue, useSetAtom, useStore as useJotaiStore } from 'jotai/index';
import { isEmptyValue, isFieldRequired } from '../lib/validators';
import FieldEmptyStateIndicator from './FieldEmptyStateIndicator';
import FieldRequiredStateIndicator from './FieldRequiredStateIndicator';
import { atom } from 'jotai';

export interface TableOfContentsProps {
	containerRef: RefObject<HTMLDivElement>;
	fieldsToRender: ContentTypeField[];
}

export function TableOfContents({ containerRef, fieldsToRender }: TableOfContentsProps) {
	const store = useJotaiStore();
	const atoms = useContext(StableFormContext).atoms;
	const contentType = useContext(ItemMetaContext).contentType;
	const contentTypeFields = contentType.fields;
	const contentTypeSections = contentType.sections;
	const setOpenDrawerSidebar = useSetAtom(atoms.tableOfContentsDrawerOpen);
	const expandedStateAtoms = atoms.expandedStateBySectionId;
	const expandedSectionIds = useAtomValue(
		useMemo(
			() => atom((get) => Object.entries(expandedStateAtoms).flatMap(([key, atom]) => (get(atom) ? [key] : []))),
			[expandedStateAtoms]
		)
	);
	const scrollToTarget = (target: Element) => {
		// Wait for the drawer to hide so the transition focus doesn't impede the scrollIntoView.
		// When the sidebar is a drawer, the hide transition is set to 0 for this to work with minimal timeout.
		setTimeout(() => {
			getScrollContainer(containerRef.current).style.overflowY = '';
			target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
		});
	};
	const handleSectionClick = (event: SyntheticEvent) => {
		setOpenDrawerSidebar(false);
		const sectionId = event.currentTarget.parentElement.getAttribute('data-section-id');
		if (!store.get(expandedStateAtoms[sectionId])) {
			store.set(expandedStateAtoms[sectionId], true);
		}
		scrollToTarget(containerRef.current.querySelector(`[data-area-id="formBody"] [data-section-id="${sectionId}"]`));
	};
	const handleFieldClick = (event: SyntheticEvent) => {
		// TODO: When filtering and clicked, the section may be collapsed. Through DOM, we can't
		//  get the section id since sections aren't rendered when filtering. How do we get to the section to expand it?
		setOpenDrawerSidebar(false);
		const fieldId = event.currentTarget.parentElement.getAttribute('data-field-id');
		scrollToTarget(containerRef.current.querySelector(`[data-area-id="formBody"] [data-field-id="${fieldId}"]`));
	};
	const handleSectionExpansionToggleClick = (event: SyntheticEvent, itemId: string, expanded: boolean) => {
		event.stopPropagation(); // Avoid accordion expansion
		store.set(expandedStateAtoms[itemId], expanded);
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
				onClick={handleFieldClick}
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
				onItemExpansionToggle={handleSectionExpansionToggleClick}
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
							onClick={handleSectionClick}
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

export default TableOfContents;
