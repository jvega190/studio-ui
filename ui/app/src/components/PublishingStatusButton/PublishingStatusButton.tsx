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

import React, { forwardRef } from 'react';
import { IconButtonProps } from '@mui/material/IconButton';
import { useDispatch } from 'react-redux';
import PublishingStatusButtonUI, { PublishingStatusButtonUIProps } from './PublishingStatusButtonUI';
import { showWidgetDialog } from '../../state/actions/dialogs';
import { useSelection } from '../../hooks/useSelection';
import { defineMessages, useIntl } from 'react-intl';

const translations = defineMessages({
  publishing: {
    id: 'words.publishing',
    defaultMessage: 'Publishing'
  }
});

export interface PublishingStatusButtonProps extends IconButtonProps {
  variant?: PublishingStatusButtonUIProps['variant'];
}

export const PublishingStatusButton = forwardRef<HTMLButtonElement, PublishingStatusButtonProps>((props, ref) => {
  const { enabled, status, isFetching, totalItems, numberOfItems } = useSelection(
    (state) => state.dialogs.publishingStatus
  );
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const onShowDialog = () => {
    dispatch(
      showWidgetDialog({
        title: formatMessage(translations.publishing),
        widget: {
          id: 'craftercms.components.PublishingDashboard',
          configuration: {
            embedded: true
          }
        },
        fullHeight: false
      })
    );
  };

  return (
    <PublishingStatusButtonUI
      {...props}
      ref={ref}
      enabled={enabled}
      status={status}
      isFetching={isFetching}
      totalItems={totalItems}
      numberOfItems={numberOfItems}
      onClick={onShowDialog}
    />
  );
});

export default PublishingStatusButton;
