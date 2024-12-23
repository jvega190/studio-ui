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

import useSpreadState from '../../hooks/useSpreadState';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPackage } from '../../services/publishing';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { FormattedMessage } from 'react-intl';
import { ApiResponse, PublishingItem } from '../../models';
import { getOffsetLeft, getOffsetTop } from '@mui/material/Popover';
import { showItemMegaMenu } from '../../state/actions/dialogs';
import { EmptyState } from '../EmptyState';
import PackageItemsList from './PackageItemsList';
import { nnou } from '../../utils/object';
import useActiveUser from '../../hooks/useActiveUser';
import { getPublishingPackagePreferredView, setPublishingPackagePreferredView } from '../../utils/state';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import TreeOutlined from '../../icons/TreeOutlined';
import { buttonClasses } from '@mui/material';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import PackageItemsTree from './PackageItemsTree';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';

export interface PackageItemsProps {
  packageId: number;
}

const maxTreeItems = 100;

export interface PackageItem {
  path: PublishingItem['path'];
  label: PublishingItem['itemMetadata']['label'];
  systemType: PublishingItem['itemMetadata']['systemType'];
  mimeType: PublishingItem['itemMetadata']['mimeType'];
}

export function PackageItems(props: PackageItemsProps) {
  const { packageId } = props;
  const siteId = useActiveSiteId();
  const dispatch = useDispatch();
  const [state, setState] = useSpreadState<{
    items: PackageItem[];
    loading: boolean;
    error: ApiResponse;
    total: number;
    limit: number;
    offset: number;
    isNextPageLoading: boolean;
  }>({
    items: null,
    loading: false,
    error: null,
    total: null,
    limit: 100,
    offset: 0,
    isNextPageLoading: false
  });
  const currentPage = state.offset / state.limit;
  const totalPages = state.total ? Math.ceil(state.total / state.limit) : 0;
  const hasNextPage = currentPage + 1 < totalPages;
  const { username } = useActiveUser();
  const storedPreferredView = getPublishingPackagePreferredView(username);
  const [isTreeView, setIsTreeView] = useState(nnou(storedPreferredView) ? storedPreferredView === 'tree' : true);
  const disableTreeView = state.total > maxTreeItems;
  const [expandedPaths, setExpandedPaths] = useState<string[]>();

  useEffect(() => {
    if (packageId) {
      setState({ items: null, loading: true, error: null });
      fetchPackage(siteId, packageId, { limit: state.limit }).subscribe({
        next({ publishPackage, items }) {
          setState({
            items: items.map((item) => ({ ...item.itemMetadata, path: item.path })),
            loading: false,
            offset: 0,
            total: publishPackage.itemCount
          });
        },
        error({ response }) {
          setState({ error: response.response, loading: false });
        }
      });
    }
  }, [packageId, siteId, setState, state.limit]);

  const loadNextPage = () => {
    const pageNumber = currentPage + 1;
    const newOffset = pageNumber * state.limit;
    setState({ isNextPageLoading: true, error: null });
    fetchPackage(siteId, packageId, { limit: state.limit, offset: newOffset }).subscribe({
      next({ publishPackage, items }) {
        setState({
          items: [...state.items, ...items.map((item) => ({ ...item.itemMetadata, path: item.path }))],
          isNextPageLoading: false,
          offset: newOffset,
          total: publishPackage.itemCount
        });
      },
      error({ response }) {
        setState({ error: response.response, isNextPageLoading: false });
      }
    });
  };

  const onOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, item: PackageItem) => {
    const element = e.currentTarget;
    const anchorRect = element.getBoundingClientRect();
    const top = anchorRect.top + getOffsetTop(anchorRect, 'top');
    const left = anchorRect.left + getOffsetLeft(anchorRect, 'left');
    dispatch(
      showItemMegaMenu({
        path: item.path,
        anchorReference: 'anchorPosition',
        anchorPosition: { top, left }
      })
    );
  };

  // TODO: if I want to use generateSingleItemOptions I need the detailed item, should I fetch?
  // const onOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, item: PublishingItem) => {
  //   const itemMenuOptions = generateSingleItemOptions(item as unknown as DetailedItem, formatMessage, {
  //     includeOnly: ['view', 'dependencies', 'history']
  //   });
  //   console.log('itemMenuOptions', itemMenuOptions);
  //   // setContextMenu({ el: e.currentTarget, options: itemMenuOptions.flat(), item });
  // };

  const onSetIsTreeView = (isTreeView: boolean) => {
    setIsTreeView(isTreeView);
    setPublishingPackagePreferredView(username, isTreeView ? 'tree' : 'list');
  };

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
      <Box sx={{ p: 1, flexGrow: 1 }}>
        <Paper
          elevation={1}
          sx={{
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : 'background.paper'),
            display: 'flex',
            flexDirection: 'column',
            minHeight: 420,
            maxHeight: 600,
            overflowY: 'auto'
          }}
        >
          {state.items &&
            (state.items.length === 0 ? (
              <EmptyState
                title={
                  <FormattedMessage
                    id="packageDetailsDialog.emptyPackageMessage"
                    defaultMessage="The package is empty"
                  />
                }
                subtitle={
                  <FormattedMessage
                    id="packageDetailsDialog.emptyPackageMessageSubtitle"
                    defaultMessage="Fetched package id is {packageId}"
                    values={{ packageId }}
                  />
                }
              />
            ) : !disableTreeView && isTreeView ? (
              <PackageItemsTree
                items={state.items}
                onOpenMenu={onOpenMenu}
                expandedPaths={expandedPaths}
                setExpandedPaths={setExpandedPaths}
              />
            ) : (
              <PackageItemsList
                items={state.items}
                totalItems={state.total}
                hasNextPage={hasNextPage}
                isNextPageLoading={state.isNextPageLoading}
                loadNextPage={loadNextPage}
                onOpenMenu={onOpenMenu}
              />
            ))}
        </Paper>
      </Box>
    </>
  );
}

export default PackageItems;
