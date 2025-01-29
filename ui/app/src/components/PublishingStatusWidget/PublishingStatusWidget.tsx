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

import * as React from 'react';
import Paper from '@mui/material/Paper';
import { PublishingStatusDialogContainer } from '../PublishingStatusDialog';
import { clearLock, enable } from '../../services/publishing';
import { fetchPublishingStatus } from '../../state/actions/publishingStatus';
import { useDispatch } from 'react-redux';
import { useSelection } from '../../hooks/useSelection';
import { batchActions } from '../../state/actions/misc';
import { showSystemNotification } from '../../state/actions/system';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  publisherUnlocked: {
    id: 'publishingStatus.publisherUnlocked',
    defaultMessage: 'Publisher Unlocked'
  }
});

type PublishingStatusWidgetProps = {
  siteId: string;
};

export function PublishingStatusWidget(props: PublishingStatusWidgetProps) {
  const { siteId } = props;
  const state = useSelection((state) => state.dialogs.publishingStatus);
  const { enabled, published, currentTask } = state;
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const onStartStop = () => {
    enable(siteId, !state.enabled).subscribe(() => {
      dispatch(fetchPublishingStatus());
    });
  };

  const onUnlock = () => {
    clearLock(siteId).subscribe(() => {
      dispatch(
        batchActions([
          showSystemNotification({ message: formatMessage(messages.publisherUnlocked) }),
          fetchPublishingStatus()
        ])
      );
    });
  };

  const onRefresh = () => {
    dispatch(fetchPublishingStatus());
  };

  return (
    <Paper elevation={2}>
      <PublishingStatusDialogContainer
        enabled={enabled}
        published={published}
        currentTask={currentTask}
        isFetching={!state}
        onClose={null}
        onRefresh={onRefresh}
        onStartStop={onStartStop}
        // onUnlock={lockOwner ? onUnlock : null}
      />
    </Paper>
  );
}

export default PublishingStatusWidget;
