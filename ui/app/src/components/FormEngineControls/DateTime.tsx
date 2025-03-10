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
import DateTimeTimezonePicker from '../DateTimeTimezonePicker/DateTimeTimezonePicker';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { DateTimeControl } from '../../models/FormsEngine';
import GlobalState from '../../models/GlobalState';
import commonStyles from './styles';
import { useSelection } from '../../hooks/useSelection';

export function DateTime(props: DateTimeControl) {
	const { field, value, onChange, disabled } = props;
	const locale = useSelection<GlobalState['uiConfig']['locale']>((state) => state.uiConfig.locale);

	return (
		<FormControl variant="outlined" sx={commonStyles.formControl} fullWidth>
			<InputLabel sx={{ position: 'relative', transform: 'none', ...commonStyles.inputLabel }} htmlFor={field.id}>
				{field.name}
			</InputLabel>
			<DateTimeTimezonePicker
				id={field.id}
				value={value}
				onChange={onChange}
				disabled={disabled}
				localeCode={locale.localeCode}
				dateTimeFormatOptions={locale.dateTimeFormatOptions}
			/>
		</FormControl>
	);
}

export default DateTime;
