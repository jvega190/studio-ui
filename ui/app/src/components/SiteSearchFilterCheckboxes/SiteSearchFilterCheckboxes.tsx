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

import { Facet } from '../../models/Search';
import { LookupTable } from '../../models/LookupTable';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import React from 'react';

interface FilterCheckboxesProps {
	facetData: Facet;
	facet: string;
	checkedFilters: LookupTable;
	facetLabelLookup: LookupTable;
	handleCheckboxClick(key: string, checked: boolean, facet: string): any;
}

export function SiteSearchFilterCheckboxes(props: FilterCheckboxesProps) {
	const { facetData, facet, handleCheckboxClick, checkedFilters, facetLabelLookup } = props;
	const items = facetData.values;
	return (
		<FormGroup>
			{Object.keys(items).map((key) => {
				return (
					<FormControlLabel
						key={key}
						name={key}
						control={
							<Checkbox
								color="primary"
								checked={(checkedFilters && checkedFilters[facet] && checkedFilters[facet][key]) || false}
								value={key}
								onChange={(e) => handleCheckboxClick(key, e.target.checked, facet)}
							/>
						}
						label={`${facetLabelLookup[key] ?? key} (${items[key]})`}
						labelPlacement="start"
						sx={{
							marginRight: '5px',
							[`& .${formControlLabelClasses.label}`]: {
								width: '100%',
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: 1,
								WebkitBoxOrient: 'vertical'
							}
						}}
					/>
				);
			})}
		</FormGroup>
	);
}

export default SiteSearchFilterCheckboxes;
