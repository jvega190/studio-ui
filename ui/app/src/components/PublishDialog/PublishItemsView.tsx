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

// TODO: move the renderTreeNode fn here?

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import TreeOutlined from '../../icons/TreeOutlined';
import { buttonClasses, listItemSecondaryActionClasses, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import List from '@mui/material/List';
import ListItem, { listItemClasses } from '@mui/material/ListItem';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import ItemDisplay from '../ItemDisplay';
import React from 'react';
import { DependencyChip, DependencyDataState, DependencyMap } from './PublishDialogContainer';
import { DetailedItem } from '../../models';
import { PathTreeNode } from './buildPathTrees';
import LookupTable from '../../models/LookupTable';

// TODO: add sxs
export interface PublishItemsProps {
  itemMap: Record<string, DetailedItem>;
  isTreeView: boolean;
  setIsTreeView: (isTreeView: boolean) => void;
  expandedPaths: string[];
  itemsAndDependenciesPaths: string[];
  dependencyTypeMap?: DependencyDataState['typeByPath'];
  selectedDependenciesPaths?: string[];
  selectedDependenciesMap?: Record<string, boolean>;
  trees: PathTreeNode[];
  setExpandedPaths: (expandedPaths: string[]) => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>, path: string) => void;
  onCheckboxChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => void;
}

function renderTreeNode(props: {
  itemMap: LookupTable<DetailedItem>;
  node: PathTreeNode;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, path: string) => void;
  dependencyTypeMap?: DependencyMap;
  onCheckboxChange?: (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => void;
  selectedDependencies?: string[];
}) {
  const { itemMap, node, onMenuClick, dependencyTypeMap, onCheckboxChange, selectedDependencies } = props;
  const isItem = Boolean(itemMap[node.path]);
  const isDependency = Boolean(dependencyTypeMap?.[node.path]);
  const isSoft = dependencyTypeMap?.[node.path] === 'soft';
  return (
    <TreeItem
      key={node.path}
      itemId={node.path}
      data-is-item={isItem}
      label={
        isItem ? (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <div>
              <Box display="flex">
                <ItemDisplay
                  item={itemMap[node.path]}
                  showNavigableAsLinks={false}
                  showWorkflowState={false}
                  sx={{ mr: 1 }}
                />
                {isDependency && <DependencyChip type={dependencyTypeMap[node.path]} />}
              </Box>
              <Typography
                component="div"
                variant="body2"
                color="text.secondary"
                children={node.path}
                title={node.path}
                noWrap
              />
            </div>
            <Box display="flex">
              <IconButton
                className="tree-item-more-section"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick?.(e, node.path);
                }}
              >
                <MoreVertRounded />
              </IconButton>
              {isSoft && (
                <Checkbox
                  size="small"
                  checked={selectedDependencies?.includes(node.path)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e, checked) => {
                    onCheckboxChange?.(e, checked, node.path);
                  }}
                />
              )}
            </Box>
          </Box>
        ) : (
          // TODO: Add folder icon
          <span title={node.path}>{node.label}</span>
        )
      }
      children={
        node.children?.length === 0
          ? undefined
          : node.children.map((child) =>
              renderTreeNode({
                itemMap,
                node: child,
                dependencyTypeMap,
                onMenuClick,
                onCheckboxChange,
                selectedDependencies
              })
            )
      }
    />
  );
}

export function PublishItemsView(props: PublishItemsProps) {
  const {
    itemMap,
    isTreeView,
    setIsTreeView,
    expandedPaths,
    itemsAndDependenciesPaths,
    dependencyTypeMap = {},
    selectedDependenciesPaths = [],
    selectedDependenciesMap = {},
    trees,
    setExpandedPaths,
    onMenuClick,
    onCheckboxChange
  } = props;
  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mr={1} ml={1}>
        <Box display="flex" py={0.5}>
          <Button
            size="small"
            startIcon={isTreeView ? <ListRoundedIcon /> : <TreeOutlined />}
            sx={{ [`.${buttonClasses.startIcon}`]: { mr: 0.5 } }}
            onClick={() => setIsTreeView(!isTreeView)}
          >
            {isTreeView ? (
              <FormattedMessage defaultMessage="List View" />
            ) : (
              <FormattedMessage defaultMessage="Tree View" />
            )}
          </Button>
          {isTreeView && (
            <>
              <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
              <IconButton size="small" color="primary" onClick={() => setExpandedPaths(undefined)}>
                <UnfoldMoreRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="primary" onClick={() => setExpandedPaths([])}>
                <UnfoldLessRoundedIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 1, flexGrow: 1, overflowY: 'auto' }}>
        {isTreeView ? (
          <SimpleTreeView
            expandedItems={expandedPaths}
            onExpandedItemsChange={(event, itemIds) => setExpandedPaths(itemIds)}
            disableSelection
            sx={{
              '.tree-item-more-section': { display: 'none' },
              [`.${treeItemClasses.content}:hover`]: {
                '.tree-item-more-section': { display: 'flex' }
              },
              [`[data-is-item="false"] > .${treeItemClasses.content} > .${treeItemClasses.checkbox}`]: {
                display: 'none'
              }
            }}
          >
            {trees.map((node) =>
              renderTreeNode({
                itemMap,
                node,
                dependencyTypeMap,
                onMenuClick,
                onCheckboxChange,
                selectedDependencies: selectedDependenciesPaths
              })
            )}
          </SimpleTreeView>
        ) : (
          <List
            dense
            sx={{
              [`.${listItemSecondaryActionClasses.root}`]: { right: (theme) => theme.spacing(1) },
              [`.${listItemClasses.root} .item-menu-button`]: { display: 'none' },
              [`.${listItemClasses.root}:hover`]: { bgcolor: 'action.hover' },
              [`.${listItemClasses.root}:hover .item-menu-button`]: { display: 'flex' }
            }}
          >
            {itemsAndDependenciesPaths.map((path) => (
              <ListItem
                key={path}
                secondaryAction={
                  <Box display="flex" alignItems="center">
                    <IconButton className="item-menu-button" size="small">
                      <MoreVertRounded />
                    </IconButton>
                    {dependencyTypeMap?.[path] === 'soft' && (
                      <Checkbox
                        size="small"
                        checked={selectedDependenciesMap[path]}
                        onChange={(e, checked) => onCheckboxChange?.(e, checked, path)}
                      />
                    )}
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box display="flex">
                      <ItemDisplay
                        item={itemMap[path]}
                        showNavigableAsLinks={false}
                        showWorkflowState={false}
                        sx={{ mr: 1 }}
                      />
                      <DependencyChip type={dependencyTypeMap?.[path]} />
                    </Box>
                  }
                  secondary={path}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </>
  );
}

export default PublishItemsView;
