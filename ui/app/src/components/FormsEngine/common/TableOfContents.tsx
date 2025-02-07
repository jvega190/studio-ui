import React, {
  Dispatch as ReactDispatch,
  RefObject,
  SetStateAction,
  SyntheticEvent,
  useContext,
  useMemo,
  useState
} from 'react';
import LookupTable from '../../../models/LookupTable';
import { ContentTypeField, ContentTypeSection } from '../../../models';
import { FormsEngineAtoms, StableFormContext } from '../formsEngineContext';
import { getScrollContainer } from './formUtils';
import useDebouncedInput from '../../../hooks/useDebouncedInput';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { SearchBar } from '../../SearchBar';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import Box from '@mui/material/Box';
import { useAtomValue } from 'jotai/index';
import { isEmptyValue, isFieldRequired } from '../validateFieldValue';
import FieldEmptyStateIndicator from './FieldEmptyStateIndicator';
import FieldRequiredStateIndicator from './FieldRequiredStateIndicator';

export function TableOfContents({
  containerRef,
  handleSectionExpandedChange,
  contentTypeFields,
  contentTypeSections,
  sectionExpandedState,
  setOpenDrawerSidebar,
  fieldsToRender
}: {
  containerRef: RefObject<HTMLDivElement>;
  handleSectionExpandedChange(fieldId: string, expanded: boolean): void;
  contentTypeFields: LookupTable<ContentTypeField>;
  contentTypeSections: ContentTypeSection[];
  sectionExpandedState: LookupTable<boolean>;
  // TODO: Should send the handleCloseDrawerSidebar instead of allowing direct access to setOpenDrawerSidebar. Consider scroll freeze.
  setOpenDrawerSidebar: ReactDispatch<SetStateAction<boolean>>;
  fieldsToRender: ContentTypeField[];
}) {
  const { atoms } = useContext(StableFormContext);
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

export default TableOfContents;
