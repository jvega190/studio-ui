/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
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

import React, { useEffect, useState } from 'react';
import useSpreadState from '../../hooks/useSpreadState';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import { LoadingState } from '../LoadingState';
import Typography from '@mui/material/Typography';
import { EmptyState } from '../EmptyState';
import List from '@mui/material/List';
import ItemDisplay from '../ItemDisplay';
import { EnhancedDialog, EnhancedDialogProps } from '../EnhancedDialog';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useDispatch } from 'react-redux';
import { getOffsetLeft, getOffsetTop } from '@mui/material/Popover';
import { showItemMegaMenu } from '../../state/actions/dialogs';
import { getNumOfMenuOptionsForItem, parseSandBoxItemToDetailedItem } from '../../utils/content';
import { SandboxItem } from '../../models';
import ListItemButton from '@mui/material/ListItemButton';
import DialogFooter from '../DialogFooter';
import ApiResponseErrorState from '../ApiResponseErrorState';
import { fetchPackage } from '../../services/publishing';
import ListItemText from '@mui/material/ListItemText';

const dialogContentHeight = 420;

export interface PackageDetailsDialogProps extends EnhancedDialogProps {
  packageId: number;
}

export function PackageDetailsDialog(props: PackageDetailsDialogProps) {
  const { packageId, ...enhancedDialogProps } = props;
  const site = useActiveSiteId();
  const [state, setState] = useSpreadState({
    publishPackage: null,
    items: null,
    loading: false,
    error: null,
    total: null,
    limit: 10,
    offset: 0
  });
  const currentPage = state.offset / state.limit;
  const totalPages = state.total ? Math.ceil(state.total / state.limit) : 0;
  const dispatch = useDispatch();
  const [over, setOver] = useState(null);

  useEffect(() => {
    if (packageId) {
      setState({ items: null, loading: true, error: null });
      fetchPackage(site, packageId).subscribe({
        next(publishPackage) {
          setState({
            publishPackage,
            items: publishPackage.items.map((item) => ({ ...item.itemMetadata, path: item.path })),
            loading: false,
            offset: 0,
            total: publishPackage.items.length
          });
        }
      });
    }
  }, [packageId, site, setState, state.limit]);

  const onOpenMenu = (element: Element, item: SandboxItem) => {
    const anchorRect = element.getBoundingClientRect();
    const top = anchorRect.top + getOffsetTop(anchorRect, 'top');
    const left = anchorRect.left + getOffsetLeft(anchorRect, 'left');
    dispatch(
      showItemMegaMenu({
        path: item.path,
        anchorReference: 'anchorPosition',
        anchorPosition: { top, left },
        loaderItems: getNumOfMenuOptionsForItem(parseSandBoxItemToDetailedItem(item))
      })
    );
  };

  // TODO: no pagination in current API
  // const loadPage = (pageNumber: number) => {
  //   const newOffset = pageNumber * state.limit;
  //   setState({ items: null, loading: true, error: null });
  //   fetchPublishingHistoryPackageItems(site, packageId, { limit: state.limit, offset: newOffset }).subscribe({
  //     next: (items) => {
  //       setState({ items, loading: false, offset: newOffset, total: items.total });
  //     },
  //     error({ response }) {
  //       setState({ error: response.response, loading: false });
  //     }
  //   });
  // };

  function onRowsPerPageChange(rowsPerPage: number) {
    setState({
      limit: rowsPerPage,
      offset: 0
    });
  }

  return (
    <EnhancedDialog
      fullWidth
      maxWidth="md"
      {...enhancedDialogProps}
      title={
        <FormattedMessage
          id="packageDetailsDialog.packageDetailsDialogTitle"
          defaultMessage="Publishing Package Details"
        />
      }
      subtitle={
        <FormattedMessage
          defaultMessage="{title} ({itemCount} {itemCount, plural, one {item} other {items}})"
          values={{
            title: state.publishPackage?.title,
            itemCount: state.total
          }}
        />
      }
    >
      <DialogContent sx={{ p: 1 }}>
        {state.loading && <LoadingState styles={{ root: { width: 100, height: dialogContentHeight } }} />}
        {state.error && <ApiResponseErrorState error={state.error} />}
        {!Boolean(packageId) && (
          <Typography color="error.main">
            <FormattedMessage
              id="packageDetailsDialog.missingPackageId"
              defaultMessage="Unable to fetch package details as package id was not provided to this UI"
            />
          </Typography>
        )}
        {state.items &&
          (state.items.length === 0 ? (
            <EmptyState
              title={
                <FormattedMessage id="packageDetailsDialog.emptyPackageMessage" defaultMessage="The package is empty" />
              }
              subtitle={
                <FormattedMessage
                  id="packageDetailsDialog.emptyPackageMessageSubtitle"
                  defaultMessage="Fetched package id is {packageId}"
                  values={{ packageId }}
                />
              }
            />
          ) : (
            <>
              <List sx={{ height: dialogContentHeight, overflowY: 'auto', p: 0 }}>
                {state.items.map((item) => (
                  <ListItemButton
                    key={item.path}
                    onMouseOver={() => setOver(item.path)}
                    onMouseOut={() => setOver(null)}
                    sx={{
                      cursor: 'default',
                      justifyContent: 'space-between'
                    }}
                  >
                    <ListItemText
                      primary={
                        <ItemDisplay
                          item={item}
                          titleDisplayProp="path"
                          showWorkflowState={false}
                          showPublishingTarget={false}
                          showNavigableAsLinks={false}
                        />
                      }
                      secondary={item.path}
                    />

                    {over === item.path && (
                      <Tooltip title={<FormattedMessage defaultMessage="Options" />}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            onOpenMenu(e.currentTarget, item);
                          }}
                          sx={{ padding: 0 }}
                        >
                          <MoreVertRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemButton>
                ))}
              </List>
            </>
          ))}
      </DialogContent>
      <DialogFooter>
        <Box display="flex" justifyContent="space-between">
          {/* <Pager
            totalPages={totalPages}
            totalItems={state.total}
            currentPage={currentPage}
            rowsPerPage={state.limit}
            onPagePickerChange={(page) => loadPage(page)}
            onPageChange={(page) => loadPage(page)}
            onRowsPerPageChange={onRowsPerPageChange}
          />*/}
        </Box>
      </DialogFooter>
    </EnhancedDialog>
  );
}

export default PackageDetailsDialog;
