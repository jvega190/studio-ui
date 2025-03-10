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
import { SingleFileUploadDialogUIProps } from './utils';
import DialogBody from '../DialogBody/DialogBody';
import SingleFileUpload from '../SingleFileUpload/SingleFileUpload';

export function SingleFileUploadDialogUI(props: SingleFileUploadDialogUIProps) {
	const { site, path, customFileName, fileTypes, onUploadComplete, onUploadStart, onUploadError } = props;

	return (
		<>
			<DialogBody>
				<SingleFileUpload
					site={site}
					path={path}
					customFileName={customFileName}
					fileTypes={fileTypes}
					onComplete={onUploadComplete}
					onUploadStart={onUploadStart}
					onError={onUploadError}
				/>
			</DialogBody>
		</>
	);
}

export default SingleFileUploadDialogUI;
