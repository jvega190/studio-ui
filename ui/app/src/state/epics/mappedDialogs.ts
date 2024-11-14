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

import { CrafterCMSEpic } from '../store';
import { ofType } from 'redux-observable';
import {
  closeChangeContentTypeDialog,
  closeConfirmDialog,
  closeCopyDialog,
  closeCreateFileDialog,
  closeCreateFolderDialog,
  closeDependenciesDialog,
  closeNewContentDialog,
  closePreviewDialog,
  closePublishDialog,
  closeSingleFileUploadDialog,
  closeUploadDialog,
  closeWorkflowCancellationDialog,
  showChangeContentTypeDialog,
  showConfirmDialog,
  showCopyDialog,
  showCreateFileDialog,
  showCreateFolderDialog,
  showDependenciesDialog,
  showNewContentDialog,
  showPreviewDialog,
  showPublishDialog,
  showRejectDialog,
  showSingleFileUploadDialog,
  showUploadDialog,
  showWorkflowCancellationDialog,
  updateCopyDialog,
  updateCreateFileDialog,
  updateCreateFolderDialog,
  updatePreviewDialog,
  updatePublishDialog,
  updateRejectDialog,
  updateSingleFileUploadDialog
} from '../actions/dialogs';
import { map, withLatestFrom } from 'rxjs/operators';
import { popDialog, pushDialog, updateDialogState } from '../actions/dialogStack';
import { generateDialogId } from '../../utils/dialogs';

const dialogsMap = {
  [showConfirmDialog.type]: 'craftercms.components.ConfirmDialog',
  [showPublishDialog.type]: 'craftercms.components.PublishDialog',
  [showNewContentDialog.type]: 'craftercms.components.NewContentDialog',
  [showChangeContentTypeDialog.type]: 'craftercms.components.ChangeContentTypeDialog',
  [showDependenciesDialog.type]: 'craftercms.components.DependenciesDialog',
  [showWorkflowCancellationDialog.type]: 'craftercms.components.WorkflowCancellationDialog',
  [showRejectDialog.type]: 'craftercms.components.RejectDialog',
  [showCreateFolderDialog.type]: 'craftercms.components.CreateFolderDialog',
  [showCreateFileDialog.type]: 'craftercms.components.CreateFileDialog',
  [showCopyDialog.type]: 'craftercms.components.CopyDialog',
  [showUploadDialog.type]: 'craftercms.components.UploadDialog',
  [showSingleFileUploadDialog.type]: 'craftercms.components.SingleFileUploadDialog',
  [showPreviewDialog.type]: 'craftercms.components.PreviewDialog'
};

const allowMinimizeDialogs = [showPreviewDialog.type];
const allowFullScreenDialogs = [showPreviewDialog.type];

const showDialogsEpics: CrafterCMSEpic[] = [
  // region showDialogs
  (action$, state$) =>
    action$.pipe(
      ofType(
        showConfirmDialog.type,
        showPublishDialog.type,
        showNewContentDialog.type,
        showChangeContentTypeDialog.type,
        showDependenciesDialog.type,
        showWorkflowCancellationDialog.type,
        showRejectDialog.type,
        showCreateFolderDialog.type,
        showCreateFileDialog.type,
        showCopyDialog.type,
        showUploadDialog.type,
        showSingleFileUploadDialog.type,
        showPreviewDialog.type
      ),
      withLatestFrom(state$),
      map(([{ payload, type }]) => {
        return pushDialog({
          id: generateDialogId(type),
          component: dialogsMap[type],
          allowMinimize: allowMinimizeDialogs.includes(type),
          allowFullScreen: allowFullScreenDialogs.includes(type),
          props: {
            ...payload
          }
        });
      })
    ),
  // endregion

  // region updateDialogs
  (action$, state$) =>
    action$.pipe(
      ofType(
        updatePublishDialog.type,
        updateRejectDialog.type,
        updateCreateFolderDialog.type,
        updateCreateFileDialog.type,
        updateCopyDialog.type,
        updateSingleFileUploadDialog.type,
        updatePreviewDialog.type
      ),
      withLatestFrom(state$),
      map(([{ payload, type }]) => {
        return updateDialogState({
          id: generateDialogId(type),
          props: {
            ...payload
          }
        });
      })
    ),
  // endregion

  // region closeDialogs
  (action$, state$) =>
    action$.pipe(
      ofType(
        closeConfirmDialog.type,
        closePublishDialog.type,
        closeNewContentDialog.type,
        closeChangeContentTypeDialog.type,
        closeDependenciesDialog.type,
        closeWorkflowCancellationDialog.type,
        closeCreateFolderDialog.type,
        closeCreateFileDialog.type,
        closeCopyDialog.type,
        closeUploadDialog.type,
        closeSingleFileUploadDialog.type,
        closePreviewDialog.type
      ),
      withLatestFrom(state$),
      map(([{ type }]) => {
        return popDialog({
          id: generateDialogId(type)
        });
      })
    )
  // endregion
] as CrafterCMSEpic[];

export default showDialogsEpics;
