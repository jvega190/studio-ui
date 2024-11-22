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

import { DetailedItem } from '../../models/Item';
import { ApiResponse } from '../../models/ApiResponse';
import StandardAction from '../../models/StandardAction';
import { GoLiveResponse } from '../../services/publishing';
import { EnhancedDialogProps } from '../EnhancedDialog';
import { EnhancedDialogState } from '../../hooks/useEnhancedDialogState';
import { PublishingTarget } from '../../models/Publishing';

export interface ExtendedGoLiveResponse extends GoLiveResponse {
  schedule: 'now' | 'custom';
  publishingTarget: string;
  type: 'submit' | 'publish';
  items: DetailedItem[];
}

export interface PublishDialogBaseProps {
  items?: DetailedItem[];
  // if null it means the dialog should determinate which one to use
  scheduling?: 'now' | 'custom';
}

export interface PublishDialogProps extends PublishDialogBaseProps, EnhancedDialogProps {
  onSuccess?(response?: ExtendedGoLiveResponse): void;
}

export interface PublishDialogStateProps extends PublishDialogBaseProps, EnhancedDialogState {
  onClose?: StandardAction;
  onClosed?: StandardAction;
  onSuccess?: StandardAction;
}

export interface PublishDialogContainerProps
  extends PublishDialogBaseProps,
    Pick<PublishDialogProps, 'isSubmitting' | 'onSuccess' | 'onClose'> {}

export interface InternalDialogState {
  packageTitle: string;
  emailOnApprove: boolean;
  requestApproval: boolean;
  publishingTarget: PublishingTarget['name'] | '';
  submissionComment: string;
  scheduling: 'now' | 'custom';
  scheduledDateTime: Date;
  error: ApiResponse;
  fetchingDependencies: boolean;
}
