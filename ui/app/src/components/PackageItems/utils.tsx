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

import LookupTable from '../../models/LookupTable';
import { DetailedItem } from '../../models';
import { PathTreeNode } from '../PublishDialog/buildPathTrees';
import React from 'react';
import { DependencyChip, DependencyMap } from '../PublishDialog';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Box from '@mui/material/Box';
import ItemDisplay from '../ItemDisplay';
import { Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import Checkbox from '@mui/material/Checkbox';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';

export function renderTreeNode(props: {
  itemMap: LookupTable<DetailedItem>;
  node: PathTreeNode;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, path: string) => void;
  dependencyTypeMap?: DependencyMap;
  onCheckboxChange?: (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => void;
  selectedDependencies?: string[];
  showItemTarget?: boolean;
}) {
  const {
    itemMap,
    node,
    onMenuClick,
    dependencyTypeMap,
    onCheckboxChange,
    selectedDependencies,
    showItemTarget = true
  } = props;
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
                  showPublishingTarget={showItemTarget}
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
          <Box display="flex" alignItems="center">
            <FolderOpenRoundedIcon sx={{ fontSize: '1.1rem', mr: '5px' }} />
            <span title={node.path}>{node.label}</span>
          </Box>
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
                selectedDependencies,
                showItemTarget
              })
            )
      }
    />
  );
}
