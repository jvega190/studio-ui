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

import React from 'react';
import { KeyboardShortcutsDialogProps } from './utils';
import EnhancedDialog from '../EnhancedDialog';
import { FormattedMessage, useIntl } from 'react-intl';
import DialogBody from '../DialogBody/DialogBody';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { getPossibleTranslation } from '../../utils/i18n';

export function KeyboardShortcutsDialog(props: KeyboardShortcutsDialogProps) {
	const { shortcuts, sxs, ...rest } = props;
	const { formatMessage } = useIntl();
	return (
		<EnhancedDialog
			title={<FormattedMessage id="keyboardShortcutsDialog.title" defaultMessage="Keyboard Shortcuts" />}
			maxWidth="sm"
			{...rest}
		>
			<DialogBody>
				{shortcuts.map((category, index) => (
					<Card key={index}>
						<CardContent>
							<Typography
								variant="subtitle1"
								gutterBottom
								sx={{
									fontSize: '1.25rem',
									...sxs?.categoryTitle
								}}
							>
								{getPossibleTranslation(category.label, formatMessage)}
							</Typography>

							<List
								sx={{
									padding: 0,
									...sxs?.shortcutsList
								}}
							>
								{category.shortcuts.map(({ label, shortcut }, index) => (
									<ListItem
										key={index}
										secondaryAction={
											<Chip
												label={shortcut}
												sx={{
													fontFamily: 'monospace',
													borderRadius: '8px',
													...sxs?.shortcutChip
												}}
											/>
										}
										divider
									>
										<ListItemText primary={getPossibleTranslation(label, formatMessage)} />
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				))}
			</DialogBody>
		</EnhancedDialog>
	);
}

export default KeyboardShortcutsDialog;
