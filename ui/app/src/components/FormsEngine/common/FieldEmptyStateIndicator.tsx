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

import Tooltip from '@mui/material/Tooltip';
import { FormattedMessage } from 'react-intl';
import CheckRounded from '@mui/icons-material/CheckRounded';
import React from 'react';

export function FieldEmptyStateIndicator({ isEmpty }: { isEmpty: boolean }) {
	return isEmpty ? undefined : (
		<Tooltip title={<FormattedMessage defaultMessage="Complete" />}>
			<CheckRounded fontSize="small" color="success" />
		</Tooltip>
	);
}

export default FieldEmptyStateIndicator;
