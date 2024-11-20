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

import { useSpreadState } from '../../hooks/useSpreadState';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PublishingTarget } from '../../models/Publishing';
import LookupTable from '../../models/LookupTable';
import { InternalDialogState, paths, PublishDialogContainerProps } from './utils';
import { useActiveSiteId } from '../../hooks/useActiveSiteId';
import { useDispatch } from 'react-redux';
import { fetchPublishingTargets, FetchPublishingTargetsResponse } from '../../services/publishing';
import { getComputedPublishingTarget, getDateScheduled } from '../../utils/content';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { createPresenceTable } from '../../utils/array';
import { fetchDependencies, FetchDependenciesResponse } from '../../services/dependencies';
import useStyles from './styles';
import { useSelection } from '../../hooks/useSelection';
import { capitalize, isBlank } from '../../utils/string';
import { updatePublishDialog } from '../../state/actions/dialogs';
import { approve, publish, requestPublish } from '../../services/workflow';
import { fetchDetailedItems } from '../../services/content';
import { DetailedItem } from '../../models';
import { fetchDetailedItemsComplete } from '../../state/actions/content';
import { createAtLeastHalfHourInFutureDate } from '../../utils/datetime';
import { batchActions } from '../../state/actions/misc';
import { showErrorDialog } from '../../state/reducers/dialogs/error';
import { buildPathTrees, PathTreeNode } from './buildPathTrees';
import useUpdateRefs from '../../hooks/useUpdateRefs';
import DialogBody from '../DialogBody';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { LoadingState } from '../LoadingState';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import { buttonClasses, Typography } from '@mui/material';
import DependencySelection from '../DependencySelection';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Collapse from '@mui/material/Collapse';
import DateTimeTimezonePicker, { DateTimeTimezonePickerProps } from '../DateTimeTimezonePicker';
import Link from '@mui/material/Link';
import TextFieldWithMax from '../TextFieldWithMax';
import { EmptyState } from '../EmptyState';
import DialogFooter from '../DialogFooter';
import SecondaryButton from '../SecondaryButton';
import PrimaryButton from '../PrimaryButton';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ItemDisplay from '../ItemDisplay';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import ListRoundedIcon from '@mui/icons-material/ListRounded';

const messages = defineMessages({
  emailLabel: {
    id: 'publishForm.emailLabel',
    defaultMessage: "Email me the reviewer's feedback"
  },
  scheduling: {
    id: 'publishForm.scheduling',
    defaultMessage: 'Scheduling'
  },
  schedulingNow: {
    id: 'publishForm.schedulingNow',
    defaultMessage: 'Now'
  },
  schedulingLater: {
    id: 'publishForm.schedulingLater',
    defaultMessage: 'Later'
  },
  schedulingLaterDisabled: {
    id: 'publishForm.schedulingLaterDisabled',
    defaultMessage: 'Later (disabled on first publish)'
  },
  publishingTarget: {
    id: 'common.publishingTarget',
    defaultMessage: 'Publishing Target'
  },
  publishingTargetLoading: {
    id: 'publishForm.publishingTargetLoading',
    defaultMessage: 'Loading...'
  },
  publishingTargetError: {
    id: 'publishForm.publishingTargetError',
    defaultMessage: 'Publishing targets load failed.'
  },
  publishingTargetRetry: {
    id: 'publishForm.publishingTargetRetry',
    defaultMessage: 'retry'
  },
  publishingTargetSuccess: {
    id: 'publishForm.publishingTargetSuccess',
    defaultMessage: 'Success'
  },
  submissionComment: {
    id: 'publishForm.submissionComment',
    defaultMessage: 'Submission Comment'
  },
  live: {
    id: 'words.live',
    defaultMessage: 'Live'
  },
  staging: {
    id: 'words.staging',
    defaultMessage: 'Staging'
  }
});

// More button: dependencies, diff

function renderTreeNode(itemMap: LookupTable<DetailedItem>, node: PathTreeNode) {
  return (
    <TreeItem
      key={node.path}
      itemId={node.path}
      label={
        itemMap[node.path] ? (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              '.tree-item-more-section': { display: 'none' },
              '&:hover': { '.tree-item-more-section': { display: 'flex' } }
            }}
          >
            <div>
              <ItemDisplay item={itemMap[node.path]} showNavigableAsLinks={false} component="div" />
              <Typography variant="body2" color="text.secondary" children={node.path} />
            </div>
            <div className="tree-item-more-section">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertRounded />
              </IconButton>
            </div>
          </Box>
        ) : (
          node.label
        )
      }
      children={node.children?.length === 0 ? undefined : node.children.map((child) => renderTreeNode(itemMap, child))}
    />
  );
}

