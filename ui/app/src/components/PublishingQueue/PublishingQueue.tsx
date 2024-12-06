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

import React, { useCallback, useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { defineMessages, useIntl } from 'react-intl';
import PublishingPackage from './PublishingPackage';
import { cancelPackage, fetchPackages, fetchPublishingTargets } from '../../services/publishing';
import { CurrentFilters, Package, PublishPackage, Selected } from '../../models/Publishing';
import FilterDropdown from './FilterDropdown';
import { setRequestForgeryToken } from '../../utils/auth';
import TablePagination from '@mui/material/TablePagination';
import EmptyState from '../EmptyState/EmptyState';
import Typography from '@mui/material/Typography';
import HighlightOffIcon from '@mui/icons-material/HighlightOffRounded';
import RefreshIcon from '@mui/icons-material/RefreshRounded';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import palette from '../../styles/palette';
import ApiResponseErrorState from '../ApiResponseErrorState';
import { useSpreadState } from '../../hooks/useSpreadState';
import ConfirmDropdown from '../ConfirmDropdown';
import { publishEvent, workflowEvent } from '../../state/actions/system';
import { getHostToHostBus } from '../../utils/subjects';
import { filter } from 'rxjs/operators';
import { LoadingState } from '../LoadingState';
import { nnou } from '../../utils/object';
import {
  CANCELLED_MASK,
  COMPLETED_MASK,
  LIVE_FAILED_MASK,
  LIVE_SUCCESS_MASK,
  PROCESSING_MASK,
  READY_MASK,
  STAGING_COMPLETED_WITH_ERRORS_MASK,
  STAGING_FAILED_MASK,
  STAGING_SUCCESS_MASK
} from '../../utils/constants';
import { isReady } from '../PublishPackageReviewDialog/utils';

const messages = defineMessages({
  selectAll: {
    id: 'publishingDashboard.selectAll',
    defaultMessage: 'Select all on this page'
  },
  cancelSelected: {
    id: 'publishingDashboard.cancelSelected',
    defaultMessage: 'Cancel Selected'
  },
  cancel: {
    id: 'publishingDashboard.no',
    defaultMessage: 'No'
  },
  confirm: {
    id: 'publishingDashboard.yes',
    defaultMessage: 'Yes'
  },
  confirmAllHelper: {
    id: 'publishingDashboard.confirmAllHelper',
    defaultMessage: 'Set the state for all selected items to "Cancelled"?'
  },
  filters: {
    id: 'publishingDashboard.filters',
    defaultMessage: 'Filters'
  },
  noPackagesTitle: {
    id: 'publishingDashboard.noPackagesTitle',
    defaultMessage: 'No packages were found'
  },
  noPackagesSubtitle: {
    id: 'publishingDashboard.noPackagesSubtitle',
    defaultMessage: 'Try changing your query'
  },
  filteredBy: {
    id: 'publishingDashboard.filteredBy',
    defaultMessage:
      'Showing: {state, select, all {} other {Status: {state}.}} {environment, select, all {} other {{environment} target.}} {path, select, none {} other {Filtered by {path}}}'
  },
  packagesSelected: {
    id: 'publishingDashboard.packagesSelected',
    defaultMessage: '{count, plural, one {{count} Package selected} other {{count} Packages selected}}'
  },
  previous: {
    id: 'publishingDashboard.previous',
    defaultMessage: 'Previous page'
  },
  next: {
    id: 'publishingDashboard.next',
    defaultMessage: 'Next page'
  }
});

const useStyles = makeStyles()((theme) => ({
  publishingQueue: {},
  topBar: {
    display: 'flex',
    padding: '0 0 0 0',
    alignItems: 'center',
    borderBottom: '1px solid #dedede',
    justifyContent: 'flex-end'
  },
  secondBar: {
    background: theme.palette.divider,
    padding: '10px',
    borderBottom: '1px solid #dedede'
  },
  queueList: {},
  package: {
    padding: '20px',
    '& .name': {
      display: 'flex',
      justifyContent: 'space-between'
    },
    '& .status': {
      display: 'flex',
      justifyContent: 'space-between'
    },
    '& .comment': {
      display: 'flex',
      justifyContent: 'space-between',
      '& div:first-child': {
        marginRight: '20px'
      }
    },
    '& .files': {}
  },
  packagesSelected: {
    marginRight: '10px',
    display: 'flex',
    alignItems: 'center'
  },
  clearSelected: {
    marginLeft: '5px',
    cursor: 'pointer'
  },
  selectAll: {
    marginRight: 'auto'
  },
  button: {
    margin: theme.spacing(1)
  },
  empty: {
    padding: '40px 0'
  },
  cancelButton: {
    paddingRight: '10px',
    color: palette.orange.main,
    border: `1px solid ${alpha(palette.orange.main, 0.5)}`,
    '&:hover': {
      backgroundColor: alpha(palette.orange.main, 0.08)
    }
  }
}));

const filterStates = {
  ready: READY_MASK,
  processing: PROCESSING_MASK,
  completed: COMPLETED_MASK,
  cancelled: CANCELLED_MASK
  // blocked: ?
};

// TODO: there's a problem right now because the mixing of states end up in an AND operation, not an OR
// const initialStates =
//   READY_MASK +
//   PROCESSING_MASK +
//   LIVE_SUCCESS_MASK +
//   LIVE_FAILED_MASK +
//   STAGING_SUCCESS_MASK +
//   STAGING_COMPLETED_WITH_ERRORS_MASK +
//   STAGING_FAILED_MASK +
//   COMPLETED_MASK +
//   CANCELLED_MASK;

const currentFiltersInitialState: CurrentFilters = {
  target: null, // used to be 'environment',
  // states: initialStates,
  states: READY_MASK, // TODO: null for all states (?)
  // state: [READY_FOR_LIVE, PROCESSING, COMPLETED, CANCELLED, BLOCKED], // TODO: what's blocked now?
  approvalStates: [],
  submitter: '',
  reviewer: '',
  isScheduled: null,
  sort: 'publishedOn ASC', // Example: field1 ASC, field2 DESC. Accepted fields 'schedule', 'publishedOn', 'reviewedOn'
  offset: 0,
  limit: 5
};

export interface PublishingQueueProps {
  siteId: string;
  readOnly?: boolean;
}

function getFilters(currentFilters: CurrentFilters) {
  const filters: Partial<CurrentFilters> = {};
  if (currentFilters.target) filters['target'] = currentFilters.target;
  if (currentFilters.states) filters['states'] = currentFilters.states;
  if (currentFilters.approvalStates.length) filters['approvalStates'] = currentFilters.approvalStates;
  if (currentFilters.submitter) filters['submitter'] = currentFilters.submitter;
  if (currentFilters.reviewer) filters['reviewer'] = currentFilters.reviewer;
  if (nnou(currentFilters.isScheduled)) filters['isScheduled'] = currentFilters.isScheduled;
  if (currentFilters.sort) filters['sort'] = currentFilters.sort;
  if (currentFilters.limit) filters['limit'] = currentFilters.limit;
  if (currentFilters.offset) filters['offset'] = currentFilters.offset;
  return filters;
}

function renderCount(selected: Selected) {
  let _selected: any = [];
  Object.keys(selected).forEach((key) => {
    if (selected[key]) {
      _selected.push(key);
    }
  });
  return _selected;
}

function PublishingQueue(props: PublishingQueueProps) {
  const { classes } = useStyles();
  const [packages, setPackages] = useState(null);
  const [isFetchingPackages, setIsFetchingPackages] = useState(false);
  const [filesPerPackage, setFilesPerPackage] = useState(null);
  const [selected, setSelected] = useState<Selected>({});
  const [pending, setPending] = useState({});
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useSpreadState({
    environments: null,
    states: currentFiltersInitialState.states
  });
  const [apiState, setApiState] = useSpreadState({
    error: false,
    errorResponse: null
  });
  const [currentFilters, setCurrentFilters] = useState(currentFiltersInitialState);
  const page = currentFilters.offset / currentFilters.limit;
  const { formatMessage } = useIntl();
  const { siteId, readOnly } = props;
  const hasReadyForLivePackages =
    (packages || []).filter((item: PublishPackage) => isReady(item.packageState)).length > 0;

  const getPackages = useCallback(
    (siteId: string) => {
      setIsFetchingPackages(true);
      // TODO: is this validation correct?
      if (currentFilters.states !== 0) {
        console.log('filters', getFilters(currentFilters));
        fetchPackages(siteId, getFilters(currentFilters)).subscribe({
          next: (packages) => {
            setIsFetchingPackages(false);
            console.log('packages', packages);
            setTotal(packages.total);
            setPackages(packages);
          },
          error: ({ response }) => {
            setIsFetchingPackages(false);
            setApiState({ error: true, errorResponse: response.response });
          }
        });
      }
    },
    [currentFilters, setApiState]
  );

  setRequestForgeryToken();

  useEffect(() => {
    fetchPublishingTargets(siteId).subscribe({
      next({ publishingTargets: targets }) {
        let channels: string[] = [];
        targets.forEach((channel) => {
          channels.push(channel.name);
        });
        setFilters({ environments: channels });
      },
      error({ response }) {
        setApiState({ error: true, errorResponse: response });
      }
    });
  }, [siteId, setFilters, setApiState]);

  useEffect(() => {
    getPackages(siteId);
  }, [currentFilters, siteId, getPackages]);

  useEffect(() => {
    setCount(renderCount(selected).length);
  }, [selected]);

  useEffect(() => {
    const events: string[] = [workflowEvent.type, publishEvent.type];
    const hostToHost$ = getHostToHostBus();
    const subscription = hostToHost$.pipe(filter((e) => events.includes(e.type))).subscribe(({ type, payload }) => {
      getPackages(siteId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [siteId, getPackages]);

  function handleCancelAll() {
    if (count === 0) return false;
    let _pending: Selected = {};
    Object.keys(selected).forEach((key: string) => {
      if (selected[key]) {
        _pending[key] = true;
      }
    });
    setPending(_pending);
    // TODO: migrate this API `/api/2/workflow/{site}/package/{package}/cancel`
    cancelPackage(siteId, Object.keys(_pending)).subscribe({
      next() {
        Object.keys(selected).forEach((key: string) => {
          _pending[key] = false;
        });
        setPending({ ...pending, ..._pending });
        clearSelected();
        getPackages(siteId);
      },
      error({ response }) {
        setApiState({ error: true, errorResponse: response });
      }
    });
  }

  function clearSelected() {
    setSelected({});
  }

  function handleSelectAll(event: any) {
    if (!packages || packages.length === 0) return false;
    let _selected: Selected = {};
    if (event.target.checked) {
      packages.forEach((item: PublishPackage) => {
        _selected[item.id] = isReady(item.packageState);
        setSelected({ ...selected, ..._selected });
      });
    } else {
      packages.forEach((item: Package) => {
        _selected[item.id] = false;
        setSelected({ ...selected, ..._selected });
      });
    }
  }

  function areAllSelected() {
    if (packages?.length === 0 || !hasReadyForLivePackages) {
      return false;
    } else {
      return !packages.some(
        (item: PublishPackage) =>
          // There is at least one that is not selected
          isReady(item.packageState) && !selected[item.id]
      );
    }
  }

  function handleFilterChange(event: any) {
    // TODO: use 'switch' instead of 'if'
    if (event.target.type === 'radio') {
      clearSelected();
      setCurrentFilters({ ...currentFilters, [event.target.name]: event.target.value, page: 0 });
    } else if (event.target.type === 'checkbox') {
      let state = [...currentFilters.state];
      if (event.target.checked) {
        if (event.target.value) {
          state.push(event.target.value);
        } else {
          state = [...filters.states];
        }
      } else {
        if (event.target.value) {
          state.splice(state.indexOf(event.target.value), 1);
        } else {
          state = [];
        }
      }
      setCurrentFilters({ ...currentFilters, state, page: 0 });
    }
  }

  function handleChangePage(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) {
    setCurrentFilters({ ...currentFilters, offset: newPage * currentFilters.limit });
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setCurrentFilters({ ...currentFilters, offset: 0, limit: parseInt(event.target.value, 10) });
  }

  return (
    <div className={classes.publishingQueue}>
      <div className={classes.topBar}>
        {isReady(currentFilters.states) && (
          <FormGroup className={classes.selectAll}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={areAllSelected()}
                  disabled={!packages || !hasReadyForLivePackages || readOnly}
                  onClick={handleSelectAll}
                />
              }
              label={formatMessage(messages.selectAll)}
            />
          </FormGroup>
        )}
        {count > 0 && isReady(currentFilters.states) && (
          <Typography variant="body2" className={classes.packagesSelected} color="textSecondary">
            {formatMessage(messages.packagesSelected, { count: count })}
            <HighlightOffIcon className={classes.clearSelected} onClick={clearSelected} />
          </Typography>
        )}
        <Button variant="outlined" className={classes.button} onClick={() => getPackages(siteId)}>
          <RefreshIcon />
        </Button>
        {isReady(currentFilters.states) && (
          <ConfirmDropdown
            classes={{ button: classes.cancelButton }}
            text={formatMessage(messages.cancelSelected)}
            cancelText={formatMessage(messages.cancel)}
            confirmText={formatMessage(messages.confirm)}
            confirmHelperText={formatMessage(messages.confirmAllHelper)}
            onConfirm={handleCancelAll}
            disabled={!(hasReadyForLivePackages && Object.values(selected).length > 0) || readOnly}
          />
        )}
        <FilterDropdown
          className={classes.button}
          text={formatMessage(messages.filters)}
          handleFilterChange={handleFilterChange}
          currentFilters={currentFilters}
          filters={filters}
          filterStates={filterStates}
        />
      </div>
      {/*      {(currentFilters.state.length || currentFilters.path || currentFilters.environment) && (
        <div className={classes.secondBar}>
          <Typography variant="body2">
            {formatMessage(messages.filteredBy, {
              state: currentFilters.state ? <strong key="state">{currentFilters.state.join(', ')}</strong> : 'all',
              path: currentFilters.path ? <strong key="path">{currentFilters.path}</strong> : 'none',
              environment: currentFilters.environment ? (
                <strong key="environment">{currentFilters.environment}</strong>
              ) : (
                'all'
              )
            })}
          </Typography>
        </div>
      )}*/}
      {apiState.error && apiState.errorResponse ? (
        <ApiResponseErrorState error={apiState.errorResponse} />
      ) : (
        <div className={classes.queueList}>
          {packages === null && isFetchingPackages && <LoadingState />}
          {packages &&
            packages.map((item: PublishPackage, index: number) => (
              <PublishingPackage
                pkg={item}
                key={index}
                siteId={siteId}
                selected={selected}
                pending={pending}
                setPending={setPending}
                getPackages={getPackages}
                setApiState={setApiState}
                setSelected={setSelected}
                filesPerPackage={filesPerPackage}
                setFilesPerPackage={setFilesPerPackage}
                readOnly={readOnly}
              />
            ))}
          {packages !== null && packages.length === 0 && (
            <div className={classes.empty}>
              <EmptyState
                title={formatMessage(messages.noPackagesTitle)}
                subtitle={formatMessage(messages.noPackagesSubtitle)}
              />
            </div>
          )}
        </div>
      )}
      <TablePagination
        rowsPerPageOptions={[3, 5, 10]}
        component="div"
        count={total}
        rowsPerPage={currentFilters.limit}
        page={page}
        backIconButtonProps={{
          'aria-label': formatMessage(messages.previous)
        }}
        nextIconButtonProps={{
          'aria-label': formatMessage(messages.next)
        }}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}

export default PublishingQueue;
