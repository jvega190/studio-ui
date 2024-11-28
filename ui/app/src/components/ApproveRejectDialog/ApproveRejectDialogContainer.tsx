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

import { ApproveRejectDialogContainerProps, InternalDialogState } from './utils';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchPackage, PublishingPackage } from '../../services/publishing';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { DialogBody } from '../DialogBody';
import { ApiResponse, ApproveParams, DetailedItem, SandboxItem } from '../../models';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { LoadingState } from '../LoadingState';
import Grid from '@mui/material/Grid2';
import { buttonClasses, listItemSecondaryActionClasses, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import Box from '@mui/material/Box';
import { DependencyChip, renderTreeNode } from '../PublishDialog';
import Divider from '@mui/material/Divider';
import { PersonAvatar } from '../DashletCard/dashletCommons'; // TODO: move this to a common place
import { getPersonFullName } from '../SiteDashboard';
import ItemPublishingTargetIcon from '../ItemPublishingTargetIcon';
import { getItemPublishingTargetText } from '../ItemDisplay/utils';
import Paper from '@mui/material/Paper';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel'; // TODO: move this to a common place
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import TextFieldWithMax from '../TextFieldWithMax';
import { DialogFooter } from '../DialogFooter';
import SecondaryButton from '../SecondaryButton';
import PrimaryButton from '../PrimaryButton';
import Button from '@mui/material/Button';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import TreeOutlined from '../../icons/TreeOutlined';
import IconButton from '@mui/material/IconButton';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { buildPathTrees, PathTreeNode } from '../PublishDialog/buildPathTrees';
import { switchMap } from 'rxjs';
import { fetchDetailedItems } from '../../services/content';
import { map } from 'rxjs/operators';
import ListItem, { listItemClasses } from '@mui/material/ListItem';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ItemDisplay from '../ItemDisplay';
import useSpreadState from '../../hooks/useSpreadState';
import { CannedMessage, fetchCannedMessages } from '../../services/configuration';
import useEnv from '../../hooks/useEnv';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Collapse from '@mui/material/Collapse';
import DateTimeTimezonePicker, { DateTimeTimezonePickerProps } from '../DateTimeTimezonePicker';
import { createAtLeastHalfHourInFutureDate } from '../../utils/datetime';
import { approve, reject } from '../../services/workflow';
import { batchActions } from '../../state/actions/misc';
import { useDispatch } from 'react-redux';
import { showErrorDialog } from '../../state/reducers/dialogs/error';

export function ApproveRejectDialogContainer(props: ApproveRejectDialogContainerProps) {
  const { packageId } = props;
  const { activeEnvironment } = useEnv();
  const [publishingPackage, setPublishingPackage] = useState<PublishingPackage>();
  const [detailedItems, setDetailedItems] = useState<DetailedItem[]>([]);
  const [cannedMessages, setCannedMessages] = useState<CannedMessage[]>([]);
  const [isFetchingPackage, setIsFetchingPackage] = useState(false);
  const [state, setState] = useSpreadState<InternalDialogState>({
    action: null,
    scheduling: null,
    schedule: null,
    approverComment: '',
    rejectReason: 'custom',
    rejectComment: ''
  });
  const [error, setError] = useState<ApiResponse>();
  const siteId = useActiveSiteId();
  const itemsDataSummary = useMemo(() => {
    const itemPaths = [];
    const itemMap: Record<string, DetailedItem> = {};
    detailedItems.forEach((item) => {
      itemMap[item.path] = item;
      itemPaths.push(item.path);
    });
    return {
      itemMap,
      itemPaths
    };
  }, [detailedItems]);
  const [trees, parentTreeNodePaths] = useMemo(() => {
    const treeItemPaths = itemsDataSummary.itemPaths;
    const treeBuilderResult = buildPathTrees(treeItemPaths);
    return [...treeBuilderResult, treeItemPaths] as [PathTreeNode[], string[], string[]];
  }, [itemsDataSummary.itemPaths]);
  const submitLabel =
    state.action === 'reject' ? (
      <FormattedMessage defaultMessage="Reject" />
    ) : (
      <FormattedMessage defaultMessage="Approve" />
    );
  // TODO: add to localStorage
  const [isTreeView, setIsTreeView] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<string[]>();
  const dispatch = useDispatch();

  const statusItems = {
    staging: { stateMap: { staged: true } },
    live: { stateMap: { live: true } }
  };

  // Submit button should be disabled when:
  const submitDisabled =
    // Detailed items haven't loaded
    isFetchingPackage ||
    !detailedItems ||
    // While submitting
    // isSubmitting ||
    // No action has been selected
    !state.action ||
    // If the action is approve and the approver comment is empty
    (state.action === 'approve' && !state.approverComment) ||
    // If the action is reject and the reject comment is empty
    (state.action === 'reject' && !state.rejectComment);

  useEffect(() => {
    setIsFetchingPackage(true);
    fetchPackage(siteId, packageId)
      .pipe(
        switchMap((publishingPackage) =>
          fetchDetailedItems(
            siteId,
            publishingPackage.items.map((item) => item.path)
          ).pipe(map((detailedItemsList) => ({ publishingPackage, detailedItemsList })))
        )
      )
      .subscribe({
        next: ({ publishingPackage, detailedItemsList }) => {
          console.log('publishingPackage', publishingPackage);
          setPublishingPackage(publishingPackage);
          setDetailedItems(detailedItemsList);
          setIsFetchingPackage(false);
        },
        error: ({ response }) => {
          setError(response.response);
          setIsFetchingPackage(false);
        }
      });
  }, [siteId, packageId]);

  useEffect(() => {
    setState({
      scheduling: publishingPackage?.schedule ? 'keep' : 'now',
      schedule: new Date(publishingPackage?.schedule) ?? createAtLeastHalfHourInFutureDate()
    });
  }, [publishingPackage, setState]);

  useEffect(() => {
    if (siteId && activeEnvironment) {
      fetchCannedMessages(siteId, activeEnvironment).subscribe({
        next: (cannedMessages) => {
          setCannedMessages(cannedMessages);
        },
        error: ({ response }) => {
          setError(response);
        }
      });
    }
  }, [siteId, activeEnvironment]);

  // TODO: simplify switch
  const onArgumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: unknown;
    switch (e.target.type) {
      case 'textarea':
        value = e.target.value;
        // dispatch(updatePublishDialog({ hasPendingChanges: true }));
        break;
      case 'radio':
        value = e.target.value;
        break;
      case 'dateTimePicker': {
        value = e.target.value;
        break;
      }
      case 'select': {
        value = e.target.value;
        if (e.target.name === 'rejectReason') {
          setState({ rejectComment: cannedMessages.find((message) => message.key === value)?.message ?? '' });
        }
        break;
      }
      default:
        console.error('Publishing argument change event ignored.');
        return;
    }
    setState({ [e.target.name]: value });
  };

  const handleDateTimePickerChange: DateTimeTimezonePickerProps['onChange'] = (date) => {
    onArgumentChange({
      target: {
        name: 'schedule',
        type: 'dateTimePicker',
        // @ts-expect-error: We're formating this as a change event so ignoring "Type 'Date' is not assignable to type 'string'".
        value: date
      }
    });
  };

  const handleSubmit = () => {
    // TODO: add dialog to redux
    // dispatch(updateApproveRejectDialog({ isSubmitting: true }));
    if (state.action === 'approve') {
      const data: ApproveParams = {
        comment: state.approverComment,
        schedule: state.scheduling === 'custom' ? state.schedule.toISOString() : null,
        updateSchedule: true
      };

      approve(siteId, packageId, data).subscribe({
        next() {
          // dispatch(updateApproveRejectDialog({ isSubmitting: false, hasPendingChanges: false }));
        },
        error({ response }) {
          dispatch(
            batchActions([
              /* updateApproveRejectDialog({ isSubmitting: false }),*/ showErrorDialog({ error: response.response })
            ])
          );
        }
      });
    } else {
      reject(siteId, packageId, state.rejectComment).subscribe({
        next() {
          // dispatch(updateApproveRejectDialog({ isSubmitting: false, hasPendingChanges: false }));
        },
        error({ response }) {
          dispatch(
            batchActions([
              /* updateApproveRejectDialog({ isSubmitting: false }),*/ showErrorDialog({ error: response.response })
            ])
          );
        }
      });
    }
  };

  return (
    <>
      <DialogBody sx={{ px: 4, minHeight: 'calc(100vh * 0.5)' }}>
        {error ? (
          <ApiResponseErrorState error={error} />
        ) : isFetchingPackage ? (
          <LoadingState sx={{ flexGrow: 1 }} />
        ) : publishingPackage ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 5 }}>
              {/* region review */}
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Submitter" />
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonAvatar person={publishingPackage.submitter} />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {getPersonFullName(publishingPackage.submitter)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Package Title" />
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {/* TODO: title doesn't exist yet in package */}
                  {/* {publishingPackage.title}*/}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Submission Comment" />
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {publishingPackage.submitterComment || (
                    <FormattedMessage defaultMessage="No submission comment provided" />
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Publishing Target" />
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <ItemPublishingTargetIcon item={statusItems[publishingPackage.target] as SandboxItem} />
                  <Typography variant="body2" component="span">
                    {getItemPublishingTargetText(statusItems[publishingPackage.target].stateMap)}
                  </Typography>
                </Box>
              </Box>
              {/* endregion */}
              <Divider />
              {/* region form */}
              <Box component="form" sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Action" />
                </Typography>
                <RadioGroup sx={{ mb: 2 }} value={state.action} name="action" onChange={onArgumentChange}>
                  <FormControlLabel
                    value="approve"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VerifiedUserOutlinedIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
                        <FormattedMessage defaultMessage="Approve" />
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="reject"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BlockOutlinedIcon color="error" sx={{ mr: 1, fontSize: 18 }} />
                        <FormattedMessage defaultMessage="Reject" />
                      </Box>
                    }
                  />
                </RadioGroup>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Scheduling" />
                </Typography>
                <RadioGroup sx={{ mb: 1 }} onChange={onArgumentChange} name="scheduling">
                  {publishingPackage?.schedule && (
                    <FormControlLabel
                      value="keep"
                      control={<Radio color="primary" />}
                      // TODO: format date
                      label={<FormattedMessage defaultMessage="Keep" />}
                    />
                  )}
                  <FormControlLabel
                    value="now"
                    control={<Radio color="primary" />}
                    label={<FormattedMessage defaultMessage="Now" />}
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio color="primary" />}
                    label={<FormattedMessage defaultMessage="Later" />}
                  />
                </RadioGroup>
                <Collapse mountOnEnter in={state.scheduling === 'custom'} sx={{ mb: 2 }}>
                  <DateTimeTimezonePicker onChange={handleDateTimePickerChange} value={state.schedule} disablePast />
                </Collapse>
                {state.action === 'approve' ? (
                  <TextFieldWithMax
                    value={state.approverComment}
                    label={<FormattedMessage defaultMessage="Approver Comment" />}
                    fullWidth
                    onChange={onArgumentChange}
                    multiline
                    name="approverComment"
                  />
                ) : (
                  state.action === 'reject' && (
                    <FormControl fullWidth>
                      <InputLabel>
                        <FormattedMessage defaultMessage="Canned Comments" />
                      </InputLabel>
                      <Select
                        fullWidth
                        label={<FormattedMessage defaultMessage="Canned Comments" />}
                        autoFocus
                        value={state.rejectReason}
                        onChange={(e) =>
                          onArgumentChange({
                            ...e,
                            target: { ...e.target, name: 'rejectReason', type: 'select' }
                          } as React.ChangeEvent<HTMLInputElement>)
                        }
                        name="rejectReason"
                        sx={{ mb: 1 }}
                      >
                        <MenuItem value="custom">
                          <FormattedMessage id="rejectDialog.typeMyOwnComment" defaultMessage="Type my own comment" />
                        </MenuItem>
                        {cannedMessages?.map((message) => (
                          <MenuItem value={message.key} key={message.key}>
                            <Typography>{message.title}</Typography>
                          </MenuItem>
                        ))}
                      </Select>
                      <TextFieldWithMax
                        value={state.rejectComment}
                        label={<FormattedMessage defaultMessage="Reject Comment" />}
                        fullWidth
                        onChange={onArgumentChange}
                        multiline
                        name="rejectComment"
                        required
                      />
                    </FormControl>
                  )
                )}
              </Box>
              {/* endregion */}
              <Divider />
              {/* region legend */}
              <Box my={2}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="LEGEND" />
                </Typography>
                <Box display="flex" sx={{ display: 'flex', mb: 1, gap: 1 }}>
                  <DependencyChip type="hard" />
                  <Typography variant="body2" color="textSecondary">
                    <FormattedMessage defaultMessage="References of mandatory submission" />
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <DependencyChip type="soft" />
                  <Typography variant="body2" color="textSecondary">
                    <FormattedMessage defaultMessage="References of optional submission" />
                  </Typography>
                </Box>
              </Box>
              {/* endregion */}
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <Paper
                elevation={1}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? theme.palette.background.default : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* TODO: same as in PublishDialog */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mr={1} ml={1}>
                  <Box display="flex" py={0.5}>
                    <Button
                      size="small"
                      startIcon={isTreeView ? <ListRoundedIcon /> : <TreeOutlined />}
                      sx={{ [`.${buttonClasses.startIcon}`]: { mr: 0.5 } }}
                      onClick={() => setIsTreeView(!isTreeView)}
                    >
                      {/* TODO: should the message be 'Switch to...'? */}
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
                      expandedItems={expandedPaths ?? parentTreeNodePaths}
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
                          itemMap: itemsDataSummary.itemMap,
                          node,
                          onMenuClick: () => {}
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
                      {itemsDataSummary.itemPaths.map((path) => (
                        <ListItem key={path}>
                          <ListItemText
                            primary={
                              <Box display="flex">
                                <ItemDisplay
                                  item={itemsDataSummary.itemMap[path]}
                                  showNavigableAsLinks={false}
                                  sx={{ mr: 1 }}
                                />
                              </Box>
                            }
                            secondary={path}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <></>
        )}
      </DialogBody>
      <DialogFooter>
        <SecondaryButton>
          <FormattedMessage defaultMessage="Cancel" />
        </SecondaryButton>
        <PrimaryButton disabled={submitDisabled} onClick={handleSubmit}>
          {submitLabel}
        </PrimaryButton>
      </DialogFooter>
    </>
  );
}

export default ApproveRejectDialogContainer;