export function PublishDialogContainer(props: PublishDialogContainerProps) {
  const { items, scheduling = 'now', onSuccess, onClose, isSubmitting } = props;
  const [detailedItems, setDetailedItems] = useState<DetailedItem[]>();
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [state, setState] = useSpreadState<InternalDialogState>({
    emailOnApprove: false,
    requestApproval: false,
    publishingTarget: '',
    submissionComment: '',
    scheduling,
    scheduledDateTime: createAtLeastHalfHourInFutureDate(),
    publishingChannel: null,
    error: null,
    fetchingDependencies: false
  });
  const [published, setPublished] = useState<boolean>(null);
  const [publishingTargets, setPublishingTargets] = useState<PublishingTarget[]>(null);
  const [publishingTargetsStatus, setPublishingTargetsStatus] = useState('Loading');
  const [selectedItems, setSelectedItems] = useState<LookupTable<boolean>>({});
  const [dependencies, setDependencies] = useState<FetchDependenciesResponse>(null);
  const effectRefs = useUpdateRefs({ items, state });

  const itemsDataSummary = useMemo(() => {
    let allItemsInSubmittedState = true;
    let allItemsHavePublishPermission = true;
    const itemPaths = [];
    const itemMap: Record<string, DetailedItem> = {};
    const incompleteDetailedItemPaths = [];
    items.forEach((item) => {
      itemMap[item.path] = item;
      itemPaths.push(item.path);
      allItemsHavePublishPermission = allItemsHavePublishPermission && item.availableActionsMap.publish;
      allItemsInSubmittedState = allItemsInSubmittedState && item.stateMap.submitted;
      if (item.live == null || item.staging == null) {
        incompleteDetailedItemPaths.push(item.path);
      }
    });
    const [trees, treePaths] = buildPathTrees(itemPaths);
    return {
      trees,
      treePaths,
      itemMap,
      itemPaths,
      allItemsInSubmittedState,
      allItemsHavePublishPermission,
      incompleteDetailedItemPaths
    };
  }, [items]);

  const siteId = useActiveSiteId();
  const hasPublishPermission = itemsDataSummary.allItemsHavePublishPermission;
  const dispatch = useDispatch();
  const submissionCommentRequired = useSelection((state) => state.uiConfig.publishing.publishCommentRequired);
  const isApprove = hasPublishPermission && itemsDataSummary.allItemsInSubmittedState;
  const submitServiceFn =
    !hasPublishPermission || state.requestApproval ? requestPublish : isApprove ? approve : publish;
  const { mixedPublishingTargets, mixedPublishingDates, dateScheduled, publishingTarget } = useMemo(() => {
    const state = {
      mixedPublishingTargets: false,
      mixedPublishingDates: false,
      dateScheduled: null,
      publishingTarget: null
    };

    if (detailedItems) {
      const itemsChecked = detailedItems.flatMap((item) => (selectedItems[item.path] ? [item] : []));

      if (itemsChecked.length === 0) {
        state.publishingTarget = '';
        return state;
      }

      // region Discover mixed targets and/or schedules and sets the publishingTarget based off the items
      let target: string;
      let schedule: string;
      itemsChecked.some((item, index) => {
        const computedTarget = getComputedPublishingTarget(itemsChecked[0]);
        const computedSchedule = getDateScheduled(itemsChecked[0]);
        if (index === 0) {
          target = computedTarget;
          schedule = computedSchedule;
        } else {
          if (target !== computedTarget) {
            // If the computed target is different, we have mixed targets.
            // Could be any combination of live vs staging vs null that triggers mixed targets.
            state.mixedPublishingTargets = true;
          }
          if (schedule !== computedSchedule) {
            // If the current item's computed scheduled date is different, we have mixed dates.
            // Could be any combination of live vs staging vs null that triggers mixed targets.
            state.mixedPublishingDates = true;
          }
        }
        if (state.publishingTarget === null && computedTarget !== null) {
          state.publishingTarget = computedTarget;
        }
        // First found dateScheduled cached for later
        if (state.dateScheduled === null && computedSchedule !== null) {
          state.dateScheduled = computedSchedule;
        }
        // Once these things are found to be true, no need to iterate further.
        return state.mixedPublishingTargets && state.mixedPublishingDates && state.dateScheduled !== null;
      });
      // endregion

      // If there aren't any available target (or they haven't loaded), dialog should not have a selected target.
      if (publishingTargets?.length) {
        // If there are mixed targets, we want manual user selection of a target.
        // Otherwise, use what was previously found as the target on the selected items.
        if (state.mixedPublishingTargets) {
          state.publishingTarget = '';
        } else {
          // If we haven't found a target by this point, we wish to default the dialog to
          // staging (as long as that target is enabled in the system, which is checked next).
          if (state.publishingTarget === null) {
            state.publishingTarget = 'staging';
          }
          state.publishingTarget = publishingTargets.some((target) => target.name === state.publishingTarget)
            ? state.publishingTarget
            : publishingTargets[0].name;
        }
      } else {
        state.publishingTarget = '';
      }
    }

    return state;
  }, [selectedItems, publishingTargets, detailedItems]);

  const getPublishingChannels = useCallback(
    (
      success?: (channels: FetchPublishingTargetsResponse['publishingTargets']) => void,
      error?: (error: unknown) => void
    ) => {
      setPublishingTargetsStatus('Loading');
      fetchPublishingTargets(siteId).subscribe({
        next({ publishingTargets: targets, published }) {
          setPublished(published);
          setPublishingTargets(targets);
          setPublishingTargetsStatus('Success');
          success?.(targets);
        },
        error(e) {
          setPublishingTargetsStatus('Error');
          error?.(e);
        }
      });
    },
    [siteId]
  );

  // TODO: This could be optimised to run the least expensive checks first.
  // Submit button should be disabled when:
  const submitDisabled =
    // Detailed items haven't loaded
    isFetchingItems ||
    !detailedItems ||
    // While submitting
    isSubmitting ||
    // When there are no available/loaded publishing targets
    !publishingTargets?.length ||
    // When no publishing target is selected
    !state.publishingTarget ||
    // If submission comment is required (per config) and blank
    (submissionCommentRequired && isBlank(state.submissionComment)) ||
    // When there's an error
    Boolean(state.error) ||
    // The scheduled date is in the past
    state.scheduledDateTime < new Date() ||
    // When no items are selected
    !Object.values(selectedItems).filter(Boolean).length;

  useEffect(() => {
    getPublishingChannels(() => {
      setSelectedItems(createPresenceTable(items, true, (item) => item.path));
    });
  }, [getPublishingChannels, items]);

  useEffect(() => {
    scheduling !== effectRefs.current.state.scheduling && setState({ scheduling });
  }, [effectRefs, scheduling, setState]);

  useEffect(() => {
    const partialState: Partial<InternalDialogState> = {
      publishingTarget,
      scheduling: dateScheduled || scheduling !== 'now' ? 'custom' : 'now'
    };
    if (dateScheduled) {
      partialState.scheduledDateTime = dateScheduled;
    }
    setState(partialState);
  }, [dateScheduled, publishingTarget, setState, scheduling]);

  useEffect(() => {
    // If `incompleteDetailedItemPaths` is empty, we have all the detailed items we need.
    if (itemsDataSummary.incompleteDetailedItemPaths.length === 0) {
      setDetailedItems(effectRefs.current.items);
    } else {
      setIsFetchingItems(true);
      const subscription = fetchDetailedItems(siteId, itemsDataSummary.incompleteDetailedItemPaths).subscribe({
        next(detailedItemsList) {
          setDetailedItems(detailedItemsList);
          dispatch(fetchDetailedItemsComplete({ items: detailedItemsList }));
          setIsFetchingItems(false);
        },
        error(error) {
          setState({ error: error.response?.response ?? error });
          setIsFetchingItems(false);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [effectRefs, itemsDataSummary, siteId, setState, dispatch]);

  const handleSubmit = () => {
    const {
      publishingTarget,
      scheduling: schedule,
      emailOnApprove: sendEmail,
      submissionComment,
      scheduledDateTime: scheduledDate
    } = state;

    const items = Object.entries(selectedItems)
      .filter(([, isChecked]) => isChecked)
      .map(([path]) => path);

    const data = {
      publishingTarget,
      items,
      sendEmailNotifications: sendEmail,
      comment: submissionComment,
      ...(schedule === 'custom' ? { schedule: scheduledDate } : {})
    };

    dispatch(updatePublishDialog({ isSubmitting: true }));

    submitServiceFn(siteId, data).subscribe(
      () => {
        dispatch(updatePublishDialog({ isSubmitting: false, hasPendingChanges: false }));
        onSuccess?.({
          schedule: schedule,
          publishingTarget,
          // @ts-expect-error: TODO: Not quite sure if users of this dialog are making use of the `environment` prop name. Should use `publishingTarget` instead.
          environment: publishingTarget,
          type: !hasPublishPermission || state.requestApproval ? 'submit' : 'publish',
          items: items.map((path) => props.items.find((item) => item.path === path))
        });
      },
      ({ response }) => {
        dispatch(
          batchActions([updatePublishDialog({ isSubmitting: false }), showErrorDialog({ error: response.response })])
        );
      }
    );
  };

  const onItemClicked = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedItems({ ...selectedItems, [path]: !selectedItems[path] });
  };

  const onSelectAll = () => {
    setSelectedItems(
      items.reduce(
        (checked, item) => {
          checked[item.path] = true;
          return checked;
        },
        { ...selectedItems }
      )
    );
  };

  function onSelectAllSoft() {
    // If one that is not checked is found, check all. Otherwise, uncheck all.
    const check = Boolean(dependencies.softDependencies.find((path) => !selectedItems[path]));
    setSelectedItems(
      dependencies.softDependencies.reduce(
        (nextCheckedSoftDependencies, path) => {
          nextCheckedSoftDependencies[path] = check;
          return nextCheckedSoftDependencies;
        },
        { ...selectedItems }
      )
    );
  }

  function onFetchDependenciesClick() {
    setState({ fetchingDependencies: true });
    fetchDependencies(siteId, paths(selectedItems)).subscribe(
      (items) => {
        setState({ fetchingDependencies: false });
        setDependencies(items);
      },
      () => {
        setState({ fetchingDependencies: false });
        setDependencies(null);
      }
    );
  }

  const onPublishingArgumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: unknown;
    switch (e.target.type) {
      case 'checkbox':
        value = e.target.checked;
        break;
      case 'textarea':
        value = e.target.value;
        dispatch(updatePublishDialog({ hasPendingChanges: true }));
        break;
      case 'radio':
        value = e.target.value;
        break;
      case 'dateTimePicker': {
        value = e.target.value;
        break;
      }
      default:
        console.error('Publishing argument change event ignored.');
        return;
    }
    setState({ [e.target.name]: value });
  };

  const onCloseButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onClose(e, null);

  const { formatMessage } = useIntl();
  const { classes } = useStyles();
  const isRequestPublish = !hasPublishPermission || state.requestApproval;
  const showRequestApproval = hasPublishPermission && !itemsDataSummary.allItemsInSubmittedState;
  const submitLabel =
    state.scheduling === 'custom' ? (
      <FormattedMessage id="words.schedule" defaultMessage="Schedule" />
    ) : !hasPublishPermission || state.requestApproval ? (
      <FormattedMessage id="publishDialog.requestPublish" defaultMessage="Request Publish" />
    ) : (
      <FormattedMessage id="words.publish" defaultMessage="Publish" />
    );
  const disabled = isSubmitting;
  const handleDateTimePickerChange: DateTimeTimezonePickerProps['onChange'] = (date) => {
    onPublishingArgumentChange({
      target: {
        name: 'scheduledDateTime',
        type: 'dateTimePicker',
        // @ts-expect-error: We're formating this as a change event so ignoring "Type 'Date' is not assignable to type 'string'".
        value: date
      }
    });
  };

  const [expandedPaths, setExpandedPaths] = useState<string[]>();

  return (
    <>
      <DialogBody sx={{ px: 4 }}>
        {state.error ? (
          <ApiResponseErrorState error={state.error} />
        ) : isFetchingItems ? (
          <LoadingState />
        ) : detailedItems && publishingTargets ? (
          detailedItems.length ? (
            <>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <form className={classes.root}>
                    <TextField
                      fullWidth
                      sx={{ mb: 1 }}
                      label={<FormattedMessage defaultMessage="Package Title" />}
                      helperText={
                        <FormattedMessage defaultMessage="Dashboard and other places will use this title to display this package." />
                      }
                    />
                    <TextFieldWithMax
                      id="publishDialogFormSubmissionComment"
                      name="submissionComment"
                      label={
                        <FormattedMessage id="publishForm.submissionComment" defaultMessage="Submission Comment" />
                      }
                      fullWidth
                      onChange={onPublishingArgumentChange}
                      value={state.submissionComment}
                      multiline
                      disabled={disabled}
                      required={submissionCommentRequired}
                    />
                    <Box sx={{ mb: 1.25 }}>
                      {showRequestApproval && (
                        <FormControlLabel
                          sx={{ display: 'block' }}
                          control={
                            <Checkbox
                              size="small"
                              checked={state.requestApproval}
                              onChange={onPublishingArgumentChange}
                              disabled={disabled}
                              name="requestApproval"
                            />
                          }
                          label={
                            <FormattedMessage id="publishForm.requestApproval" defaultMessage="Request approval" />
                          }
                        />
                      )}
                      {isRequestPublish && (
                        <Alert severity="info">
                          <Typography>
                            <FormattedMessage
                              id="publishDialog.requestPublishHint"
                              defaultMessage="Items will be submitted for review and published upon approval"
                            />
                          </Typography>
                        </Alert>
                      )}
                      {isRequestPublish && (
                        <FormControlLabel
                          sx={{ display: 'block' }}
                          label={formatMessage(messages.emailLabel)}
                          control={
                            <Checkbox
                              size="small"
                              checked={state.emailOnApprove}
                              onChange={onPublishingArgumentChange}
                              value="emailOnApprove"
                              color="primary"
                              disabled={disabled}
                              name="emailOnApprove"
                            />
                          }
                        />
                      )}
                    </Box>
                    <FormControl fullWidth className={classes.formSection}>
                      <FormLabel component="legend">{formatMessage(messages.scheduling)}</FormLabel>
                      <RadioGroup
                        className={classes.radioGroup}
                        value={state.scheduling}
                        onChange={onPublishingArgumentChange}
                        name="scheduling"
                      >
                        {mixedPublishingDates && (
                          <Alert severity="warning" className={classes.mixedDatesWarningMessage}>
                            <FormattedMessage
                              id="publishForm.mixedPublishingDates"
                              defaultMessage="Items have mixed publishing date/time schedules."
                            />
                          </Alert>
                        )}
                        <FormControlLabel
                          value="now"
                          control={<Radio color="primary" className={classes.radioInput} />}
                          label={formatMessage(messages.schedulingNow)}
                          classes={{ label: classes.formInputs }}
                          disabled={disabled}
                        />
                        <FormControlLabel
                          value="custom"
                          control={<Radio color="primary" className={classes.radioInput} />}
                          label={
                            published
                              ? formatMessage(messages.schedulingLater)
                              : formatMessage(messages.schedulingLaterDisabled)
                          }
                          classes={{ label: classes.formInputs }}
                          disabled={!published || disabled}
                        />
                      </RadioGroup>
                      <Collapse
                        mountOnEnter
                        in={state.scheduling === 'custom'}
                        timeout={300}
                        className={state.scheduling === 'custom' ? classes.datePicker : ''}
                      >
                        <DateTimeTimezonePicker
                          onChange={handleDateTimePickerChange}
                          value={state.scheduledDateTime}
                          disablePast
                          disabled={disabled}
                        />
                      </Collapse>
                    </FormControl>
                    <FormControl fullWidth className={classes.formSection}>
                      <FormLabel component="legend">{formatMessage(messages.publishingTarget)}</FormLabel>
                      {publishingTargets ? (
                        publishingTargets.length ? (
                          <RadioGroup
                            className={classes.radioGroup}
                            value={state.publishingTarget}
                            onChange={onPublishingArgumentChange}
                            name="publishingTarget"
                          >
                            {publishingTargets.map((publishingChannel) => (
                              <FormControlLabel
                                key={publishingChannel.name}
                                disabled={disabled}
                                value={publishingChannel.name}
                                control={<Radio color="primary" className={classes.radioInput} />}
                                label={
                                  messages[publishingChannel.name]
                                    ? formatMessage(messages[publishingChannel.name])
                                    : capitalize(publishingChannel.name)
                                }
                                classes={{ label: classes.formInputs }}
                              />
                            ))}
                          </RadioGroup>
                        ) : (
                          <div className={classes.publishingTargetLoaderContainer}>
                            <Typography variant="body1" className={classes.publishingTargetEmpty}>
                              No publishing channels are available.
                            </Typography>
                          </div>
                        )
                      ) : (
                        <div className={classes.publishingTargetLoaderContainer}>
                          <Typography
                            variant="body1"
                            component="span"
                            className={`${classes.publishingTargetLoader} ${classes.formInputs}`}
                            color={publishingTargetsStatus === 'Error' ? 'error' : 'initial'}
                          >
                            {formatMessage(messages[`publishingTarget${publishingTargetsStatus}`])}
                            {publishingTargetsStatus === 'Error' && (
                              <Link href="#" onClick={() => getPublishingChannels()}>
                                ({formatMessage(messages.publishingTargetRetry)})
                              </Link>
                            )}
                          </Typography>
                        </div>
                      )}
                      {mixedPublishingTargets && (
                        <Alert severity="warning" className={classes.mixedTargetsWarningMessage}>
                          <FormattedMessage
                            id="publishForm.mixedPublishingTargets"
                            defaultMessage="Items have mixed publishing targets."
                          />
                        </Alert>
                      )}
                    </FormControl>
                  </form>
                </Grid>
                <Grid size={{ xs: 12, sm: 7 }}>
                  {published ? (
                    <>
                      {/* <DependencySelection
                        items={detailedItems}
                        selectedItems={selectedItems}
                        onItemClicked={onItemClicked}
                        dependencies={dependencies}
                        onSelectAllClicked={onSelectAll}
                        onSelectAllSoftClicked={onSelectAllSoft}
                        disabled={isSubmitting}
                      /> */}
                      <Paper
                        elevation={1}
                        sx={
                          {
                            // borderColor: 'divider',
                            // borderWidth: 1,
                            // borderStyle: 'solid',
                            // bgcolor: 'background.paper',
                            // borderRadius: 1
                          }
                        }
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mr={1} ml={1}>
                          <Box display="flex" py={0.5}>
                            <IconButton size="small" color="primary">
                              <UnfoldMoreRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="primary">
                              <UnfoldLessRoundedIcon fontSize="small" />
                            </IconButton>
                            <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
                            <Button
                              size="small"
                              startIcon={<ListRoundedIcon />}
                              sx={{ [`.${buttonClasses.startIcon}`]: { mr: 0.5 } }}
                            >
                              <FormattedMessage defaultMessage="List View" />
                            </Button>
                          </Box>
                          <Button size="small">
                            <FormattedMessage defaultMessage="Exclude optional references" />
                          </Button>
                        </Box>
                        <Divider />
                        <Box sx={{ p: 1 }}>
                          <SimpleTreeView
                            expandedItems={expandedPaths ?? itemsDataSummary.treePaths}
                            onExpandedItemsChange={(event, itemIds) => {
                              setExpandedPaths(itemIds);
                            }}
                            disableSelection
                            disabledItemsFocusable
                          >
                            {itemsDataSummary.trees.map((node) => renderTreeNode(itemsDataSummary.itemMap, node))}
                          </SimpleTreeView>
                        </Box>
                      </Paper>
                    </>
                  ) : (
                    <Alert severity="warning">
                      <FormattedMessage
                        id="publishDialog.firstPublish"
                        defaultMessage="The entire project will be published since this is the first publish request"
                      />
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </>
          ) : (
            <EmptyState
              title={
                <FormattedMessage id="publishDialog.noItemsSelected" defaultMessage="No items have been selected" />
              }
            />
          )
        ) : (
          <Typography>
            <FormattedMessage defaultMessage="Nothing to display." />
          </Typography>
        )}
      </DialogBody>
      <DialogFooter>
        <SecondaryButton onClick={onCloseButtonClick} disabled={isSubmitting}>
          <FormattedMessage id="requestPublishDialog.cancel" defaultMessage="Cancel" />
        </SecondaryButton>
        <PrimaryButton onClick={handleSubmit} disabled={submitDisabled} loading={isSubmitting}>
          {submitLabel}
        </PrimaryButton>
      </DialogFooter>
    </>
  );
}

export default PublishDialogContainer;
