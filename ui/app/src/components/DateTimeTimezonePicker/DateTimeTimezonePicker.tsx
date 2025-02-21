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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Moment } from 'moment-timezone';
import moment from 'moment-timezone';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TextField from '@mui/material/TextField';
import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import useLocale from '../../hooks/useLocale';
import { UsePickerValueBaseProps } from '@mui/x-date-pickers/internals/hooks/usePicker/usePickerValue.types';
import useUpdateRefs from '../../hooks/useUpdateRefs';
import { DateTimeValidationError } from '@mui/x-date-pickers';
import {
	createAtLeastHalfHourInFutureDate,
	createTransposedToTimezoneDate,
	getZDateOffset
} from '../../utils/datetime';

export interface DateTimeTimezonePickerProps {
	id?: string;
	value: string | Date | number;
	disabled?: boolean;
	disablePast?: boolean;
	localeCode?: string;
	dateTimeFormatOptions?: Intl.DateTimeFormatOptions;
	onError?: DateTimePickerProps<Moment, true>['onError'];
	onChange?(date: Date): void;
}

export function DateTimeTimezonePicker(props: DateTimeTimezonePickerProps) {
	const locale = useLocale();
	const resolvedLocaleData = useMemo(() => Intl.DateTimeFormat().resolvedOptions(), []);
	const {
		id,
		value: dateProp,
		disabled = false,
		disablePast = false,
		localeCode = locale.localeCode || 'en-US',
		dateTimeFormatOptions = locale.dateTimeFormatOptions ?? resolvedLocaleData,
		onChange,
		onError
	} = props;
	const hour12 = dateTimeFormatOptions?.hour12;
	const timeZones = useMemo(() => moment.tz.names(), []);
	const [selectedDate, setSelectedDate] = useState<Moment>(null);
	const [selectedTimezone, setSelectedTimezone] = useState<string>(resolvedLocaleData.timeZone ?? null);
	// The control timezone lags behind selectedTimezone. It is only updated when there's a different
	// selectedTimezone to the navigator's locale, and the value (date) prop changes.
	const [controlTimezone, setControlTimezone] = useState<string>(resolvedLocaleData.timeZone ?? null);
	const mountedRef = useRef(false);
	const effectRefs = useUpdateRefs({
		dateProp,
		selectedDate,
		selectedTimezone,
		controlTimezone,
		disablePast,
		onChange
	});
	const handleChange = ((newValue) => {
		setSelectedDate(newValue);
		if (newValue.toISOString() !== moment(effectRefs.current.dateProp).toISOString()) {
			effectRefs.current.onChange?.(createTransposedToTimezoneDate(newValue, selectedTimezone));
		}
	}) as UsePickerValueBaseProps<Moment, DateTimeValidationError>['onChange'];
	const handleTimezoneChange = ((event, value) => {
		event.preventDefault();
		event.stopPropagation();
		setSelectedTimezone(value);
	}) as AutocompleteProps<string, false, true, boolean>['onChange'];
	useEffect(() => {
		if (!dateProp) {
			mountedRef.current = true;
			// Date is nullish; clear the field.
			setSelectedDate(null);
		} else if (disablePast && dateProp <= new Date()) {
			mountedRef.current = true;
			const future = createAtLeastHalfHourInFutureDate();
			setSelectedDate(moment(future));
			effectRefs.current.onChange?.(future);
		} else if (mountedRef.current) {
			const { selectedTimezone, controlTimezone, selectedDate } = effectRefs.current;
			if (moment(dateProp).toISOString() === selectedDate.toISOString()) {
				// Skip if dateProp is the same as the selected date.
				return;
			}
			// Not the first render; dateProp changed, update the date.
			let nextDate: Moment;
			if (selectedTimezone !== controlTimezone) {
				// The date prop converted to a date is always in the user's browser locale. If the selected timezone (offset) is different from the
				// user's timezone, we need to convert the date to the selected timezone to keep the internal and external date in sync.
				const dateMoment = moment(dateProp).tz(selectedTimezone);
				nextDate = dateMoment;
				setControlTimezone(selectedTimezone);
			} else {
				nextDate = dateProp ? moment(dateProp) : null;
			}
			setSelectedDate(nextDate);
		} else {
			// First render; set the initial date.
			mountedRef.current = true;
			setSelectedDate(dateProp ? moment(dateProp) : null);
		}
	}, [disablePast, dateProp, effectRefs]);
	useEffect(() => {
		const { selectedDate } = effectRefs.current;
		if (mountedRef.current && selectedDate) {
			const date = createTransposedToTimezoneDate(selectedDate, selectedTimezone);
			if (date.toISOString() !== moment(effectRefs.current.dateProp).toISOString()) {
				effectRefs.current.onChange?.(date);
			}
		}
	}, [effectRefs, selectedTimezone]);
	return (
		<FormControl id={id} fullWidth>
			<LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={localeCode}>
				<DateTimePicker
					sx={{ mt: 1 }}
					ampm={hour12}
					value={selectedDate}
					onChange={handleChange}
					disablePast={disablePast}
					disabled={disabled}
					onError={onError}
					slotProps={{ textField: { size: 'small' } }}
					// Not using the timezone prop since it would cause the date to get adjusted to that timezone.
					// The idea of this control is to keep the date/time value stable as you pick timezones and only
					// reflect the actual value change externally; but for the user, the date doesn't move around if
					// he/she did not manually change it.
					// timezone={selectedTimezone}
					timezone={controlTimezone}
				/>
				<Autocomplete
					options={timeZones}
					disabled={disabled}
					getOptionLabel={(timezone) =>
						timezone + (selectedDate ? ` (GMT${getZDateOffset(selectedDate, timezone)})` : '')
					}
					value={selectedTimezone}
					onChange={handleTimezoneChange}
					popupIcon={<PublicRoundedIcon />}
					disableClearable={true}
					renderInput={(params) => <TextField {...params} size="small" variant="outlined" fullWidth />}
					sx={{ my: 1 }}
				/>
			</LocalizationProvider>
		</FormControl>
	);
}

export default DateTimeTimezonePicker;
