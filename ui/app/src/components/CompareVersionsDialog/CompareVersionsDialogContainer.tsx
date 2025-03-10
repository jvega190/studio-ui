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

import { CompareVersionsDialogContainerProps } from './utils';
import React from 'react';
import { CompareVersions } from './CompareVersions';
import DialogBody from '../DialogBody/DialogBody';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { LoadingState } from '../LoadingState';
import { EmptyState } from '../EmptyState';
import { FormattedMessage } from 'react-intl';

export function CompareVersionsDialogContainer(props: CompareVersionsDialogContainerProps) {
	const { versionsBranch } = props;
	const { compareVersionsBranch } = versionsBranch;

	return (
		<DialogBody
			sx={{
				overflow: 'auto',
				minHeight: '50vh',
				padding: 0
			}}
		>
			{compareVersionsBranch &&
				(compareVersionsBranch.error ? (
					<ApiResponseErrorState error={compareVersionsBranch.error} />
				) : compareVersionsBranch.isFetching ? (
					<LoadingState />
				) : compareVersionsBranch.compareVersions?.length > 0 ? (
					<CompareVersions versions={compareVersionsBranch.compareVersions} />
				) : (
					<EmptyState title={<FormattedMessage defaultMessage="No versions found" />} />
				))}
		</DialogBody>
	);
}

export default CompareVersionsDialogContainer;
