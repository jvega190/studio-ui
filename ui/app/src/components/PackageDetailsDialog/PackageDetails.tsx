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

import { EmptyState } from '../EmptyState';
import { FormattedMessage } from 'react-intl';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ItemDisplay from '../ItemDisplay';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import React, { useEffect, useState } from 'react';
import { SandboxItem } from '../../models';
import { getOffsetLeft, getOffsetTop } from '@mui/material/Popover';
import { showItemMegaMenu } from '../../state/actions/dialogs';
import { getNumOfMenuOptionsForItem, parseSandBoxItemToDetailedItem } from '../../utils/content';
import { useDispatch } from 'react-redux';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import useSpreadState from '../../hooks/useSpreadState';
import { fetchPackage } from '../../services/publishing';
import { LoadingState } from '../LoadingState';
import ApiResponseErrorState from '../ApiResponseErrorState';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { PublishPackageReview } from '../PublishPackageReviewDialog/PublishPackageReview';
import Box from '@mui/material/Box';
import { Pager } from '../DashletCard/dashletCommons';

export interface PackageDetailsProps {
  packageId: number;
  reviewActions?: React.ReactNode;
}

export function PackageDetails(props: PackageDetailsProps) {
  const { packageId } = props;
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

  const [over, setOver] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (packageId) {
      setState({ items: null, loading: true, error: null });
      fetchPackage(site, packageId, { limit: state.limit }).subscribe({
        next({ publishPackage, items }) {
          setState({
            publishPackage,
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
  }, [packageId, site, setState, state.limit]);

  const loadPage = (pageNumber: number) => {
    const newOffset = pageNumber * state.limit;
    setState({ items: null, loading: true, error: null });
    fetchPackage(site, packageId, { limit: state.limit, offset: newOffset }).subscribe({
      next({ publishPackage, items }) {
        setState({
          items: items.map((item) => ({ ...item.itemMetadata, path: item.path })),
          loading: false,
          offset: newOffset,
          total: publishPackage.itemCount
        });
      },
      error({ response }) {
        setState({ error: response.response, loading: false });
      }
    });
  };

  function onRowsPerPageChange(rowsPerPage: number) {
    setState({
      limit: rowsPerPage,
      offset: 0
    });
  }

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

  return (
    <>
      {state.loading && <LoadingState styles={{ root: { width: 100, minHeight: 420 } }} />}
      {state.error && <ApiResponseErrorState error={state.error} />}
      {!Boolean(packageId) && (
        <Typography color="error.main">
          <FormattedMessage
            id="packageDetailsDialog.missingPackageId"
            defaultMessage="Unable to fetch package details as package id was not provided to this UI"
          />
        </Typography>
      )}
      {!state.loading && state.publishPackage && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <PublishPackageReview publishPackage={state.publishPackage} />
            {props.reviewActions}
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
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
              ) : (
                <Paper
                  elevation={1}
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? theme.palette.background.default : 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100% - 40px)'
                  }}
                >
                  <List sx={{ minHeight: 420, overflowY: 'auto', p: 0 }}>
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
                </Paper>
              ))}
            <Box display="flex" justifyContent="space-between" sx={{ py: 1 }}>
              <Pager
                totalPages={totalPages}
                totalItems={state.total}
                currentPage={currentPage}
                rowsPerPage={state.limit}
                onPagePickerChange={(page) => loadPage(page)}
                onPageChange={(page) => loadPage(page)}
                onRowsPerPageChange={onRowsPerPageChange}
              />
            </Box>
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default PackageDetails;
