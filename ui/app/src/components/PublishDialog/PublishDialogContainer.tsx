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
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PublishingTarget, PublishParams } from '../../models/Publishing';
import LookupTable from '../../models/LookupTable';
import { InternalDialogState, PublishDialogContainerProps } from './utils';
import { useActiveSiteId } from '../../hooks/useActiveSiteId';
import { useDispatch } from 'react-redux';
import {
  calculatePackage,
  fetchPublishingTargets,
  FetchPublishingTargetsResponse,
  publish
} from '../../services/publishing';
import { getComputedPublishingTarget, getDateScheduled } from '../../utils/content';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { capitalize, isBlank } from '../../utils/string';
import { updatePublishDialog } from '../../state/actions/dialogs';
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
import { Fade, Typography } from '@mui/material';
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
import Chip from '@mui/material/Chip';
import { map, switchMap } from 'rxjs/operators';
import { createLookupTable } from '../../utils/object';
import { HelpOutlineOutlined } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import PublishPackageItemsView from './PublishPackageItemsView';
import PublishReferencesLegend from './PublishReferencesLegend';
import { of } from 'rxjs';

const messages = defineMessages({
  publishingTargetLoading: {
    id: 'publishForm.publishingTargetLoading',
    defaultMessage: 'Loading...'
  },
  publishingTargetError: {
    id: 'publishForm.publishingTargetError',
    defaultMessage: 'Publishing targets load failed.'
  },
  publishingTargetSuccess: {
    id: 'publishForm.publishingTargetSuccess',
    defaultMessage: 'Success'
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

export type DependencyType = 'soft' | 'hard';
export type DependencyMap = Record<string, DependencyType>;
export type DependencyDataState = {
  paths: string[];
  typeByPath: DependencyMap;
  itemsByPath: LookupTable<DetailedItem>;
  items: DetailedItem[];
};

export function DependencyChip({ type }: { type: DependencyType }) {
  if (!type) return null;
  const isSoft = type === 'soft';
  return (
    <Chip
      size="small"
      variant="outlined"
      color={isSoft ? 'info' : 'warning'}
      label={isSoft ? <FormattedMessage defaultMessage="Optional" /> : <FormattedMessage defaultMessage="Required" />}
    />
  );
}

export function PublishDialogContainer(props: PublishDialogContainerProps) {
  const { items: initialItems, scheduling = 'now', onSuccess, onClose, isSubmitting } = props;
  const siteId = useActiveSiteId();
  const dispatch = useDispatch();
  const [detailedItems, setDetailedItems] = useState<DetailedItem[]>();
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [state, setState] = useSpreadState<InternalDialogState>({
    packageTitle: '',
    requestApproval: false,
    publishingTarget: null,
    submissionComment: '',
    scheduling,
    scheduledDateTime: createAtLeastHalfHourInFutureDate(),
    error: null,
    fetchingDependencies: false
  });
  const [mainItems, setMainItems] = useState<DetailedItem[]>(initialItems);
  const [published, setPublished] = useState<boolean>(null);
  const [publishingTargets, setPublishingTargets] = useState<PublishingTarget[]>(null);
  const [publishingTargetsStatus, setPublishingTargetsStatus] = useState('Loading');
  const [dependencyData, setDependencyData] = useState<DependencyDataState>(null);
  const [selectedDependenciesMap, setSelectedDependenciesMap] = useState<LookupTable<boolean>>({});
  const selectedDependenciesPaths = Object.keys(selectedDependenciesMap).filter(
    (path) => selectedDependenciesMap[path]
  );
  const effectRefs = useUpdateRefs({ initialItems, state });
  const itemsDataSummary = useMemo(() => {
    let allItemsInSubmittedState = true;
    let allItemsHavePublishPermission = true;
    const itemPaths = [];
    const itemMap: Record<string, DetailedItem> = {};
    const incompleteDetailedItemPaths = [];
    mainItems.forEach((item) => {
      itemMap[item.path] = item;
      itemPaths.push(item.path);
      allItemsHavePublishPermission = allItemsHavePublishPermission && item.availableActionsMap.publish;
      allItemsInSubmittedState = allItemsInSubmittedState && item.stateMap.submitted;
      if (item.live == null || item.staging == null) {
        incompleteDetailedItemPaths.push(item.path);
      }
    });
    return {
      itemMap,
      itemPaths,
      allItemsInSubmittedState,
      allItemsHavePublishPermission,
      incompleteDetailedItemPaths
    };
  }, [mainItems]);
  const dependencyPaths = dependencyData?.paths;
  const [trees, parentTreeNodePaths, itemsAndDependenciesPaths] = useMemo(() => {
    const treeItemPaths = itemsDataSummary.itemPaths.concat(dependencyPaths ?? []);
    const treeBuilderResult = buildPathTrees(treeItemPaths);
    return [...treeBuilderResult, treeItemPaths] as [PathTreeNode[], string[], string[]];
  }, [dependencyPaths, itemsDataSummary.itemPaths]);
  const dependencyItemMap = dependencyData?.itemsByPath;
  const itemsAndDependenciesMap = useMemo(
    () => ({ ...itemsDataSummary.itemMap, ...dependencyItemMap }),
    [itemsDataSummary.itemMap, dependencyItemMap]
  );
  const hasPublishPermission = itemsDataSummary.allItemsHavePublishPermission;
  const { mixedPublishingTargets, mixedPublishingDates, dateScheduled, publishingTarget } = useMemo(() => {
    const state = {
      mixedPublishingTargets: false,
      mixedPublishingDates: false,
      dateScheduled: null,
      publishingTarget: '' as InternalDialogState['publishingTarget']
    };

    if (mainItems) {
      const itemsIncludedForPublish = mainItems;
      if (itemsIncludedForPublish.length === 0) {
        return state;
      }

      // region Discover mixed targets and/or schedules and sets the publishingTarget based off the items
      let target: string;
      let schedule: string;
      itemsIncludedForPublish.some((item, index) => {
        const computedTarget = getComputedPublishingTarget(itemsIncludedForPublish[0]);
        const computedSchedule = getDateScheduled(itemsIncludedForPublish[0]); // TODO: Uses .live/.staging
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
        if (state.publishingTarget === '' && computedTarget !== null) {
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
        if (!state.mixedPublishingTargets && state.publishingTarget === '') {
          // If we haven't found a target by this point, we wish to default the dialog to
          // staging (as long as that target is enabled in the system, which is checked next).
          state.publishingTarget =
            publishingTargets.find((target) => target.name === 'staging')?.name ?? publishingTargets[0].name;
        }
      } else {
        state.publishingTarget = '';
      }
    }

    return state;
  }, [publishingTargets, mainItems]);
  const fetchPublishingTargetsFn = useCallback(
    (
      success?: (channels: FetchPublishingTargetsResponse['publishingTargets']) => void,
      error?: (error: unknown) => void
    ) => {
      setPublishingTargetsStatus('Loading');
      return fetchPublishingTargets(siteId).subscribe({
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
  const { formatMessage } = useIntl();
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

  // Submit button should be disabled when:
  const submitDisabled =
    // Detailed items haven't loaded
    isFetchingItems ||
    !detailedItems ||
    // While submitting
    isSubmitting ||
    // If package title is blank
    isBlank(state.packageTitle) ||
    // If package comment is blank
    isBlank(state.submissionComment) ||
    // When there are no available/loaded publishing targets
    !publishingTargets?.length ||
    // When there are selected dependencies not applied.
    Boolean(selectedDependenciesPaths?.length) ||
    // When no publishing target is selected
    !state.publishingTarget ||
    // When there's an error
    Boolean(state.error) ||
    // The scheduled date is in the past
    state.scheduledDateTime < new Date();

  useEffect(() => {
    setState({ fetchingDependencies: true });
    // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO: This is not scalable (bulk fetch of countless DetailedItems). We must review and discuss how to adjust.
    // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (state.publishingTarget) {
      calculatePackage(siteId, {
        publishingTarget: state.publishingTarget,
        paths: itemsDataSummary.itemPaths.map((path) => ({ path, includeChildren: false, includeSoftDeps: false })),
        commitIds: [] // TODO: there's a bug where the API fails if commitsIds is not provided. Needs to be fixed.
      })
        .pipe(
          switchMap((dependenciesByType) => {
            const dependencies = [...dependenciesByType.hardDependencies, ...dependenciesByType.softDependencies];
            if (dependencies.length) {
              return fetchDetailedItems(siteId, dependencies).pipe(
                map((detailedItemsList) => {
                  return { dependenciesByType, detailedItemsList };
                })
              );
            } else {
              return of({ dependenciesByType, detailedItemsList: [] });
            }
          })
        )
        .subscribe({
          next({ dependenciesByType, detailedItemsList }) {
            const depMap: DependencyMap = {};
            const depLookup: LookupTable<DetailedItem> = createLookupTable(detailedItemsList, 'path');
            dependenciesByType.hardDependencies.forEach((path) => {
              depMap[path] = 'hard';
            });
            dependenciesByType.softDependencies.forEach((path) => {
              depMap[path] = 'soft';
            });
            setState({ fetchingDependencies: false });
            setDependencyData({
              typeByPath: depMap,
              paths: Object.keys(depMap),
              itemsByPath: depLookup,
              items: detailedItemsList
            });
          },
          error() {
            setState({ fetchingDependencies: false });
            setDependencyData(null);
          }
        });
    }
  }, [itemsDataSummary.itemPaths, setState, siteId, setSelectedDependenciesMap, state.publishingTarget]);

  useEffect(() => {
    const subscription = fetchPublishingTargetsFn();
    return () => subscription.unsubscribe();
  }, [fetchPublishingTargetsFn, initialItems]);

  useEffect(() => {
    scheduling !== effectRefs.current.state.scheduling && setState({ scheduling });
  }, [effectRefs, scheduling, setState]);

  useEffect(() => {
    const partialState: Partial<InternalDialogState> = {
      publishingTarget: publishingTarget || effectRefs.current.state.publishingTarget,
      scheduling: dateScheduled || scheduling !== 'now' ? 'custom' : 'now'
    };
    if (dateScheduled) {
      partialState.scheduledDateTime = dateScheduled;
    }
    setState(partialState);
  }, [dateScheduled, publishingTarget, setState, scheduling, effectRefs]);

  useEffect(() => {
    // If `incompleteDetailedItemPaths` is empty, we have all the detailed items we need.
    if (itemsDataSummary.incompleteDetailedItemPaths.length === 0) {
      setDetailedItems(effectRefs.current.initialItems);
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

  const handleSubmit = (e?: SyntheticEvent) => {
    e?.preventDefault();

    const { publishingTarget, scheduling: schedule } = state;
    const { itemPaths, itemMap } = itemsDataSummary;
    const { requestApproval, packageTitle, submissionComment, scheduling, scheduledDateTime } = state;
    const data: PublishParams = {
      publishingTarget: state.publishingTarget,
      paths: itemPaths.map((path: string) => ({
        path,
        includeChildren: false,
        includeSoftDeps: false
      })),
      schedule: scheduling === 'custom' ? scheduledDateTime.toISOString() : null,
      requestApproval,
      title: packageTitle,
      comment: submissionComment
    };

    dispatch(updatePublishDialog({ isSubmitting: true }));

    publish(siteId, data).subscribe({
      next() {
        dispatch(updatePublishDialog({ isSubmitting: false, hasPendingChanges: false }));
        onSuccess?.({
          schedule: schedule,
          publishingTarget,
          // @ts-expect-error: TODO: Not quite sure if users of this dialog are making use of the `environment` prop name. Should remove (keep publishingTarget only).
          environment: publishingTarget,
          type: !hasPublishPermission || state.requestApproval ? 'submit' : 'publish',
          items: itemPaths.map((path) => itemMap[path])
        });
      },
      error({ response }) {
        dispatch(
          batchActions([updatePublishDialog({ isSubmitting: false }), showErrorDialog({ error: response.response })])
        );
      }
    });
  };

  const onPublishingArgumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: unknown;
    dispatch(updatePublishDialog({ hasPendingChanges: true }));
    switch (e.target.type) {
      case 'checkbox':
        value = e.target.checked;
        break;
      case 'text':
      case 'textarea':
      case 'radio':
      case 'dateTimePicker':
        value = e.target.value;
        break;
      default:
        console.error('Publishing argument change event ignored.');
        return;
    }
    setState({ [e.target.name]: value });
  };

  const onCloseButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onClose(e, null);

  const onDependencyCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => {
    setSelectedDependenciesMap({ ...selectedDependenciesMap, [path]: checked });
  };

  const onApplyDependenciesChanges = () => {
    // Update the list of mainItems for the dependencies to be re-calculated. Also clear the current set of selected
    // dependencies.
    setMainItems([...mainItems, ...selectedDependenciesPaths.map((path) => dependencyData.itemsByPath[path])]);
    setSelectedDependenciesMap({});
  };

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

  return (
    <>
      <DialogBody sx={{ px: 4, minHeight: 'calc(100vh * 0.5)' }}>
        {state.error ? (
          <ApiResponseErrorState error={state.error} />
        ) : isFetchingItems ? (
          <LoadingState sx={{ flexGrow: 1 }} />
        ) : detailedItems && publishingTargets ? (
          detailedItems.length ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Box component="form" sx={{ width: 'auto' }} onSubmit={handleSubmit}>
                  <TextField
                    autoFocus
                    fullWidth
                    sx={{ mb: 1 }}
                    name="packageTitle"
                    value={state.packageTitle}
                    onChange={onPublishingArgumentChange}
                    label={<FormattedMessage defaultMessage="Package Title" />}
                    helperText={
                      <FormattedMessage defaultMessage="Dashboard and other places will use this title to display this package." />
                    }
                    required
                  />
                  <TextFieldWithMax
                    id="publishDialogFormSubmissionComment"
                    name="submissionComment"
                    label={<FormattedMessage id="publishForm.submissionComment" defaultMessage="Submission Comment" />}
                    fullWidth
                    onChange={onPublishingArgumentChange}
                    value={state.submissionComment}
                    multiline
                    disabled={disabled}
                    required={true}
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
                          <Box display="inline-flex" alignItems="center">
                            <FormattedMessage id="publishForm.requestApproval" defaultMessage="Request approval" />
                            <Tooltip
                              title={
                                <FormattedMessage
                                  id="publishDialog.requestPublishHint"
                                  defaultMessage="Items will be submitted for review and published upon approval"
                                />
                              }
                            >
                              <IconButton
                                aria-label="help"
                                size="small"
                                sx={{ ml: 1 }}
                                color={isRequestPublish ? 'warning' : undefined}
                              >
                                {isRequestPublish ? (
                                  <ErrorOutlineRounded fontSize="small" />
                                ) : (
                                  <HelpOutlineOutlined fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      />
                    )}
                  </Box>
                  <FormControl fullWidth sx={{ width: '100%', marginBottom: '20px' }}>
                    <FormLabel component="legend">
                      <FormattedMessage defaultMessage="Scheduling" />
                    </FormLabel>
                    <RadioGroup
                      value={state.scheduling}
                      onChange={onPublishingArgumentChange}
                      name="scheduling"
                      sx={{ paddingTop: '10px', fontSize: '14px' }}
                    >
                      {mixedPublishingDates && (
                        <Alert severity="warning" sx={{ marginBottom: '10px' }}>
                          <FormattedMessage
                            id="publishForm.mixedPublishingDates"
                            defaultMessage="Items have mixed publishing date/time schedules."
                          />
                        </Alert>
                      )}
                      <FormControlLabel
                        value="now"
                        control={
                          <Radio color="primary" sx={{ padding: '4px', marginLeft: '5px', marginRight: '5px' }} />
                        }
                        label={<FormattedMessage defaultMessage="Now" />}
                        slotProps={{
                          typography: {
                            sx: { fontSize: '14px' }
                          }
                        }}
                        disabled={disabled}
                      />
                      <FormControlLabel
                        value="custom"
                        control={
                          <Radio color="primary" sx={{ padding: '4px', marginLeft: '5px', marginRight: '5px' }} />
                        }
                        label={
                          published ? (
                            <FormattedMessage defaultMessage="Later" />
                          ) : (
                            <FormattedMessage defaultMessage="Later (disabled on first publish)" />
                          )
                        }
                        slotProps={{
                          typography: {
                            sx: { fontSize: '14px' }
                          }
                        }}
                        disabled={!published || disabled}
                      />
                    </RadioGroup>
                    <Collapse
                      mountOnEnter
                      in={state.scheduling === 'custom'}
                      timeout={300}
                      sx={
                        state.scheduling === 'custom'
                          ? {
                              position: 'relative',
                              paddingLeft: '30px',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                width: '5px',
                                height: '100%',
                                top: '0',
                                left: '7px',
                                backgroundColor: (theme) => theme.palette.background.paper,
                                borderRadius: '5px'
                              }
                            }
                          : {}
                      }
                    >
                      <DateTimeTimezonePicker
                        onChange={handleDateTimePickerChange}
                        value={state.scheduledDateTime}
                        disablePast
                        disabled={disabled}
                      />
                    </Collapse>
                  </FormControl>
                  <FormControl fullWidth sx={{ width: '100%', marginBottom: '20px' }}>
                    <FormLabel component="legend">
                      <FormattedMessage defaultMessage="Publishing Target" />
                    </FormLabel>
                    {publishingTargets ? (
                      publishingTargets.length ? (
                        <RadioGroup
                          value={state.publishingTarget}
                          onChange={onPublishingArgumentChange}
                          name="publishingTarget"
                          sx={{ paddingTop: '10px', fontSize: '14px' }}
                        >
                          {publishingTargets.map((target) => (
                            <FormControlLabel
                              key={target.name}
                              disabled={disabled}
                              value={target.name}
                              control={
                                <Radio color="primary" sx={{ padding: '4px', marginLeft: '5px', marginRight: '5px' }} />
                              }
                              label={
                                messages[target.name] ? formatMessage(messages[target.name]) : capitalize(target.name)
                              }
                              slotProps={{
                                typography: {
                                  sx: { fontSize: '14px' }
                                }
                              }}
                            />
                          ))}
                        </RadioGroup>
                      ) : (
                        <Box sx={{ paddingTop: '24px', display: 'inline-flex' }}>
                          <Typography variant="body1" sx={{ padding: '10px 12px', borderRadius: '4px', width: '100%' }}>
                            No publishing channels are available.
                          </Typography>
                        </Box>
                      )
                    ) : (
                      <Box sx={{ paddingTop: '24px', display: 'inline-flex' }}>
                        <Typography
                          variant="body1"
                          component="span"
                          sx={{ fontSize: '14px' }}
                          color={publishingTargetsStatus === 'Error' ? 'error' : 'initial'}
                        >
                          {formatMessage(messages[`publishingTarget${publishingTargetsStatus}`])}
                          {publishingTargetsStatus === 'Error' && (
                            <Link href="#" onClick={() => fetchPublishingTargetsFn()}>
                              <FormattedMessage defaultMessage="retry" />
                            </Link>
                          )}
                        </Typography>
                      </Box>
                    )}
                    {mixedPublishingTargets && (
                      <Alert severity="warning" sx={{ marginTop: '10px' }}>
                        <FormattedMessage
                          id="publishForm.mixedPublishingTargets"
                          defaultMessage="Items have mixed publishing targets."
                        />
                      </Alert>
                    )}
                  </FormControl>
                </Box>
                <Divider />
                <PublishReferencesLegend />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                {published ? (
                  <>
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
                      <PublishPackageItemsView
                        itemMap={itemsAndDependenciesMap}
                        defaultExpandedPaths={parentTreeNodePaths}
                        itemsAndDependenciesPaths={itemsAndDependenciesPaths}
                        dependencyTypeMap={dependencyData?.typeByPath}
                        selectedDependenciesPaths={selectedDependenciesPaths}
                        selectedDependenciesMap={selectedDependenciesMap}
                        trees={trees}
                        onCheckboxChange={onDependencyCheckboxChange}
                      />
                      <Fade in={Boolean(selectedDependenciesPaths?.length)}>
                        <Alert
                          severity="info"
                          action={
                            <Button color="inherit" size="small" onClick={onApplyDependenciesChanges}>
                              <FormattedMessage defaultMessage="Apply" />
                            </Button>
                          }
                          sx={{ borderTopRightRadius: 0, borderTopLeftRadius: 0 }}
                        >
                          <FormattedMessage defaultMessage="Changes in the item selection must be applied" />
                        </Alert>
                      </Fade>
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
