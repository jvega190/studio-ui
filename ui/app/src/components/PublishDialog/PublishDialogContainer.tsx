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
import { fetchPublishingTargets, FetchPublishingTargetsResponse } from '../../services/publishing';
import { getComputedPublishingTarget, getDateScheduled } from '../../utils/content';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import useStyles from './styles';
import { useSelection } from '../../hooks/useSelection';
import { capitalize, isBlank } from '../../utils/string';
import { updatePublishDialog } from '../../state/actions/dialogs';
import { approve } from '../../services/workflow';
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
import { buttonClasses, listItemSecondaryActionClasses, Typography } from '@mui/material';
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
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import ItemDisplay from '../ItemDisplay';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem, { listItemClasses } from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { map, switchMap } from 'rxjs/operators';
import { createLookupTable } from '../../utils/object';
import TreeOutlined from '../../icons/TreeOutlined';
import { HelpOutlineOutlined } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import { getPublishDialogIsTreeView, setPublishDialogIsTreeView } from '../../utils/state';
import useActiveUser from '../../hooks/useActiveUser';
import { dependencies, publish } from '../../services/publish';
import { generateSingleItemOptions } from '../../utils/itemActions';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const messages = defineMessages({
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

type DependencyType = 'soft' | 'hard';
type DependencyMap = Record<string, DependencyType>;
type DependencyDataState = {
  paths: string[];
  typeByPath: DependencyMap;
  itemsByPath: LookupTable<DetailedItem>;
  items: DetailedItem[];
};

function DependencyChip({ type }: { type: DependencyType }) {
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

function renderTreeNode(
  itemMap: LookupTable<DetailedItem>,
  node: PathTreeNode,
  dependencyTypeMap: DependencyMap = {},
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, path: string) => void,
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => void,
  selectedDependencies: string[]
) {
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
                <ItemDisplay item={itemMap[node.path]} showNavigableAsLinks={false} sx={{ mr: 1 }} />
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
          <span title={node.path}>{node.label}</span>
        )
      }
      children={
        node.children?.length === 0
          ? undefined
          : node.children.map((child) =>
              renderTreeNode(itemMap, child, dependencyTypeMap, onMenuClick, onCheckboxChange, selectedDependencies)
            )
      }
    />
  );
}

