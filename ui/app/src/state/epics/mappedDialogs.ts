/*
 * Copyright (C) 2007-2025 Crafter Software Corporation. All Rights Reserved.
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
  closeCompareVersionsDialog,
  closeConfirmDialog,
  closeCopyDialog,
  closeCreateFileDialog,
  closeCreateFolderDialog,
  closeDependenciesDialog,
  closeHistoryDialog,
  closeItemMegaMenu,
  closeNewContentDialog,
  closePathSelectionDialog,
  closePreviewDialog,
  closePublishDialog,
  closePublishingStatusDialog,
  closeSingleFileUploadDialog,
  closeUploadDialog,
  closeWidgetDialog,
  closeWorkflowCancellationDialog,
  historyDialogUpdate,
  itemMegaMenuClosed,
  showChangeContentTypeDialog,
  showCompareVersionsDialog,
  showConfirmDialog,
  showCopyDialog,
  showCreateFileDialog,
  showCreateFolderDialog,
  showDeleteDialog,
  showDependenciesDialog,
  showHistoryDialog,
  showItemMegaMenu,
  showNewContentDialog,
  showPathSelectionDialog,
  showPreviewDialog,
  showPublishDialog,
  showPublishingStatusDialog,
  showRejectDialog,
  showRenameAssetDialog,
  showSingleFileUploadDialog,
  showUploadDialog,
  showWorkflowCancellationDialog,
  updateCopyDialog,
  updateCreateFileDialog,
  updateCreateFolderDialog,
  updatePreviewDialog,
  updatePublishDialog,
  updateRejectDialog,
  updateSingleFileUploadDialog,
  updateWidgetDialog
} from '../actions/dialogs';
import { map, withLatestFrom } from 'rxjs/operators';
import { popDialog, pushDialog, updateDialogState } from '../actions/dialogStack';
import { generateDialogId } from '../../utils/dialogs';
import { updatePublishingStatus } from '../actions/publishingStatus';

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
  [showPreviewDialog.type]: 'craftercms.components.PreviewDialog',
  [showWidgetDialog.type]: 'craftercms.components.WidgetDialog',
  [showHistoryDialog.type]: 'craftercms.components.HistoryDialog',
  [showPublishingStatusDialog.type]: 'craftercms.components.PublishingStatusDialog',
  [showCompareVersionsDialog.type]: 'craftercms.components.CompareVersionsDialog',
  [showPathSelectionDialog.type]: 'craftercms.components.PathSelectionDialog'
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
        showWorkflowCancellationDialog.type, // TODO: testing pending
        showRejectDialog.type, // TODO: testing pending
        showCreateFolderDialog.type,
        showCreateFileDialog.type,
        showCopyDialog.type,
        showUploadDialog.type,
        showSingleFileUploadDialog.type,
        showPreviewDialog.type,
        showWidgetDialog.type,
        // showHistoryDialog.type, // TODO: versionsBranch not working... something with the update (?)
        showPublishingStatusDialog.type,
        // showCompareVersionsDialog.type, // TODO: versionsBranch undefined.
        // showRenameAssetDialog.type
        // showPathSelectionDialog.type // TODO: this is not an EnhancedDialog, so the 'onTransitionExited' is not being called.
        showDeleteDialog.type
      ),
      withLatestFrom(state$),
      map(([{ payload, type }]) => {
        if (type === showPathSelectionDialog.type) {
          console.log('id', generateDialogId(type));
        }
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
        updatePreviewDialog.type,
        updateWidgetDialog.type,
        historyDialogUpdate.type,
        updatePublishingStatus.type
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
        closePreviewDialog.type,
        closeItemMegaMenu.type,
        closeWidgetDialog.type,
        closeHistoryDialog.type,
        closePublishingStatusDialog.type,
        closeCompareVersionsDialog.type,
        closePathSelectionDialog.type
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
