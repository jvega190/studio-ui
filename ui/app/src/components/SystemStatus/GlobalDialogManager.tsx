/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import React, { lazy, Suspense, useEffect } from 'react';
import StandardAction from '../../models/StandardAction';
import { Dispatch } from 'redux';
import { useDispatch } from 'react-redux';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { isPlainObject } from '../../utils/object';
import PathSelectionDialog from '../Dialogs/PathSelectionDialog';
import { useSnackbar } from 'notistack';
import { getHostToHostBus } from '../../modules/Preview/previewContext';
import { filter } from 'rxjs/operators';
import { showSystemNotification } from '../../state/actions/system';
import Launcher from '../Launcher/Launcher';
import UnlockPublisherDialog from '../UnlockPublisherDialog';
import WidgetDialog from '../WidgetDialog';
import { useSelection } from '../../utils/hooks/useSelection';
import CodeEditorDialog from '../CodeEditorDialog';
import { useWithPendingChangesCloseRequest } from '../../utils/hooks/useWithPendingChangesCloseRequest';

const ViewVersionDialog = lazy(() => import('../ViewVersionDialog'));
const CompareVersionsDialog = lazy(() => import('../CompareVersionsDialog'));
const RejectDialog = lazy(() => import('../Dialogs/RejectDialog'));
const EditSiteDialog = lazy(() => import('../../modules/System/Sites/Edit/EditSiteDialog'));
const ConfirmDialog = lazy(() => import('../ConfirmDialog'));
const ErrorDialog = lazy(() => import('./ErrorDialog'));
const NewContentDialog = lazy(() => import('../NewContentDialog'));
const ChangeContentTypeDialog = lazy(() => import('../ChangeContentTypeDialog'));
const HistoryDialog = lazy(() => import('../HistoryDialog'));
const PublishDialog = lazy(() => import('../PublishDialog'));
const DependenciesDialog = lazy(() => import('../DependenciesDialog/DependenciesDialog'));
const DeleteDialog = lazy(() => import('../DeleteDialog'));
const WorkflowCancellationDialog = lazy(() => import('../WorkflowCancellationDialog'));
const LegacyFormDialog = lazy(() => import('../Dialogs/LegacyFormDialog'));
const CreateFolderDialog = lazy(() => import('../CreateFolderDialog'));
const CopyItemsDialog = lazy(() => import('../Dialogs/CopyDialog'));
const CreateFileDialog = lazy(() => import('../Dialogs/CreateFileDialog'));
const BulkUploadDialog = lazy(() => import('../Dialogs/UploadDialog'));
const PreviewDialog = lazy(() => import('../Dialogs/PreviewDialog'));
const ItemMenu = lazy(() => import('../ItemActionsMenu'));
const ItemMegaMenu = lazy(() => import('../ItemMegaMenu'));
const AuthMonitor = lazy(() => import('../SystemStatus/AuthMonitor'));
const PublishingStatusDialog = lazy(() => import('../PublishingStatusDialog'));

// @formatter:off
function createCallback(action: StandardAction, dispatch: Dispatch): (output?: unknown) => void {
  // prettier-ignore
  return action ? (output: any) => {
    const hasPayload = Boolean(action.payload);
    const hasOutput = Boolean(output) && isPlainObject(output);
    const payload = (hasPayload && !hasOutput)
      // If there's a payload in the original action and there
      // is no output from the resulting callback, simply use the
      // original payload
      ? action.payload
      // Otherwise, if there's no payload but there is an output sent
      // to the resulting callback, use the output as the payload
      : (!hasPayload && hasOutput)
        ? output
        : (
          (hasPayload && hasOutput)
            // If there's an output and a payload, merge them both into a single object.
            // We're supposed to be using objects for all our payloads, otherwise this
            // could fail with literal native values such as strings or numbers.
            ? Array.isArray(action.payload)
              // If it's an array, assume is a BATCH_ACTIONS action payload; each item
              // of the array should be an action, so merge each item with output.
              ? action.payload.map((a) => ({ ...a, payload: { ...a.payload, ...output } }))
              // If it's not an array, it's a single action. Merge with output.
              : { ...action.payload, ...output }
            // Later, we check if there's a payload to add it
            : false
        );
    dispatch({
      type: action.type,
      ...(payload ? { payload } : {})
    });
  } : null;
}
// @formatter:on

