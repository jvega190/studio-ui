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
import { ReactNode, useMemo, useRef } from 'react';
import { useOnClose } from '../../hooks/useOnClose';
import MuiDialog, { DialogProps as MuiDialogProps } from '@mui/material/Dialog';
import { useUnmount } from '../../hooks/useUnmount';
import DialogHeader, { DialogHeaderProps } from '../DialogHeader';
import MinimizedBar from '../MinimizedBar';
import { EnhancedDialogState, onSubmittingAndOrPendingChangeProps } from '../../hooks/useEnhancedDialogState';
import { EnhancedDialogContext, EnhancedDialogContextProps } from './useEnhancedDialogContext';
import Suspencified from '../Suspencified';
import useUpdateRefs from '../../hooks/useUpdateRefs';

export interface EnhancedDialogProps extends Omit<MuiDialogProps, 'title'>, EnhancedDialogState {
	title?: ReactNode;
	subtitle?: ReactNode;
	onMinimize?(): void;
	onMaximize?(): void;
	onClosed?(): void;
	onFullScreen?(): void;
	onCancelFullScreen?(): void;
	onWithPendingChangesCloseRequest?: MuiDialogProps['onClose'];
	updateSubmittingOrHasPendingChanges?(changes: onSubmittingAndOrPendingChangeProps): void;
	omitHeader?: boolean;
	dialogHeaderProps?: Partial<DialogHeaderProps>;
}

export function EnhancedDialog(props: EnhancedDialogProps) {
	// region const { ... } = props
	const {
		id,
		open,
		isSubmitting = false,
		hasPendingChanges = false,
		isMinimized = false,
		isFullScreen = false,
		title,
		subtitle,
		onClosed,
		onMinimize,
		onMaximize,
		onWithPendingChangesCloseRequest,
		updateSubmittingOrHasPendingChanges,
		children,
		dialogHeaderProps,
		omitHeader = false,
		onFullScreen,
		onCancelFullScreen,
		...dialogProps
	} = props;
	// endregion
	const onClose = useOnClose({
		onClose(e, reason) {
			if (hasPendingChanges) {
				onWithPendingChangesCloseRequest?.(e, reason);
			} else if (!isSubmitting) {
				dialogProps.onClose?.(e, reason);
			}
		},
		disableBackdropClick: isSubmitting,
		disableEscapeKeyDown: isSubmitting
	});
	const callbackRefs = useUpdateRefs({ onClose, updateSubmittingOrHasPendingChanges });
	const stableRefs = useRef({
		// When context is recreated, `stableRefs` remain stable and won't trigger
		// effects or have closure issues on the consumer components.
		onClose(e, reason) {
			callbackRefs.current.onClose?.(e, reason);
		},
		updateSubmittingOrHasPendingChanges(changes: onSubmittingAndOrPendingChangeProps) {
			callbackRefs.current.updateSubmittingOrHasPendingChanges?.(changes);
		}
	});
	const context = useMemo<EnhancedDialogContextProps>(
		() => ({
			open,
			isMinimized,
			isFullScreen,
			isSubmitting,
			hasPendingChanges,
			onClose: stableRefs.current.onClose,
			updateSubmittingOrHasPendingChanges: stableRefs.current.updateSubmittingOrHasPendingChanges
		}),
		[hasPendingChanges, isFullScreen, isMinimized, isSubmitting, open]
	);
	return (
		<EnhancedDialogContext.Provider value={context}>
			<MuiDialog
				open={open && !isMinimized}
				keepMounted={isMinimized}
				fullWidth
				maxWidth="md"
				fullScreen={isFullScreen}
				{...dialogProps}
				onClose={onClose}
			>
				{!omitHeader && (
					<DialogHeader
						{...dialogHeaderProps}
						title={title ?? dialogHeaderProps?.title}
						subtitle={subtitle ?? dialogHeaderProps?.subtitle}
						disabled={isSubmitting}
						onMinimizeButtonClick={onMinimize}
						onFullScreenButtonClick={isFullScreen ? onCancelFullScreen : onFullScreen}
						onCloseButtonClick={(e) => onClose(e, null)}
					/>
				)}
				<Suspencified>
					{React.Children.map(children, (child) =>
						React.cloneElement(
							child as React.ReactElement<{ onClose(event, reason: 'backdropClick' | 'escapeKeyDown'): void }>,
							{ onClose }
						)
					)}
				</Suspencified>
				<OnClosedInvoker onClosed={onClosed} />
			</MuiDialog>
			<MinimizedBar open={isMinimized} onMaximize={onMaximize} title={title} />
		</EnhancedDialogContext.Provider>
	);
}

export default EnhancedDialog;

function OnClosedInvoker({ onClosed }: { onClosed }) {
	useUnmount(onClosed);
	return null as JSX.Element;
}
