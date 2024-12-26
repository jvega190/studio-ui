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

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import React, { ChangeEvent, ReactNode, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import Typography from '@mui/material/Typography';
import { fetchPackageItems } from '../../services/publishing';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import CircularProgress from '@mui/material/CircularProgress';
import '../../styles/animations.scss';
import { alpha } from '@mui/material/styles';
import palette from '../../styles/palette';
import PrimaryButton from '../PrimaryButton';
import { ApiResponse, PublishingItem, PublishPackage } from '../../models';
import { getPackageStateLabel, isReady } from '../PublishPackageReviewDialog/utils';
import Button from '@mui/material/Button';
import { CancelPackageDialog } from '../CancelPackageDialog';
import useEnhancedDialogState from '../../hooks/useEnhancedDialogState';
import useSpreadState from '../../hooks/useSpreadState';
import Box from '@mui/material/Box';
import { Pagination } from '../Pagination';
import { nnou } from '../../utils/object';

const useStyles = makeStyles()((theme) => ({
  package: {
    padding: '20px 8px 20px 0',
    '& .loading-header': {
      display: 'flex',
      alignItems: 'center',
      height: '42px'
    },
    '& .name': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    '& .status': {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px'
    },
    '& .comment': {
      display: 'flex',
      '& p:first-child': {
        marginRight: '20px',
        marginBottom: '10px'
      },
      '& span': {
        color: theme.palette.text.secondary
      }
    },
    '& .files': {
      marginTop: '10px'
    }
  },
  checkbox: {
    marginRight: 'auto'
  },
  thRow: {
    background: theme.palette.background.default
  },
  th: {
    fontWeight: 600
  },
  list: {
    '& li': {
      display: 'flex',
      justifyContent: 'space-between'
    }
  },
  spinner: {
    marginRight: '10px',
    color: theme.palette.text.secondary
  },
  packageLoading: {
    WebkitAnimation: 'pulse 3s infinite ease-in-out',
    animation: 'pulse 3s infinite ease-in-out',
    pointerEvents: 'none'
  },
  cancelButton: {
    paddingRight: '10px',
    color: palette.orange.main,
    border: `1px solid ${alpha(palette.orange.main, 0.5)}`,
    '&:hover': {
      backgroundColor: alpha(palette.orange.main, 0.08)
    }
  },
  username: {
    maxWidth: '390px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    marginBottom: '-5px'
  }
}));

const translations = defineMessages({
  cancelText: {
    id: 'publishingDashboard.cancelItemButtonText',
    defaultMessage: 'Cancel'
  },
  cancel: {
    id: 'publishingDashboard.no',
    defaultMessage: 'No'
  },
  confirm: {
    id: 'publishingDashboard.yes',
    defaultMessage: 'Yes'
  },
  confirmHelperText: {
    id: 'publishingDashboard.confirmHelperText',
    defaultMessage: 'Set item state to "Cancelled"?'
  },
  fetchPackagesFiles: {
    id: 'publishingDashboard.fetchPackagesFiles',
    defaultMessage: 'Fetch Packages Files'
  },
  status: {
    id: 'publishingDashboard.status',
    defaultMessage: 'Status is {state} for {environment} target'
  },
  comment: {
    id: 'publishingDashboard.comment',
    defaultMessage: 'Comment'
  },
  commentNotProvided: {
    id: 'publishingDashboard.commentNotProvided',
    defaultMessage: '(submission comment not provided)'
  },
  filesList: {
    id: 'publishingDashboard.filesList',
    defaultMessage: 'files list'
  },
  path: {
    id: 'words.path',
    defaultMessage: 'Path'
  },
  type: {
    id: 'words.type',
    defaultMessage: 'Type'
  },
  item: {
    id: 'words.item',
    defaultMessage: 'Item'
  },
  asset: {
    id: 'words.asset',
    defaultMessage: 'Asset'
  },
  script: {
    id: 'words.script',
    defaultMessage: 'Script'
  },
  page: {
    id: 'words.page',
    defaultMessage: 'Page'
  },
  renderingTemplate: {
    id: 'words.template',
    defaultMessage: 'Template'
  },
  component: {
    id: 'words.component',
    defaultMessage: 'Component'
  },
  unknown: {
    id: 'words.unknown',
    defaultMessage: 'Unknown'
  }
});

interface PublishingPackageProps {
  siteId: string;
  pkg: PublishPackage;
  selected: Record<string, boolean>;
  pending: Record<string, boolean>;
  readOnly?: boolean;

  setSelected(selected: Record<string, boolean>): void;

  setApiState(state: { error: boolean; errorResponse: ApiResponse }): void;

  setPending(pending: Record<string, boolean>): void;

  getPackages(siteId: string, filters?: string): void;
}

export function PublishingPackage(props: PublishingPackageProps) {
  const { classes, cx } = useStyles();
  const { formatMessage } = useIntl();
  const { pkg, siteId, selected, setSelected, pending, setPending, getPackages, setApiState, readOnly } = props;
  const [{ items, total, limit, offset, loading }, setState] = useSpreadState({
    items: null,
    total: null,
    limit: 10,
    offset: 0,
    loading: false
  });
  const currentPage = offset / limit;
  const { id, title, packageState: state, target, submitter, submittedOn, submitterComment } = pkg;
  const username = submitter.username;
  const comment = submitterComment;
  const schedule = submittedOn;
  const cancelPackageDialogState = useEnhancedDialogState();

  const { current: ref } = useRef<any>({});

  function onSelect(event: ChangeEvent, id: number, checked: boolean) {
    if (checked) {
      setSelected({ ...selected, [id]: false });
    } else {
      setSelected({ ...selected, [id]: true });
    }
  }

  function onCancel(packageId: number) {
    setPending({ ...pending, [packageId]: true });
    cancelPackageDialogState.onOpen();
  }

  const onCancelDialogSuccess = () => {
    getPackages(siteId);
  };

  ref.onCancelDialogClosed = (packageId: string) => {
    setPending({ ...pending, [packageId]: false });
  };

  function onFetchPackageItems(page?: number, itemsPerPage?: number) {
    setState({ loading: true });
    const newOffset = nnou(page) ? page * limit : offset;
    const newLimit = nnou(itemsPerPage) ? itemsPerPage : limit;
    fetchPackageItems(siteId, id, {
      offset: newOffset,
      limit: newLimit
    }).subscribe({
      next: (items) => {
        setState({ loading: false, items, total: items.total, offset: newOffset });
      },
      error: ({ response }) => {
        setState({ loading: false });
        setApiState({ error: true, errorResponse: response });
      }
    });
  }

  const onRowsPerPageChange = (rowsPerPage: number) => {
    setState({ limit: rowsPerPage, offset: 0 });
    onFetchPackageItems(0, rowsPerPage);
  };

  const checked = selected[id] ? selected[id] : false;
  return (
    <div className={cx(classes.package, pending[id] && classes.packageLoading)}>
      <section className="name">
        {pending[id] ? (
          <header className={'loading-header'}>
            <CircularProgress size={15} className={classes.spinner} color={'inherit'} />
            <Typography variant="body1">
              <strong>{id}</strong>
            </Typography>
          </header>
        ) : isReady(state) ? (
          <FormGroup className={classes.checkbox}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={checked}
                  onChange={(event) => onSelect(event, id, checked)}
                  disabled={readOnly}
                />
              }
              label={
                <strong>
                  {id} - {title}
                </strong>
              }
            />
          </FormGroup>
        ) : (
          <Typography variant="body1">
            <strong>
              {id} - {title}
            </strong>
          </Typography>
        )}
        {isReady(state) && (
          <Button variant="outlined" color="warning" onClick={() => onCancel(id)} disabled={readOnly}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
        )}
      </section>
      <div className="status">
        <Typography variant="body2">
          <FormattedMessage
            id="publishingDashboard.scheduled"
            defaultMessage="Scheduled for <b>{schedule, date, medium} {schedule, time, short}</b> by <b>{username}</b>"
            values={{
              schedule: new Date(schedule),
              username,
              b: (content: ReactNode[]) => (
                <strong key={content[0] as string} className={classes.username}>
                  {content[0]}
                </strong>
              )
            }}
          />
        </Typography>
        <Typography variant="body2">
          {formatMessage(translations.status, {
            state: <strong>{getPackageStateLabel(state)}</strong>,
            environment: <strong key={target}>{target}</strong>
          })}
        </Typography>
      </div>
      <div className="comment">
        <Typography variant="body2">{formatMessage(translations.comment)}</Typography>
        <Typography variant="body2">
          {comment ? comment : <span>{formatMessage(translations.commentNotProvided)}</span>}
        </Typography>
      </div>
      <div className="files">
        {items && (
          <>
            <List aria-label={formatMessage(translations.filesList)} className={classes.list}>
              <ListItem className={classes.thRow} divider>
                <Typography variant="caption" className={classes.th}>
                  {formatMessage(translations.item)} ({formatMessage(translations.path).toLowerCase()})
                </Typography>
                <Typography variant="caption" className={classes.th}>
                  {formatMessage(translations.type)}
                </Typography>
              </ListItem>
              {items.map((item: PublishingItem, index: number) => (
                <ListItem key={index} divider>
                  <Typography variant="body2">{item.path}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.itemMetadata.systemType in translations
                      ? formatMessage(translations[item.itemMetadata.systemType])
                      : item.itemMetadata.systemType}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Box display="flex" justifyContent="flex-end">
              <Pagination
                count={total}
                onPageChange={(event, page) => onFetchPackageItems(page)}
                page={currentPage}
                rowsPerPage={limit}
                onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
              />
            </Box>
          </>
        )}
        {items === null && (
          <PrimaryButton
            variant="outlined"
            onClick={() => onFetchPackageItems()}
            disabled={!!loading}
            loading={loading}
          >
            {formatMessage(translations.fetchPackagesFiles)}
          </PrimaryButton>
        )}
      </div>
      <CancelPackageDialog
        open={cancelPackageDialogState.open}
        onSuccess={onCancelDialogSuccess}
        onClose={cancelPackageDialogState.onClose}
        onClosed={() => ref.onCancelDialogClosed(id)}
        isSubmitting={cancelPackageDialogState.isSubmitting}
        packageId={id}
      />
    </div>
  );
}

export default PublishingPackage;