export const useStyles = makeStyles((theme) =>
  createStyles({
    wrapper: {
      right: '0',
      bottom: '20px',
      display: 'flex',
      position: 'fixed',
      flexDirection: 'row-reverse',
      width: '100%',
      overflow: 'auto',
      padding: '2px 20px',
      zIndex: theme.zIndex.modal,
      pointerEvents: 'none',
      '& > *': {
        pointerEvents: 'all'
      }
    }
  })
);

function GlobalDialogManager() {
  const state = useSelection((state) => state.dialogs);
  const contentTypesBranch = useSelection((state) => state.contentTypes);
  const versionsBranch = useSelection((state) => state.versions);
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();

  useEffect(() => {
    const hostToHost$ = getHostToHostBus();
    const subscription = hostToHost$
      .pipe(filter((e) => e.type === showSystemNotification.type))
      .subscribe(({ payload }) => {
        enqueueSnackbar(payload.message, payload.options);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [enqueueSnackbar]);

  return (
    <Suspense fallback="">
      {/* region Confirm */}
      <ConfirmDialog
        {...state.confirm}
        onOk={createCallback(state.confirm.onOk, dispatch)}
        onCancel={createCallback(state.confirm.onCancel, dispatch)}
        onClose={createCallback(state.confirm.onClose, dispatch)}
        onClosed={createCallback(state.confirm.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Error */}
      <ErrorDialog
        {...state.error}
        onClose={createCallback(state.error.onClose, dispatch)}
        onClosed={createCallback(state.error.onClosed, dispatch)}
        onDismiss={createCallback(state.error.onDismiss, dispatch)}
      />
      {/* endregion */}

      {/* region Edit (LegacyFormDialog) */}
      <LegacyFormDialog
        {...state.edit}
        onClose={createCallback(state.edit.onClose, dispatch)}
        onClosed={createCallback(state.edit.onClosed, dispatch)}
        onDismiss={createCallback(state.edit.onDismiss, dispatch)}
        onSaveSuccess={createCallback(state.edit.onSaveSuccess, dispatch)}
      />
      {/* endregion */}

      {/* region Code Editor */}
      <CodeEditorDialog
        {...state.codeEditor}
        onClose={createCallback(state.codeEditor.onClose, dispatch)}
        onClosed={createCallback(state.codeEditor.onClosed, dispatch)}
        onSuccess={createCallback(state.codeEditor.onSuccess, dispatch)}
      />
      {/* endregion */}

      {/* region Publish */}
      <PublishDialog
        {...state.publish}
        onClose={createCallback(state.publish.onClose, dispatch)}
        onClosed={createCallback(state.publish.onClosed, dispatch)}
        onSuccess={createCallback(state.publish.onSuccess, dispatch)}
        onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
          createCallback(state.publish.onClose, dispatch)
        )}
      />
      {/* endregion */}

      {/* region Create Content */}
      <NewContentDialog
        {...state.newContent}
        onContentTypeSelected={createCallback(state.newContent.onContentTypeSelected, dispatch)}
        onClose={createCallback(state.newContent.onClose, dispatch)}
        onClosed={createCallback(state.newContent.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Change ContentType */}
      <ChangeContentTypeDialog
        {...state.changeContentType}
        onContentTypeSelected={createCallback(state.changeContentType.onContentTypeSelected, dispatch)}
        onClose={createCallback(state.changeContentType.onClose, dispatch)}
        onClosed={createCallback(state.changeContentType.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Dependencies */}
      <DependenciesDialog
        {...state.dependencies}
        onClose={createCallback(state.dependencies.onClose, dispatch)}
        onClosed={createCallback(state.dependencies.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Delete */}
      <DeleteDialog
        {...state.delete}
        onClose={createCallback(state.delete.onClose, dispatch)}
        onClosed={createCallback(state.delete.onClosed, dispatch)}
        onSuccess={createCallback(state.delete.onSuccess, dispatch)}
        onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
          createCallback(state.delete.onClose, dispatch)
        )}
      />
      {/* endregion */}

      {/* region History */}
      <HistoryDialog
        {...state.history}
        versionsBranch={versionsBranch}
        onClose={createCallback(state.history.onClose, dispatch)}
        onClosed={createCallback(state.history.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region View Versions */}
      <ViewVersionDialog
        {...state.viewVersion}
        rightActions={state.viewVersion.rightActions?.map((action) => ({
          ...action,
          onClick: createCallback(action.onClick, dispatch)
        }))}
        leftActions={state.viewVersion.leftActions?.map((action) => ({
          ...action,
          onClick: createCallback(action.onClick, dispatch)
        }))}
        contentTypesBranch={contentTypesBranch}
        onClose={createCallback(state.viewVersion.onClose, dispatch)}
        onClosed={createCallback(state.viewVersion.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Compare Versions */}
      <CompareVersionsDialog
        {...state.compareVersions}
        rightActions={state.compareVersions.rightActions?.map((action) => ({
          ...action,
          onClick: createCallback(action.onClick, dispatch)
        }))}
        contentTypesBranch={contentTypesBranch}
        selectedA={versionsBranch?.selected[0] ? versionsBranch.byId[versionsBranch.selected[0]] : null}
        selectedB={versionsBranch?.selected[1] ? versionsBranch.byId[versionsBranch.selected[1]] : null}
        versionsBranch={versionsBranch}
        onClose={createCallback(state.compareVersions.onClose, dispatch)}
        onClosed={createCallback(state.compareVersions.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Auth Monitor */}
      <AuthMonitor />
      {/* endregion */}

      {/* region Workflow Cancellation */}
      <WorkflowCancellationDialog
        {...state.workflowCancellation}
        onClose={createCallback(state.workflowCancellation.onClose, dispatch)}
        onClosed={createCallback(state.workflowCancellation.onClosed, dispatch)}
        onContinue={createCallback(state.workflowCancellation.onContinue, dispatch)}
      />
      {/* endregion */}

      {/* region Reject */}
      <RejectDialog
        open={state.reject.open}
        items={state.reject.items}
        onClose={createCallback(state.reject.onClose, dispatch)}
        onClosed={createCallback(state.reject.onClosed, dispatch)}
        onDismiss={createCallback(state.reject.onDismiss, dispatch)}
        onRejectSuccess={createCallback(state.reject.onRejectSuccess, dispatch)}
      />
      {/* endregion */}

      {/* region Create Folder */}
      <CreateFolderDialog
        {...state.createFolder}
        onClose={createCallback(state.createFolder.onClose, dispatch)}
        onClosed={createCallback(state.createFolder.onClosed, dispatch)}
        onCreated={createCallback(state.createFolder.onCreated, dispatch)}
        onRenamed={createCallback(state.createFolder.onRenamed, dispatch)}
        onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
          createCallback(state.createFolder.onClose, dispatch)
        )}
      />
      {/* endregion */}

      {/* region Create File */}
      <CreateFileDialog
        open={state.createFile.open}
        path={state.createFile.path}
        type={state.createFile.type}
        allowBraces={state.createFile.allowBraces}
        onClose={createCallback(state.createFile.onClose, dispatch)}
        onClosed={createCallback(state.createFile.onClosed, dispatch)}
        onCreated={createCallback(state.createFile.onCreated, dispatch)}
      />
      {/* endregion */}

      {/* region Create Folder */}
      <CopyItemsDialog
        open={state.copy.open}
        title={state.copy.title}
        subtitle={state.copy.subtitle}
        item={state.copy.item}
        onClose={createCallback(state.copy.onClose, dispatch)}
        onClosed={createCallback(state.copy.onClosed, dispatch)}
        onOk={createCallback(state.copy.onOk, dispatch)}
      />
      {/* endregion */}

      {/* region Bulk Upload */}
      <BulkUploadDialog
        open={state.upload.open}
        path={state.upload.path}
        site={state.upload.site}
        maxSimultaneousUploads={state.upload.maxSimultaneousUploads}
        onClose={createCallback(state.upload.onClose, dispatch)}
        onClosed={createCallback(state.upload.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region PreviewDialog */}
      <PreviewDialog
        open={state.preview.open}
        url={state.preview.url}
        type={state.preview.type}
        mode={state.preview.mode}
        title={state.preview.title}
        content={state.preview.content}
        subtitle={state.preview.subtitle}
        onClose={createCallback(state.preview.onClose, dispatch)}
        onClosed={createCallback(state.preview.onClosed, dispatch)}
      />
      {/* endregion */}

      {/* region Edit Site */}
      <EditSiteDialog
        open={state.editSite.open}
        site={state.editSite.site}
        onClose={createCallback(state.editSite.onClose, dispatch)}
        onClosed={createCallback(state.editSite.onClosed, dispatch)}
        onDismiss={createCallback(state.editSite.onDismiss, dispatch)}
        onSaveSuccess={createCallback(state.editSite.onSaveSuccess, dispatch)}
      />
      {/* endregion */}

      {/* region Path Selection */}
      <PathSelectionDialog
        open={state.pathSelection.open}
        rootPath={state.pathSelection.rootPath}
        initialPath={state.pathSelection.initialPath}
        showCreateFolderOption={state.pathSelection.showCreateFolderOption}
        title={state.pathSelection.title}
        onClose={createCallback(state.pathSelection.onClose, dispatch)}
        onClosed={createCallback(state.pathSelection.onClosed, dispatch)}
        onOk={createCallback(state.pathSelection.onOk, dispatch)}
      />
      {/* endregion */}

      {/* region Item Menu */}
      <ItemMenu
        open={state.itemMenu.open}
        path={state.itemMenu.path}
        numOfLoaderItems={state.itemMenu.numOfLoaderItems}
        onClose={createCallback(state.itemMenu.onClose, dispatch)}
        anchorReference={state.itemMenu.anchorReference}
        anchorPosition={state.itemMenu.anchorPosition}
      />
      {/* endregion */}

      {/* region Item Mega Menu */}
      <ItemMegaMenu
        open={state.itemMegaMenu.open}
        path={state.itemMegaMenu.path}
        numOfLoaderItems={state.itemMegaMenu.numOfLoaderItems}
        onClose={createCallback(state.itemMegaMenu.onClose, dispatch)}
        anchorReference={state.itemMegaMenu.anchorReference}
        anchorPosition={state.itemMegaMenu.anchorPosition}
      />
      {/* endregion */}

      {/* region Launcher */}
      <Launcher {...state.launcher} />
      {/* endregion */}

      {/* region Publishing Status Dialog */}
      <PublishingStatusDialog
        open={state.publishingStatus.open}
        enabled={state.publishingStatus.enabled}
        status={state.publishingStatus.status}
        message={state.publishingStatus.message}
        lockOwner={state.publishingStatus.lockOwner}
        lockTTL={state.publishingStatus.lockTTL}
        isFetching={state.publishingStatus.isFetching}
        onClose={createCallback(state.publishingStatus.onClose, dispatch)}
        onRefresh={createCallback(state.publishingStatus.onRefresh, dispatch)}
        onUnlock={createCallback(state.publishingStatus.onUnlock, dispatch)}
      />
      {/* endregion */}

      {/* region Unlock Publisher Dialog */}
      <UnlockPublisherDialog
        open={state.unlockPublisher.open}
        onError={createCallback(state.unlockPublisher.onError, dispatch)}
        onCancel={createCallback(state.unlockPublisher.onCancel, dispatch)}
        onComplete={createCallback(state.unlockPublisher.onComplete, dispatch)}
      />
      {/* endregion */}

      {/* region Widget Dialog */}
      <WidgetDialog
        id={state.widget.id}
        open={state.widget.open}
        title={state.widget.title}
        widget={state.widget.widget}
        onClose={createCallback(state.widget.onClose, dispatch)}
        onClosed={createCallback(state.widget.onClosed, dispatch)}
      />
      {/* endregion */}
    </Suspense>
  );
}

export default React.memo(GlobalDialogManager);
