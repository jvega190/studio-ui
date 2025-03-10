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

import React from 'react';
import { PublishingPackageReviewDialogProps } from './types';
import { EnhancedDialog } from '../EnhancedDialog';
import { FormattedMessage } from 'react-intl';
import PublishingPackageReviewDialogContainer from './PublishingPackageReviewDialogContainer';

export function PublishingPackageReviewDialog(props: PublishingPackageReviewDialogProps) {
	const { packageId, isSubmitting, onSuccess, ...rest } = props;
	return (
		<EnhancedDialog
			title={<FormattedMessage defaultMessage="Review Publishing Package" />}
			maxWidth="lg"
			{...rest}
			isSubmitting={isSubmitting}
		>
			<PublishingPackageReviewDialogContainer packageId={packageId} onSuccess={onSuccess} isSubmitting={isSubmitting} />
		</EnhancedDialog>
	);
}

export default PublishingPackageReviewDialog;
