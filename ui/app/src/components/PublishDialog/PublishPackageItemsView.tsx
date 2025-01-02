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

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import TreeOutlined from '../../icons/TreeOutlined';
import { buttonClasses, listItemSecondaryActionClasses } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import ListItem, { listItemClasses } from '@mui/material/ListItem';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import ItemDisplay from '../ItemDisplay';
import React, { useCallback, useState } from 'react';
import { DependencyChip, DependencyDataState } from './PublishDialogContainer';
import { AllItemActions, DetailedItem } from '../../models';
import { PathTreeNode } from './buildPathTrees';
import { getPublishingPackagePreferredView, setPublishingPackagePreferredView } from '../../utils/state';
import { nnou } from '../../utils/object';
import useActiveUser from '../../hooks/useActiveUser';
import MenuItem from '@mui/material/MenuItem';
import { generateSingleItemOptions, itemActionDispatcher } from '../../utils/itemActions';
import useEnv from '../../hooks/useEnv';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { useDispatch } from 'react-redux';
import { renderTreeNode } from '../PackageItems/utils';
import { FixedSizeList as List } from 'react-window';
import Popover, { getOffsetLeft, getOffsetTop } from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import AutoSizer from 'react-virtualized-auto-sizer';

export interface PublishItemsProps {
  itemMap: Record<string, DetailedItem>;
  defaultExpandedPaths?: string[];
  itemsAndDependenciesPaths: string[];
  dependencyTypeMap?: DependencyDataState['typeByPath'];
  selectedDependenciesPaths?: string[];
  selectedDependenciesMap?: Record<string, boolean>;
  trees: PathTreeNode[];
  onCheckboxChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => void;
}

const maxTreeItems = 100;

export function PublishPackageItemsView(props: PublishItemsProps) {
  const {
    itemMap,
    defaultExpandedPaths = [],
    itemsAndDependenciesPaths,
    dependencyTypeMap = {},
    selectedDependenciesPaths = [],
    selectedDependenciesMap = {},
    trees,
    onCheckboxChange
  } = props;
  const { username } = useActiveUser();
  const storedPreferredView = getPublishingPackagePreferredView(username);
  const [isTreeView, setIsTreeView] = useState(nnou(storedPreferredView) ? storedPreferredView === 'tree' : true);
  const [expandedPaths, setExpandedPaths] = useState<string[]>();
  const siteId = useActiveSiteId();
  const { authoringBase } = useEnv();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [contextMenu, setContextMenu] = useState({
    item: null,
    options: null,
    anchorPosition: null
  });
  const totalItems = itemsAndDependenciesPaths.length;
  const disableTreeView = totalItems > maxTreeItems;

  const onContextMenuClose = () => {
    setContextMenu({
      item: null,
      options: null,
      anchorPosition: null
    });
  };

  const onSetIsTreeView = (isTreeView: boolean) => {
    setIsTreeView(isTreeView);
    setPublishingPackagePreferredView(username, isTreeView ? 'tree' : 'list');
  };

  const onMenuItemClicked = (option: string) => {
    itemActionDispatcher({
      site: siteId,
      item: contextMenu.item,
      option: option as AllItemActions,
      authoringBase,
      dispatch,
      formatMessage
    });
    onContextMenuClose();
  };

  const onContextMenuOpen = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, path: string) => {
      const item = itemMap[path];
      const element = e.currentTarget;
      const anchorRect = element.getBoundingClientRect();
      const top = anchorRect.top + getOffsetTop(anchorRect, 'top');
      const left = anchorRect.left + getOffsetLeft(anchorRect, 'left');
      const itemMenuOptions = generateSingleItemOptions(item, formatMessage, {
        includeOnly: ['view', 'dependencies', 'history']
      });
      setContextMenu({ anchorPosition: { top, left }, options: itemMenuOptions.flat(), item });
    },
    [formatMessage, itemMap]
  );

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mr={1} ml={1}>
        <Box display="flex" py={0.5}>
          <Tooltip
            title={
              disableTreeView ? (
                <FormattedMessage
                  defaultMessage="Tree view is disabled for packages with more than {maxTreeItems} items due to performance considerations."
                  values={{
                    maxTreeItems
                  }}
                />
              ) : (
                ''
              )
            }
          >
            <Box component="span">
              <Button
                size="small"
                startIcon={!disableTreeView && isTreeView ? <ListRoundedIcon /> : <TreeOutlined />}
                sx={{ [`.${buttonClasses.startIcon}`]: { mr: 0.5 } }}
                onClick={() => onSetIsTreeView(!isTreeView)}
                disabled={disableTreeView}
              >
                {!disableTreeView && isTreeView ? (
                  <FormattedMessage defaultMessage="List View" />
                ) : (
                  <FormattedMessage defaultMessage="Tree View" />
                )}
              </Button>
            </Box>
          </Tooltip>
          {!disableTreeView && isTreeView && (
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
        {!disableTreeView && isTreeView ? (
          <SimpleTreeView
            expandedItems={expandedPaths ?? defaultExpandedPaths}
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
                onMenuClick: onContextMenuOpen,
                onCheckboxChange,
                selectedDependencies: selectedDependenciesPaths
              })
            )}
          </SimpleTreeView>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List height={height} itemCount={totalItems} itemSize={59} width={width}>
                {({ index, style }) => {
                  const path = itemsAndDependenciesPaths[index];
                  return (
                    <Box
                      style={style}
                      sx={{
                        [`.${listItemSecondaryActionClasses.root}`]: { right: (theme) => theme.spacing(1) },
                        [`.${listItemClasses.root} .item-menu-button`]: { display: 'none' },
                        [`.${listItemClasses.root}:hover`]: { bgcolor: 'action.hover' },
                        [`.${listItemClasses.root}:hover .item-menu-button`]: { display: 'flex' }
                      }}
                    >
                      <ListItem
                        key={path}
                        secondaryAction={
                          <Box display="flex" alignItems="center">
                            <IconButton
                              className="item-menu-button"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onContextMenuOpen?.(e, path);
                              }}
                            >
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
                    </Box>
                  );
                }}
              </List>
            )}
          </AutoSizer>
        )}
      </Box>
      <Popover
        open={Boolean(contextMenu.anchorPosition)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu.anchorPosition}
        onClose={onContextMenuClose}
      >
        {contextMenu.options?.map((option) => (
          <MenuItem key={option.id} onClick={() => onMenuItemClicked(option.id)}>
            {option.label}
          </MenuItem>
        ))}
      </Popover>
    </>
  );
}

export default PublishPackageItemsView;
