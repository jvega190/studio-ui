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

import { createReducer } from '@reduxjs/toolkit';
import { PublishingPackageApprovalDialogStateProps } from '../../../components/ApproveRejectDialog/types';
import { GlobalState } from '../../../models';
import {
  approveRejectDialogClosed,
  closeApproveRejectDialog,
  showApproveRejectDialog,
  updateApproveRejectDialog
} from '../../actions/dialogs';

const initialState: PublishingPackageApprovalDialogStateProps = {
  open: false,
  packageId: null,
  isSubmitting: null,
  isMinimized: null,
  hasPendingChanges: null
};

export default createReducer<GlobalState['dialogs']['approveReject']>(initialState, (builder) => {
  builder
    .addCase(showApproveRejectDialog, (state, { payload }) => ({
      ...state,
      onClose: closeApproveRejectDialog(),
      onClosed: approveRejectDialogClosed(),
      ...(payload as Partial<PublishingPackageApprovalDialogStateProps>),
      open: true
    }))
    .addCase(updateApproveRejectDialog, (state, { payload }) => ({
      ...state,
      ...(payload as Partial<PublishingPackageApprovalDialogStateProps>)
    }))
    .addCase(closeApproveRejectDialog, (state) => ({ ...state, open: false }))
    .addCase(approveRejectDialogClosed, () => initialState);
});
