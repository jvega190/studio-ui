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

import React, { ElementType, lazy, Suspense, useEffect, useMemo } from 'react';
import StandardAction from '../../models/StandardAction';
import { Dispatch, Dispatch as ReduxDispatch } from 'redux';
import { useDispatch } from 'react-redux';
import { isPlainObject } from '../../utils/object';
import { SnackbarKey, useSnackbar } from 'notistack';
import { getHostToHostBus } from '../../utils/subjects';
import { blockUI, newProjectReady, showSystemNotification, unblockUI } from '../../state/actions/system';
import Launcher from '../Launcher/Launcher';
import useSelection from '../../hooks/useSelection';
import { useWithPendingChangesCloseRequest } from '../../hooks/useWithPendingChangesCloseRequest';
import MinimizedBar from '../MinimizedBar';
import { RenameAssetDialog } from '../RenameAssetDialog';
import { FormattedMessage, useIntl } from 'react-intl';
import Button from '@mui/material/Button';
import { getSystemLink } from '../../utils/system';
import useEnv from '../../hooks/useEnv';
import { filter, map, switchMap } from 'rxjs/operators';
import { ProjectLifecycleEvent } from '../../models/ProjectLifecycleEvent';
import { fetchAll as fetchSitesService } from '../../services/sites';
import IconButton from '@mui/material/IconButton';
import CloseRounded from '@mui/icons-material/CloseRounded';
import useAuth from '../../hooks/useAuth';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { components } from '../../utils/constants';
import { EnhancedDialogProps } from '../EnhancedDialog';
import { DialogStackItem } from '../../models/GlobalState';
import { nanoid } from 'nanoid';
import { ConfirmDialogProps } from '../ConfirmDialog';
import { popDialog, pushDialog, updateDialogState } from '../../state/actions/dialogStack';
import AlertDialog from '../AlertDialog/AlertDialog';
import PrimaryButton from '../PrimaryButton';
import infoImgUrl from '../../assets/information.svg';

// region const ... = lazy(() => import('...'));
const ViewVersionDialog = lazy(() => import('../ViewVersionDialog'));
const CompareVersionsDialog = lazy(() => import('../CompareVersionsDialog'));
const EditSiteDialog = lazy(() => import('../EditSiteDialog'));
const ErrorDialog = lazy(() => import('../ErrorDialog'));
const HistoryDialog = lazy(() => import('../HistoryDialog'));
const DeleteDialog = lazy(() => import('../DeleteDialog'));
const LegacyFormDialog = lazy(() => import('../LegacyFormDialog'));
const ItemMenu = lazy(() => import('../ItemActionsMenu'));
const ItemMegaMenu = lazy(() => import('../ItemMegaMenu'));
const AuthMonitor = lazy(() => import('../AuthMonitor'));
const UIBlocker = lazy(() => import('../UIBlocker'));
const CodeEditorDialog = lazy(() => import('../CodeEditorDialog'));
const BrokenReferencesDialog = lazy(() => import('../BrokenReferencesDialog'));
const PublishingPackageReviewDialog = lazy(() => import('../PublishPackageReviewDialog/PublishingPackageReviewDialog'));
const PublishingPackageResubmitDialog = lazy(() => import('../PublishingPackageResubmitDialog'));
const CancelPackageDialog = lazy(() => import('../CancelPackageDialog'));
const BulkCancelPackageDialog = lazy(() => import('../BulkCancelPackageDialog'));
const PackageDetailsDialog = lazy(() => import('../PackageDetailsDialog'));
const ViewPackagesDialog = lazy(() => import('../ViewPackagesDialog'));
// endregion

