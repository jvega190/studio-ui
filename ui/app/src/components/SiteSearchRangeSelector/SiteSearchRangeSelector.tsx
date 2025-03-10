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

import { LookupTable } from '../../models/LookupTable';
import { Filter as FilterType } from '../../models/Search';
import { defineMessages, useIntl } from 'react-intl';
import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const messages = defineMessages({
	go: {
		id: 'words.go',
		defaultMessage: 'Go'
	},
	min: {
		id: 'words.min',
		defaultMessage: 'Min'
	},
	max: {
		id: 'words.max',
		defaultMessage: 'Max'
	}
});

export interface RangeSelectorProps {
	facet: string;
	checkedFilters: LookupTable;

	handleFilterChange(filter: FilterType, isFilter: boolean): any;
}

export function SiteSearchRangeSelector(props: RangeSelectorProps) {
	const { formatMessage } = useIntl();
	const { facet, handleFilterChange, checkedFilters } = props;
	const [range, setRange] = useState({ min: '', max: '' });

	useEffect(
		function () {
			let minMax = { min: '', max: '' };
			if (checkedFilters && checkedFilters[facet]) {
				let range = checkedFilters[facet].split('TO');
				minMax = {
					min: range[0],
					max: range[1]
				};
			}
			setRange(minMax);
		},
		[checkedFilters, facet]
	);

	const handleRangeSelector = (facet: string) => {
		let value = `${range.min}TO${range.max}`;
		if (range.min === '' && range.max === '') {
			value = undefined;
		}
		handleFilterChange({ name: facet, value: value }, true);
	};

	const handleOnChange = (value: string, type: string) => {
		setRange({ ...range, [type]: value });
	};

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				padding: '10px 16px'
			}}
		>
			<TextField
				name={`${facet}min`}
				value={range.min}
				onChange={(e) => handleOnChange(e.target.value, 'min')}
				placeholder={formatMessage(messages.min)}
				margin="normal"
				sx={{ width: '60px', margin: '0', flexGrow: 1 }}
				slotProps={{ htmlInput: { sx: { py: 1 } } }}
			/>
			<Box component="span" sx={{ margin: '0 5px' }}>
				-
			</Box>
			<TextField
				name={`${facet}max`}
				value={range.max}
				onChange={(e) => handleOnChange(e.target.value, 'max')}
				placeholder={formatMessage(messages.max)}
				margin="normal"
				sx={{ width: '60px', margin: '0', flexGrow: 1 }}
				slotProps={{ htmlInput: { sx: { py: 1 } } }}
			/>
			<Button
				variant="contained"
				color="primary"
				sx={{ marginLeft: '10px' }}
				onClick={() => handleRangeSelector(facet)}
			>
				{formatMessage(messages.go)}
			</Button>
		</Box>
	);
}

export default SiteSearchRangeSelector;
