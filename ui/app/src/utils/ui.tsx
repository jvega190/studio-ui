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

import type { Dispatch as ReduxDispatch } from 'redux';
import { FormattedMessage } from 'react-intl';
import { nanoid } from 'nanoid';
import { popDialog, pushDialog } from '../state/actions/dialogStack';
import type { ConfirmDialogProps } from '../components';

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
