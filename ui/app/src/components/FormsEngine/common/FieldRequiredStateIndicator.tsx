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
import Asterisk from '../../../icons/Asterisk';

export function FieldRequiredStateIndicator({ isValid }: { isValid: boolean }) {
	return (
		<Tooltip
			title={isValid ? <FormattedMessage defaultMessage="Complete" /> : <FormattedMessage defaultMessage="Required" />}
		>
			<Asterisk fontSize="small" color={isValid ? 'success' : 'error'} />
			{/* Colour blind mode:
      {isValid ? <CheckRounded fontSize="small" color="success" /> : <Asterisk fontSize="small" color="error" />}
      Could also use CheckCircleRounded to maintain a distinction with non-required fields */}
		</Tooltip>
	);
}

export default FieldRequiredStateIndicator;