export function PublishDialogContainer(props: PublishDialogContainerProps) {
  const { items, scheduling = 'now', onSuccess, onClose, isSubmitting } = props;
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
  const [published, setPublished] = useState<boolean>(null);
  const [publishingTargets, setPublishingTargets] = useState<PublishingTarget[]>(null);
  const [publishingTargetsStatus, setPublishingTargetsStatus] = useState('Loading');
  const { username } = useActiveUser();
  const [isTreeView, setIsTreeView] = useState(getPublishDialogIsTreeView(username) ?? true);
  const [dependencyData, setDependencyData] = useState<DependencyDataState>(null);
  const [selectedDependenciesMap, setSelectedDependenciesMap] = useSpreadState<LookupTable<boolean>>({});
  const selectedDependenciesPaths = Object.keys(selectedDependenciesMap).filter(
    (path) => selectedDependenciesMap[path]
  );
  const submissionCommentRequired = useSelection((state) => state.uiConfig.publishing.publishCommentRequired);
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
    return {
      itemMap,
      itemPaths,
      allItemsInSubmittedState,
      allItemsHavePublishPermission,
      incompleteDetailedItemPaths
    };
  }, [items]);
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
  const isApprove = hasPublishPermission && itemsDataSummary.allItemsInSubmittedState;
  // const submitServiceFn =
  //   !hasPublishPermission || state.requestApproval ? requestPublish : isApprove ? approve : publish;
  const { mixedPublishingTargets, mixedPublishingDates, dateScheduled, publishingTarget } = useMemo(() => {
    const state = {
      mixedPublishingTargets: false,
      mixedPublishingDates: false,
      dateScheduled: null,
      publishingTarget: '' as InternalDialogState['publishingTarget']
    };

    if (detailedItems) {
      // TODO: This should be based on the items that will be submitted. Main, hard and *selected* softs.
      // const itemsIncludedForPublish = detailedItems.flatMap((item) => (selectedItems[item.path] ? [item] : []));
      const itemsIncludedForPublish = detailedItems;
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
  }, [publishingTargets, detailedItems]);
  const [contextMenu, setContextMenu] = useState({
    el: null,
    options: null
  });

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

  const onSetIsTreeView = (isTreeView: boolean) => {
    setIsTreeView(isTreeView);
    setPublishDialogIsTreeView(username, isTreeView);
  };

  // Submit button should be disabled when:
  const submitDisabled =
    // Detailed items haven't loaded
    isFetchingItems ||
    !detailedItems ||
    // While submitting
    isSubmitting ||
    // If package title is blank
    isBlank(state.packageTitle) ||
    // When there are no available/loaded publishing targets
    !publishingTargets?.length ||
    // When no publishing target is selected
    !state.publishingTarget ||
    // If submission comment is required (per config) and blank
    (submissionCommentRequired && isBlank(state.submissionComment)) ||
    // When there's an error
    Boolean(state.error) ||
    // The scheduled date is in the past
    state.scheduledDateTime < new Date();

  useEffect(() => {
    setState({ fetchingDependencies: true });
    // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO: This is not scalable (bulk fetch of countless DetailedItems). We must review and discuss how to adjust.
    // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (publishingTarget) {
      dependencies(siteId, {
        publishingTarget,
        paths: itemsDataSummary.itemPaths.map((path) => ({ path, includeChildren: false, includeSoftDeps: false })),
        commitIds: [] // TODO: there's a bug where the API fails if commitsIds is not provided. Needs to be fixed.
      })
        .pipe(
          switchMap((dependenciesByType) =>
            fetchDetailedItems(siteId, [
              ...dependenciesByType.hardDependencies,
              ...dependenciesByType.softDependencies
            ]).pipe(map((detailedItemsList) => ({ dependenciesByType, detailedItemsList })))
          )
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
            const softDependenciesMap: LookupTable<boolean> = {};
            Object.entries(depMap).forEach(([path, type]) => {
              if (type === 'soft') {
                softDependenciesMap[path] = true;
              }
            });
            setSelectedDependenciesMap(softDependenciesMap);
          },
          error() {
            setState({ fetchingDependencies: false });
            setDependencyData(null);
          }
        });
    }
  }, [itemsDataSummary.itemPaths, setState, siteId, setSelectedDependenciesMap, publishingTarget]);

  useEffect(() => {
    const subscription = fetchPublishingTargetsFn();
    return () => subscription.unsubscribe();
  }, [fetchPublishingTargetsFn, items]);

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

  const handleSubmit = (e?: SyntheticEvent) => {
    e?.preventDefault();

    const { publishingTarget, scheduling: schedule } = state;
    const { itemPaths, itemMap } = itemsDataSummary;
    const { requestApproval, packageTitle, submissionComment, scheduling, scheduledDateTime } = state;
    const data: PublishParams = {
      publishingTarget: state.publishingTarget,
      paths: [...itemPaths, ...selectedDependenciesPaths].map((path: string) => ({
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
    const submitCallback = {
      next() {
        dispatch(updatePublishDialog({ isSubmitting: false, hasPendingChanges: false }));
        onSuccess?.({
          schedule: schedule,
          publishingTarget,
          // @ts-expect-error: TODO: Not quite sure if users of this dialog are making use of the `environment` prop name. Should remove (keep publishingTarget only).
          environment: publishingTarget,
          type: !hasPublishPermission || state.requestApproval ? 'submit' : 'publish',
          // TODO: Should send all items that were submitted. Check usages.
          items: itemPaths.map((path) => itemMap[path])
        });
      },
      error({ response }) {
        dispatch(
          batchActions([updatePublishDialog({ isSubmitting: false }), showErrorDialog({ error: response.response })])
        );
      }
    };

    if (isApprove) {
      // TODO: implement
    } else {
      publish(siteId, data).subscribe(submitCallback);
    }
  };

  const onPublishingArgumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: unknown;
    switch (e.target.type) {
      case 'checkbox':
        value = e.target.checked;
        break;
      case 'text':
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

  const onDependencyCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, path: string) => {
    // TODO: when updating dependencies, we should calculate the new set of dependencies.
    setSelectedDependenciesMap({ [path]: checked });
  };

  const onContextMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, path: string) => {
    const { itemMap } = itemsDataSummary;
    const { itemsByPath } = dependencyData;
    const item = itemMap[path] ?? itemsByPath[path];
    const itemMenuOptions = generateSingleItemOptions(item, formatMessage, {
      includeOnly: ['view', 'dependencies']
    });
    setContextMenu({ el: e.currentTarget, options: itemMenuOptions.flat() });
  };

  const onContextMenuClose = () => {
    setContextMenu({
      el: null,
      options: null
    });
  };

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
      <DialogBody sx={{ px: 4, minHeight: 'calc(100vh * 0.5)' }}>
        {state.error ? (
          <ApiResponseErrorState error={state.error} />
        ) : isFetchingItems ? (
          <LoadingState sx={{ flexGrow: 1 }} />
        ) : detailedItems && publishingTargets ? (
          detailedItems.length ? (
            <>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <form className={classes.root} onSubmit={handleSubmit}>
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
                            {publishingTargets.map((target) => (
                              <FormControlLabel
                                key={target.name}
                                disabled={disabled}
                                value={target.name}
                                control={<Radio color="primary" className={classes.radioInput} />}
                                label={
                                  messages[target.name] ? formatMessage(messages[target.name]) : capitalize(target.name)
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
                              <Link href="#" onClick={() => fetchPublishingTargetsFn()}>
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
                  <Divider />
                  <Box my={2}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <FormattedMessage defaultMessage="LEGEND" />
                    </Typography>
                    <Box display="flex" sx={{ display: 'flex', mb: 1, gap: 1 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        color="warning"
                        label={<FormattedMessage defaultMessage="Required" />}
                      />
                      <Typography variant="body2" color="textSecondary">
                        <FormattedMessage defaultMessage="References of mandatory submission" />
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        color="info"
                        label={<FormattedMessage defaultMessage="Optional" />}
                      />
                      <Typography variant="body2" color="textSecondary">
                        <FormattedMessage defaultMessage="References of optional submission" />
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 7 }}>
                  {published ? (
                    <>
                      <Paper
                        elevation={1}
                        sx={{
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark' ? theme.palette.background.default : 'background.paper'
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mr={1} ml={1}>
                          <Box display="flex" py={0.5}>
                            <Button
                              size="small"
                              startIcon={isTreeView ? <ListRoundedIcon /> : <TreeOutlined />}
                              sx={{ [`.${buttonClasses.startIcon}`]: { mr: 0.5 } }}
                              onClick={() => onSetIsTreeView(!isTreeView)}
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
                          <Button size="small">
                            <FormattedMessage defaultMessage="Exclude optional references" />
                          </Button>
                        </Box>
                        <Divider />
                        <Box sx={{ p: 1 }}>
                          {isTreeView ? (
                            <SimpleTreeView
                              expandedItems={expandedPaths ?? parentTreeNodePaths}
                              onExpandedItemsChange={(event, itemIds) => setExpandedPaths(itemIds)}
                              disableSelection
                              // checkboxSelection
                              // selectedItems={Object.keys(itemsDataSummary.itemMap)}
                              // multiSelect={true}
                              sx={{
                                '.tree-item-more-section': { display: 'none' },
                                [`.${treeItemClasses.content}:hover`]: {
                                  '.tree-item-more-section': { display: 'flex' }
                                },
                                [`[data-is-item="false"] > .${treeItemClasses.content} > .${treeItemClasses.checkbox}`]:
                                  {
                                    display: 'none'
                                  }
                              }}
                            >
                              {trees.map((node) =>
                                renderTreeNode(
                                  itemsAndDependenciesMap,
                                  node,
                                  dependencyData?.typeByPath,
                                  onContextMenuOpen,
                                  onDependencyCheckboxChange,
                                  selectedDependenciesPaths
                                )
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
                                      {dependencyData?.typeByPath[path] === 'soft' && (
                                        <Checkbox
                                          size="small"
                                          checked={selectedDependenciesPaths?.includes(path)}
                                          onChange={(e, checked) => onDependencyCheckboxChange(e, checked, path)}
                                        />
                                      )}
                                    </Box>
                                  }
                                >
                                  <ListItemText
                                    primary={
                                      <Box display="flex">
                                        <ItemDisplay
                                          item={itemsAndDependenciesMap[path]}
                                          showNavigableAsLinks={false}
                                          sx={{ mr: 1 }}
                                        />
                                        <DependencyChip type={dependencyData?.typeByPath[path]} />
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
      <Menu anchorEl={contextMenu.el} keepMounted open={Boolean(contextMenu.el)} onClose={onContextMenuClose}>
        {contextMenu.options?.map((option) => <MenuItem key={option.id}>{option.label}</MenuItem>)}
      </Menu>
    </>
  );
}

export default PublishDialogContainer;
