/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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

import { createStyles, makeStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import DialogHeader from '../Dialogs/DialogHeader';
import { publishingStatusTileMessages } from '../PublishingStatusTile';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';
import LockOpenRoundedIcon from '@material-ui/icons/LockOpenRounded';
import DialogBody from '../Dialogs/DialogBody';
import { ListItem } from '@material-ui/core';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Skeleton from '@material-ui/lab/Skeleton';
import * as React from 'react';
import { Alert } from '@material-ui/lab';
import { PublishingStatus } from '../../models/Publishing';
import PublishingStatusAvatar from '../PublishingStatusAvatar/PublishingStatusAvatar';

export type PublishingStatusDialogBodyProps = PublishingStatus & {
  isFetching: boolean;
  onClose(): void;
  onRefresh?(): void;
  onUnlock?(): void;
};

const useStyles = makeStyles(() =>
  createStyles({
    body: {
      minHeight: 145,
      placeContent: 'center'
    }
  })
);

function PublishingStatusDialogBody(props: PublishingStatusDialogBodyProps) {
  const { status, message, enabled, lockOwner, lockTTL, onClose, onRefresh, onUnlock, isFetching } = props;
  const classes = useStyles();
  const { formatMessage } = useIntl();
  return (
    <>
      <DialogHeader
        title={formatMessage(publishingStatusTileMessages.publishingStatus)}
        onDismiss={onClose}
        rightActions={[
          onUnlock && {
            icon: LockOpenRoundedIcon,
            onClick: onUnlock,
            tooltip: formatMessage(publishingStatusTileMessages.unlock)
          },
          onRefresh && {
            icon: RefreshRoundedIcon,
            onClick: onRefresh,
            tooltip: formatMessage(publishingStatusTileMessages.refresh)
          }
        ].filter(Boolean)}
      />
      <DialogBody className={classes.body}>
        {!enabled && (
          <Alert severity="warning" style={{ marginBottom: '1em' }}>
            {formatMessage(publishingStatusTileMessages.disabled)}
          </Alert>
        )}
        <ListItem component="div">
          <ListItemAvatar>
            <PublishingStatusAvatar status={isFetching ? null : status} />
          </ListItemAvatar>
          <ListItemText
            primary={
              isFetching ? (
                <Skeleton />
              ) : publishingStatusTileMessages[status] ? (
                formatMessage(publishingStatusTileMessages[status])
              ) : (
                status
              )
            }
            secondary={
              isFetching ? (
                <Skeleton />
              ) : (
                <>
                  {message && (
                    <>
                      {message}
                      <br />
                    </>
                  )}
                  {lockOwner && (
                    <>
                      {formatMessage(publishingStatusTileMessages.lockOwner, { lockOwner })}
                      <br />
                    </>
                  )}
                  {lockTTL && formatMessage(publishingStatusTileMessages.lockTTL, { lockTTL })}
                </>
              )
            }
          />
        </ListItem>
      </DialogBody>
    </>
  );
}

export default PublishingStatusDialogBody;
