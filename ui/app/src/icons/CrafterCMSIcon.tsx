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
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { PartialSxRecord } from '../models';
import Box from '@mui/material/Box';
import { consolidateSx } from '../utils/system';

export type CrafterCMSIconClassKey = 'root' | 'themedFill' | 'gear' | 'letter' | 'chevron';

export interface CrafterCMSIconProps extends Omit<SvgIconProps, 'classes'> {
	chevron?: boolean;
	classes?: SvgIconProps['classes'] & Partial<Record<CrafterCMSIconClassKey, string>>;
	sxs?: PartialSxRecord<CrafterCMSIconClassKey>;
}

export function CrafterCMSIcon(props: CrafterCMSIconProps) {
	const { sxs, ...rest } = props;
	return (
		<SvgIcon {...rest} sx={consolidateSx(props.sx, sxs?.root)}>
			<Box
				component="path"
				className={[props.classes?.themedFill, props.classes?.letter].filter(Boolean).join(' ')}
				sx={consolidateSx({ fill: (theme) => (theme.palette.mode === 'dark' ? '#fff' : '#000') }, sxs?.letter)}
				d="M13.7343 16.3101C14.8462 16.3101 15.855 15.9089 16.6345 15.1523C16.6803 15.1064 16.6803 15.0147 16.6459 14.9803L15.6945 13.9601C15.683 13.9372 15.6486 13.9257 15.6142 13.9257C15.5798 13.9257 15.5455 13.9372 15.5225 13.9486C15.0755 14.3384 14.4335 14.5677 13.8145 14.5677C12.4045 14.5677 11.2926 13.4213 11.2926 11.9655C11.2926 10.4867 12.3931 9.32895 13.803 9.32895C14.4335 9.32895 15.064 9.56968 15.534 9.98236C15.5798 10.0282 15.6486 10.0282 15.683 9.98236L16.6345 8.99652C16.6574 8.97359 16.6803 8.9392 16.6803 8.90481C16.6803 8.87042 16.6689 8.83603 16.6345 8.81311C15.7862 8.04507 14.9035 7.70117 13.7457 7.70117C11.3614 7.71264 9.43555 9.64992 9.43555 12.0228C9.43555 14.3842 11.3614 16.3101 13.7343 16.3101Z"
			/>
			<Box
				component="path"
				className={props.classes?.gear}
				sx={consolidateSx({ fill: '#f00' }, sxs?.gear)}
				d="M17.9385 16.4912C17.9052 16.4469 17.7723 16.4358 17.7059 16.4912C16.6537 17.3994 15.1474 17.931 13.6854 17.931C10.4181 17.931 7.84858 15.3393 7.75998 11.9945C7.84858 8.64966 10.4181 6.05797 13.6854 6.05797C15.1585 6.05797 16.6648 6.60068 17.7059 7.4978C17.7723 7.55318 17.9052 7.5421 17.9385 7.4978L20.1536 5.1387C20.1979 5.0944 20.1979 4.95041 20.1314 4.88396C19.3894 4.16405 18.5255 3.57704 17.5951 3.13402L17.3514 3.05649L17.3957 1.04073C16.7755 0.819216 16.1331 0.642006 15.4907 0.53125L14.5272 2.27012L14.2946 2.24797C13.6633 2.19259 13.2202 2.19259 12.5889 2.24797L12.3564 2.28119L11.3928 0.542326C10.7504 0.653082 10.108 0.830291 9.4767 1.0518L9.50992 3.03434L9.29949 3.13402C8.80108 3.3666 8.30268 3.65457 7.82643 3.98684L7.63815 4.11974L5.9325 3.10079C5.42303 3.52166 4.95785 3.99791 4.53698 4.49631L5.55593 6.20196L5.42303 6.39024C5.23474 6.65606 5.05753 6.94402 4.85817 7.30952L4.70311 7.60856C4.65881 7.69716 4.61451 7.77469 4.57021 7.8633L4.47053 8.07373L2.48799 8.05158C2.26648 8.67182 2.08927 9.3142 1.97852 9.95659L3.71738 10.9202L3.69523 11.1528C3.66201 11.4739 3.65093 11.7398 3.65093 12.0056C3.65093 12.2714 3.66201 12.5372 3.69523 12.8584L3.71738 13.091L1.97852 14.0546C2.08927 14.6969 2.26648 15.3393 2.48799 15.9596L4.47053 15.9263L4.57021 16.1368C4.61451 16.2254 4.65881 16.3029 4.70311 16.3915L4.85817 16.6906C5.05753 17.056 5.23474 17.344 5.42303 17.6098L5.55593 17.7981L4.53698 19.5038C4.95785 20.0022 5.4341 20.4784 5.9325 20.8993L7.63815 19.8803L7.82643 20.0132C8.30268 20.3455 8.80108 20.6335 9.29949 20.8661L9.50992 20.9657L9.4767 22.9593C10.0969 23.1809 10.7393 23.3581 11.3817 23.4688L12.3453 21.7299L12.5779 21.7521C13.2092 21.8075 13.6522 21.8075 14.2835 21.7521L14.5161 21.7299L15.4797 23.4688C16.1221 23.3581 16.7644 23.1809 17.3847 22.9593L17.3404 20.9436L17.584 20.8661C18.5144 20.4341 19.3783 19.836 20.1203 19.1161C20.1868 19.0497 20.1868 18.9057 20.1425 18.8614L17.9385 16.4912Z"
			/>
			{props.chevron && (
				<Box
					component="path"
					className={[props.classes?.themedFill, props.classes?.chevron].filter(Boolean).join(' ')}
					sx={consolidateSx({ fill: (theme) => (theme.palette.mode === 'dark' ? '#fff' : '#000') }, sxs?.chevron)}
					d="M18.0293 12.4479L19.5308 13.9494C19.7569 14.1755 20.1222 14.1755 20.3483 13.9494L21.8498 12.4479C22.215 12.0827 21.9542 11.4565 21.4382 11.4565H18.4351C17.9192 11.4565 17.6641 12.0827 18.0293 12.4479Z"
				/>
			)}
		</SvgIcon>
	);
}

export default CrafterCMSIcon;
