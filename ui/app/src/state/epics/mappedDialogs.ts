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
	closeBrokenReferencesDialog,
	closeBulkCancelPackageDialog,
	closeCancelPackageDialog,
	closeChangeContentTypeDialog,
	closeCodeEditorDialog,
	closeCompareVersionsDialog,
	closeConfirmDialog,
	closeCopyDialog,
	closeCreateFileDialog,
	closeCreateFolderDialog,
	closeDeleteDialog,
	closeDependenciesDialog,
	closeEditDialog,
	closeEditSiteDialog,
	closeHistoryDialog,
	closeItemMegaMenu,
	closeItemMenu,
	closeLauncher,
	closeNewContentDialog,
	closePackageDetailsDialog,
	closePathSelectionDialog,
	closePreviewDialog,
	closePublishDialog,
	closePublishingPackageResubmitDialog,
	closePublishingPackageReviewDialog,
	closePublishingStatusDialog,
	closeRenameAssetDialog,
	closeSingleFileUploadDialog,
	closeUploadDialog,
	closeViewPackagesDialog,
	closeWidgetDialog,
	historyDialogUpdate,
	showBrokenReferencesDialog,
	showBulkCancelPackageDialog,
	showCancelPackageDialog,
	showChangeContentTypeDialog,
	showCodeEditorDialog,
	showCompareVersionsDialog,
	showConfirmDialog,
	showCopyDialog,
	showCreateFileDialog,
	showCreateFolderDialog,
	showDeleteDialog,
	showDependenciesDialog,
	showEditDialog,
	showEditSiteDialog,
	showHistoryDialog,
	showItemMegaMenu,
	showItemMenu,
	showLauncher,
	showNewContentDialog,
	showPackageDetailsDialog,
	showPathSelectionDialog,
	showPreviewDialog,
	showPublishDialog,
	showPublishingPackageResubmitDialog,
	showPublishingPackageReviewDialog,
	showPublishingStatusDialog,
	showRenameAssetDialog,
	showSingleFileUploadDialog,
	showUploadDialog,
	showViewPackagesDialog,
	showWidgetDialog,
	updateBrokenReferencesDialog,
	updateBulkCancelPackageDialog,
	updateCancelPackageDialog,
	updateCodeEditorDialog,
	updateCopyDialog,
	updateCreateFileDialog,
	updateCreateFolderDialog,
	updateDeleteDialog,
	updateEditDialogConfig,
	updateEditSiteDialog,
	updateLauncher,
	updatePreviewDialog,
	updatePublishDialog,
	updatePublishingPackageResubmitDialog,
	updatePublishingPackageReviewDialog,
	updateRenameAssetDialog,
	updateSingleFileUploadDialog,
	updateWidgetDialog
} from '../actions/dialogs';
import { map, withLatestFrom } from 'rxjs/operators';
import { popDialog, pushDialog, updateDialogState } from '../actions/dialogStack';
import { generateDialogId } from '../../utils/dialogs';
import { updatePublishingStatus } from '../actions/publishingStatus';
import { DialogStackItem, StandardAction } from '../../models';
import { createCallback, EnhancedDialogProps } from '../../components';
import { closeErrorDialog, showErrorDialog } from '../reducers/dialogs/error';
import { blockUI, unblockUI } from '../actions/system';

const dialogsMap = {
	[showConfirmDialog.type]: 'craftercms.components.ConfirmDialog',
	[showPublishDialog.type]: 'craftercms.components.PublishDialog',
	[showNewContentDialog.type]: 'craftercms.components.NewContentDialog',
	[showChangeContentTypeDialog.type]: 'craftercms.components.ChangeContentTypeDialog',
	[showDependenciesDialog.type]: 'craftercms.components.DependenciesDialog',
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
	[showPathSelectionDialog.type]: 'craftercms.components.PathSelectionDialog',
	[showCodeEditorDialog.type]: 'craftercms.components.CodeEditorDialog',
	[showPublishingPackageReviewDialog.type]: 'craftercms.components.PublishingPackageReviewDialog',
	[showPublishingPackageResubmitDialog.type]: 'craftercms.components.PublishingPackageResubmitDialog',
	[showEditSiteDialog.type]: 'craftercms.components.EditSiteDialog',
	[showCancelPackageDialog.type]: 'craftercms.components.CancelPackageDialog',
	[showBulkCancelPackageDialog.type]: 'craftercms.components.BulkCancelPackageDialog',
	[showPackageDetailsDialog.type]: 'craftercms.components.PackageDetailsDialog',
	[showViewPackagesDialog.type]: 'craftercms.components.ViewPackagesDialog',
	[showErrorDialog.type]: 'craftercms.components.ErrorDialog',
	[showBrokenReferencesDialog.type]: 'craftercms.components.BrokenReferencesDialog',
	[showRenameAssetDialog.type]: 'craftercms.components.RenameAssetDialog',
	[showDeleteDialog.type]: 'craftercms.components.DeleteDialog',
	[showEditDialog.type]: 'craftercms.components.LegacyFormDialog',
	[showItemMenu.type]: 'craftercms.components.ItemMenu',
	[showItemMegaMenu.type]: 'craftercms.components.ItemMegaMenu',
	[showLauncher.type]: 'craftercms.components.Launcher',
	[blockUI.type]: 'craftercms.components.UIBlocker'
};

