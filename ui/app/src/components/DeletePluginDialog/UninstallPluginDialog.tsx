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
import { FormattedMessage } from 'react-intl';
import { UninstallPluginDialogProps } from './utils';
import EnhancedDialog from '../EnhancedDialog';
import { UninstallPluginDialogContainer } from './UninstallPluginDialogContainer';

function UninstallPluginDialog(props: UninstallPluginDialogProps) {
	const { pluginId, onSubmittingAndOrPendingChange, isSubmitting, onComplete, ...rest } = props;
	return (
		<EnhancedDialog
			title={<FormattedMessage id="uninstallPluginDialog.headerTitle" defaultMessage="Uninstall Plugin" />}
			dialogHeaderProps={{
				subtitle: (
					<FormattedMessage
						id="uninstallPluginDialog.headerSubtitle"
						defaultMessage={`Please confirm the uninstalling of "{pluginId}"`}
						values={{ pluginId: pluginId }}
					/>
				)
			}}
			isSubmitting={isSubmitting}
			{...rest}
		>
			<UninstallPluginDialogContainer
				pluginId={pluginId}
				isSubmitting={isSubmitting}
				onSubmittingAndOrPendingChange={onSubmittingAndOrPendingChange}
				onComplete={onComplete}
			/>
		</EnhancedDialog>
	);
}

export default UninstallPluginDialog;