// @formatter:off
export function createCallback(action: StandardAction, dispatch: Dispatch): (output?: unknown) => void {
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

// FE2 TODO: Find a better place for this
export const displayWithPendingChangesConfirm = (
  dispatch: ReduxDispatch,
  onClose: () => void,
  message = <FormattedMessage defaultMessage="Close without saving changes?" />
) => {
  const id = nanoid();
  dispatch(
    pushDialog({
      id,
      component: 'craftercms.components.ConfirmDialog',
      props: {
        title: message,
        onOk() {
          dispatch(popDialog({ id }));
          onClose();
        },
        onCancel() {
          dispatch(popDialog({ id }));
        }
      } as ConfirmDialogProps
    })
  );
};

function DialogStackItemContainer(props: DialogStackItem<EnhancedDialogProps>) {
  const { id, component, allowMinimize = false, allowFullScreen = false } = props;
  const dispatch = useDispatch();
  const Dialog = useMemo(() => {
    if (typeof component === 'string') {
      if (components.has(component)) {
        return components.get(component);
      } else {
        return (props: EnhancedDialogProps) => (
          <AlertDialog
            open={props.open}
            body={`Unknown component id "${component}". The component is not registered or the id is incorrect.`}
            imageUrl={infoImgUrl}
            buttons={
              <PrimaryButton fullWidth onClick={(e) => props.onClose(e, undefined)}>
                <FormattedMessage defaultMessage="Accept" />
              </PrimaryButton>
            }
          />
        );
      }
    } else {
      return component as ElementType<EnhancedDialogProps>;
    }
  }, [component]);
  const onClose: EnhancedDialogProps['onClose'] = () => {
    dispatch(updateDialogState({ id, props: { open: false } }));
  };
  const onMaximize: EnhancedDialogProps['onMaximize'] = allowMinimize
    ? () => {
        dispatch(updateDialogState({ id, props: { isMinimized: false } }));
      }
    : undefined;
  const onMinimize: EnhancedDialogProps['onMinimize'] = allowMinimize
    ? () => {
        dispatch(updateDialogState({ id, props: { isMinimized: true } }));
      }
    : undefined;
  const onFullScreen: EnhancedDialogProps['onFullScreen'] = allowFullScreen
    ? () => {
        dispatch(updateDialogState({ id, props: { isFullScreen: true } }));
      }
    : undefined;
  const onCancelFullScreen: EnhancedDialogProps['onCancelFullScreen'] = allowFullScreen
    ? () => {
        dispatch(updateDialogState({ id, props: { isFullScreen: false } }));
      }
    : undefined;
  // TODO: Review type discrepancy
  // @ts-expect-error: Discrepancy in types (EnhancedDialogProps['onTransitionExited'] !== props.props.onTransitionEnd).
  const onTransitionExited: EnhancedDialogProps['onTransitionExited'] = (e) => {
    props.props.onTransitionEnd?.(e);
    if (!props.props.open && !props.props.keepMounted) {
      dispatch(popDialog({ id }));
    }
  };
  const onWithPendingChangesCloseRequest: EnhancedDialogProps['onWithPendingChangesCloseRequest'] = (e, reason) => {
    displayWithPendingChangesConfirm(dispatch, () => onClose(e, reason));
  };
  const updateSubmittingOrHasPendingChanges = (changes: { isSubmitting?: boolean; hasPendingChanges?: boolean }) => {
    dispatch(
      updateDialogState({
        id,
        props: {
          isSubmitting: changes.isSubmitting ?? props.props.isSubmitting,
          hasPendingChanges: changes.hasPendingChanges ?? props.props.hasPendingChanges
        } as Partial<EnhancedDialogProps>
      })
    );
  };
  return (
    <Dialog
      {...props.props}
      onClose={onClose}
      onMaximize={onMaximize}
      onMinimize={onMinimize}
      onFullScreen={onFullScreen}
      onCancelFullScreen={onCancelFullScreen}
      onTransitionExited={onTransitionExited}
      updateSubmittingOrHasPendingChanges={updateSubmittingOrHasPendingChanges}
      onWithPendingChangesCloseRequest={onWithPendingChangesCloseRequest}
    />
  );
}

function GlobalDialogManager() {
  const state = useSelection((state) => state.dialogs);
  const stack = useSelection((state) => state.dialogStack);
  const contentTypesBranch = useSelection((state) => state.contentTypes);
  const versionsBranch = useSelection((state) => state.versions);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { authoringBase, socketConnected } = useEnv();
  const { active: authActive } = useAuth();
  const activeSiteId = useActiveSiteId();
  const { formatMessage } = useIntl();

  useEffect(() => {
    const hostToHost$ = getHostToHostBus();
    const subscription = hostToHost$.subscribe(({ type, payload }) => {
      switch (type) {
        case showSystemNotification.type:
          enqueueSnackbar(payload.message, payload.options);
          break;
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    const subscription = getHostToHostBus()
      .pipe(
        filter((e: StandardAction<ProjectLifecycleEvent>) => e.type === newProjectReady.type),
        switchMap((e) =>
          // Not the most efficient approach to (re)fetch all sites (which already occurs when a new site is created), but it's not possible to
          // look site by uuid or to sync this even with the completion of the background fetch of the sites.
          fetchSitesService().pipe(
            map((sites) => sites.find((site) => site.uuid === e.payload.siteUuid)),
            filter((site) => Boolean(site))
          )
        )
      )
      .subscribe((site) => {
        if (!document.querySelector('[data-dialog-id="create-site-dialog"]')) {
          const siteId = site.id;
          enqueueSnackbar(
            <FormattedMessage defaultMessage={`Project "{siteId}" has been created.`} values={{ siteId }} />,
            {
              action: (
                <Button
                  size="small"
                  onClick={() => {
                    window.location.href = getSystemLink({
                      systemLinkId: 'preview',
                      authoringBase,
                      site: siteId,
                      page: '/'
                    });
                  }}
                >
                  <FormattedMessage id="words.view" defaultMessage="View" />
                </Button>
              )
            }
          );
        }
      });
    return () => subscription.unsubscribe();
  }, [authoringBase, enqueueSnackbar]);

  useEffect(() => {
    const isIframe = window.location !== window.parent.location;
    if (!isIframe && authActive && !socketConnected && activeSiteId !== null) {
      let key: SnackbarKey;
      const timeout = setTimeout(() => {
        fetch(`${authoringBase}/help/socket-connection-error`)
          .then((r) => {
            if (r.ok) {
              return r.text();
            } else {
              throw new Error('socket-connection-error fetch failed');
            }
          })
          .then(() => {
            key = enqueueSnackbar(<FormattedMessage defaultMessage="Studio will continue to retry the connection." />, {
              variant: 'warning',
              persist: true,
              anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
              alertTitle: <FormattedMessage defaultMessage="Connection with the server interrupted" />,
              action: (key) => (
                <>
                  <Button
                    href={`${authoringBase}/help/socket-connection-error`}
                    target="_blank"
                    size="small"
                    color="inherit"
                  >
                    <FormattedMessage defaultMessage="Learn more" />
                  </Button>
                  <IconButton size="small" color="inherit" onClick={() => closeSnackbar(key)}>
                    <CloseRounded />
                  </IconButton>
                </>
              )
            });
          })
          .catch(() => {
            dispatch(
              blockUI({
                title: formatMessage({ defaultMessage: 'Connection with the server interrupted' }),
                message: formatMessage({
                  defaultMessage:
                    'Studio servers might be down, being restarted or your network connection dropped. Check your connection or ask the administrator to validate server status.'
                })
              })
            );
          });
      }, 5000);
      return () => {
        clearTimeout(timeout);
        if (key) {
          closeSnackbar(key);
        } else {
          dispatch(unblockUI());
        }
      };
    }
  }, [
    authoringBase,
    authActive,
    closeSnackbar,
    enqueueSnackbar,
    socketConnected,
    dispatch,
    formatMessage,
    activeSiteId
  ]);

  return (
    <>
      {stack.ids.map((id) => (
        <Suspense key={id} fallback={<UIBlocker open />}>
          <DialogStackItemContainer {...(stack.byId[id] as DialogStackItem<EnhancedDialogProps>)} />
        </Suspense>
      ))}
      <Suspense fallback="">
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
          onMinimize={createCallback(state.edit.onMinimize, dispatch)}
          onMaximize={createCallback(state.edit.onMaximize, dispatch)}
          onClosed={createCallback(state.edit.onClosed, dispatch)}
          onSaveSuccess={createCallback(state.edit.onSaveSuccess, dispatch)}
        />
        {/* endregion */}

        {/* region Code Editor */}
        <CodeEditorDialog
          {...state.codeEditor}
          onClose={createCallback(state.codeEditor.onClose, dispatch)}
          onMinimize={createCallback(state.codeEditor.onMinimize, dispatch)}
          onMaximize={createCallback(state.codeEditor.onMaximize, dispatch)}
          onClosed={createCallback(state.codeEditor.onClosed, dispatch)}
          onSuccess={createCallback(state.codeEditor.onSuccess, dispatch)}
          onFullScreen={createCallback(state.codeEditor.onFullScreen, dispatch)}
          onCancelFullScreen={createCallback(state.codeEditor.onCancelFullScreen, dispatch)}
          onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
            createCallback(state.codeEditor.onClose, dispatch)
          )}
        />
        {/* endregion */}

        {/* region Package Review */}
        <PublishingPackageReviewDialog
          {...state.publishingPackageApproval}
          onClose={createCallback(state.publishingPackageApproval.onClose, dispatch)}
          onClosed={createCallback(state.publishingPackageApproval.onClosed, dispatch)}
          onSuccess={createCallback(state.publishingPackageApproval.onSuccess, dispatch)}
          onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
            createCallback(state.publishingPackageApproval.onClose, dispatch)
          )}
        />
        {/* endregion */}

        {/* region Package Resubmit */}
        <PublishingPackageResubmitDialog
          {...state.publishingPackageResubmit}
          onClose={createCallback(state.publishingPackageResubmit.onClose, dispatch)}
          onClosed={createCallback(state.publishingPackageResubmit.onClosed, dispatch)}
          onSuccess={createCallback(state.publishingPackageResubmit.onSuccess, dispatch)}
          onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
            createCallback(state.publishingPackageResubmit.onClose, dispatch)
          )}
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

        {/* TODO: not used anymore (?) */}
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
          leftActions={state.compareVersions.leftActions?.map((action) => ({
            ...action,
            onClick: createCallback(action.onClick, dispatch)
          }))}
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

        {/*  region Broken References */}
        <BrokenReferencesDialog
          {...state.brokenReferences}
          onClose={createCallback(state.brokenReferences.onClose, dispatch)}
          onClosed={createCallback(state.brokenReferences.onClosed, dispatch)}
          onContinue={createCallback(state.brokenReferences.onContinue, dispatch)}
        />
        {/* endregion */}

        {/* region Rename Asset */}
        <RenameAssetDialog
          {...state.renameAsset}
          onClose={createCallback(state.renameAsset.onClose, dispatch)}
          onClosed={createCallback(state.renameAsset.onClosed, dispatch)}
          onRenamed={createCallback(state.renameAsset.onRenamed, dispatch)}
          onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
            createCallback(state.renameAsset.onClose, dispatch)
          )}
        />
        {/* endregion */}

        {/* region Edit Site */}
        <EditSiteDialog
          {...state.editSite}
          onClose={createCallback(state.editSite.onClose, dispatch)}
          onClosed={createCallback(state.editSite.onClosed, dispatch)}
          onSaveSuccess={createCallback(state.editSite.onSaveSuccess, dispatch)}
          onSiteImageChange={createCallback(state.editSite.onSiteImageChange, dispatch)}
          onWithPendingChangesCloseRequest={useWithPendingChangesCloseRequest(
            createCallback(state.editSite.onClose, dispatch)
          )}
        />
        {/* endregion */}

        {/* region Item Menu */}
        <ItemMenu {...state.itemMenu} onClose={createCallback(state.itemMenu.onClose, dispatch)} />
        {/* endregion */}

        {/* region Item Mega Menu */}
        <ItemMegaMenu
          {...state.itemMegaMenu}
          onClose={createCallback(state.itemMegaMenu.onClose, dispatch)}
          onClosed={createCallback(state.itemMegaMenu.onClosed, dispatch)}
        />
        {/* endregion */}

        {/* region Launcher */}
        <Launcher {...state.launcher} />
        {/* endregion */}

        {/* region Publishing Status Dialog */}
        {/* <PublishingStatusDialog
          {...state.publishingStatus}
          onClose={createCallback(state.publishingStatus.onClose, dispatch)}
          onRefresh={createCallback(state.publishingStatus.onRefresh, dispatch)}
          onUnlock={createCallback(state.publishingStatus.onUnlock, dispatch)}
        />*/}
        {/* endregion */}

        {/* region Minimized Tabs */}
        {Object.values(state.minimizedTabs).map((tab) => (
          <MinimizedBar
            key={tab.id}
            open={tab.minimized}
            title={tab.title}
            subtitle={tab.subtitle}
            status={tab.status}
            onMaximize={createCallback(tab.onMaximized, dispatch)}
          />
        ))}
        {/* endregion */}

        {/* region Cancel Package Dialog */}
        <CancelPackageDialog
          {...state.cancelPackage}
          onClose={createCallback(state.cancelPackage.onClose, dispatch)}
          onClosed={createCallback(state.cancelPackage.onClosed, dispatch)}
          onSuccess={createCallback(state.cancelPackage.onSuccess, dispatch)}
        />
        {/* endregion */}

        {/* region Bulk Cancel Package Dialog */}
        <BulkCancelPackageDialog
          {...state.bulkCancelPackage}
          onClose={createCallback(state.bulkCancelPackage.onClose, dispatch)}
          onClosed={createCallback(state.bulkCancelPackage.onClosed, dispatch)}
          onSuccess={createCallback(state.bulkCancelPackage.onSuccess, dispatch)}
        />
        {/* endregion */}

        {/* region Package Details Dialog */}
        <PackageDetailsDialog
          {...state.packageDetails}
          onClose={createCallback(state.packageDetails.onClose, dispatch)}
          onClosed={createCallback(state.packageDetails.onClosed, dispatch)}
        />
        {/* endregion */}

        {/* region View Packages Dialog */}
        <ViewPackagesDialog
          {...state.viewPackages}
          onClose={createCallback(state.viewPackages.onClose, dispatch)}
          onClosed={createCallback(state.viewPackages.onClosed, dispatch)}
          onContinue={createCallback(state.viewPackages.onContinue, dispatch)}
        />
        {/* endregion */}

        {/* region UIBlocker */}
        <UIBlocker {...state.uiBlocker} />
        {/* endregion */}
      </Suspense>
    </>
  );
}

export default React.memo(GlobalDialogManager);