const allowMinimizeDialogs = [showPreviewDialog.type, showCodeEditorDialog.type, showEditDialog.type];
const allowFullScreenDialogs = [showPreviewDialog.type, showCodeEditorDialog.type];

const showDialogsEpics: CrafterCMSEpic[] = [
	// region showDialogs
	(action$, state$, { store }) =>
		action$.pipe(
			ofType(
				showConfirmDialog.type,
				showPublishDialog.type,
				showNewContentDialog.type,
				showChangeContentTypeDialog.type,
				showDependenciesDialog.type,
				showCreateFolderDialog.type,
				showCreateFileDialog.type,
				showCopyDialog.type,
				showUploadDialog.type,
				showSingleFileUploadDialog.type,
				showPreviewDialog.type,
				showWidgetDialog.type,
				showPublishingStatusDialog.type,
				showPathSelectionDialog.type,
				showCodeEditorDialog.type,
				showPublishingPackageReviewDialog.type,
				showPublishingPackageResubmitDialog.type,
				showEditSiteDialog.type,
				showCancelPackageDialog.type,
				showBulkCancelPackageDialog.type,
				showPackageDetailsDialog.type,
				showViewPackagesDialog.type,
				showErrorDialog.type,
				showBrokenReferencesDialog.type,
				showRenameAssetDialog.type,
				showDeleteDialog.type,
				showEditDialog.type,
				showItemMenu.type,
				showItemMegaMenu.type,
				showLauncher.type
			),
			withLatestFrom(state$),
			map(([{ payload, type }]) => {
				const dialogProps: DialogStackItem<EnhancedDialogProps>['props'] = { ...payload };
				Object.entries((payload as EnhancedDialogProps) ?? {}).forEach(([key, value]) => {
					// TODO: By just having a type, can I say it is an action?
					if (value.type) {
						dialogProps[key] = createCallback(value as StandardAction, store.dispatch);
					}
				});

				return pushDialog({
					id: generateDialogId(type),
					component: dialogsMap[type],
					allowMinimize: allowMinimizeDialogs.includes(type),
					allowFullScreen: allowFullScreenDialogs.includes(type),
					props: dialogProps
				});
			})
		),
	// endregion

	// region updateDialogs
	(action$, state$) =>
		action$.pipe(
			ofType(
				updatePublishDialog.type,
				updateCreateFolderDialog.type,
				updateCreateFileDialog.type,
				updateCopyDialog.type,
				updateSingleFileUploadDialog.type,
				updatePreviewDialog.type,
				updateWidgetDialog.type,
				historyDialogUpdate.type,
				updatePublishingStatus.type,
				updateCodeEditorDialog.type,
				updatePublishingPackageReviewDialog.type,
				updatePublishingPackageResubmitDialog.type,
				updateEditSiteDialog.type,
				updateCancelPackageDialog.type,
				updateBulkCancelPackageDialog.type,
				updateBrokenReferencesDialog.type,
				updateRenameAssetDialog.type,
				updateDeleteDialog.type,
				updateEditDialogConfig.type,
				updateLauncher.type
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
				closePathSelectionDialog.type,
				closeCodeEditorDialog.type,
				closePublishingPackageReviewDialog.type,
				closePublishingPackageResubmitDialog.type,
				closeEditSiteDialog.type,
				closeCancelPackageDialog.type,
				closeBulkCancelPackageDialog.type,
				closePackageDetailsDialog.type,
				closeViewPackagesDialog.type,
				closeErrorDialog.type,
				closeBrokenReferencesDialog.type,
				closeRenameAssetDialog.type,
				closeDeleteDialog.type,
				closeEditDialog.type,
				closeItemMenu.type,
				closeItemMegaMenu.type,
				closeLauncher.type
			),
			withLatestFrom(state$),
			map(([{ type }]) => {
				return popDialog({ id: generateDialogId(type) });
			})
		),
	// endregion

	// region UIBlocker
	(action$, state$) =>
		action$.pipe(
			ofType(blockUI.type),
			withLatestFrom(state$),
			map(([{ payload, type }]) => {
				return pushDialog({
					id: blockUI.type,
					component: dialogsMap[type],
					props: payload
				});
			})
		),
	(action$, state$) =>
		action$.pipe(
			ofType(unblockUI.type),
			withLatestFrom(state$),
			map(() => {
				return popDialog({ id: blockUI.type });
			})
		)
	// end region

	// region showNonDialogs
	// (action$, state$) =>
	// 	action$.pipe(
	// 		ofType(showLauncher.type),
	// 		withLatestFrom(state$),
	// 		map(([{ payload, type }]) => {
	// 			return pushNonDialog({
	// 				id: generateDialogId(type),
	// 				component: dialogsMap[type],
	// 				props: payload
	// 			});
	// 		})
	// 	)
	// endregion
] as CrafterCMSEpic[];

export default showDialogsEpics;
