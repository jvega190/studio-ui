/*
 * Copyright (C) 2007-2025 Crafter Software Corporation. All Rights Reserved.
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

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import React, { useContext } from 'react';
import { ItemMetaContext } from '../lib/formsEngineContext';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ItemTypeIcon from '../../ItemTypeIcon';

const itemTypeTranslations = defineMessages({
	component: { defaultMessage: 'Component' },
	page: { defaultMessage: 'Page' },
	taxonomy: { defaultMessage: 'Taxonomy' }
});

export function CreateModeHeader({ path }: { path: string }) {
	const { formatMessage } = useIntl();
	const { contentType } = useContext(ItemMetaContext);
	const itemType = contentType.type;
	return (
		<Container sx={{ py: 1 }}>
			<Typography variant="h6" component="h2" display="flex" alignItems="center">
				<ItemTypeIcon item={{ systemType: itemType, mimeType: 'application/xml' }} sx={{ color: 'info.main', mr: 1 }} />
				<FormattedMessage
					defaultMessage='Create new "{name}" {type}'
					values={{
						name: contentType.name,
						type:
							itemType in itemTypeTranslations ? formatMessage(itemTypeTranslations[itemType]).toLowerCase() : itemType
					}}
				/>
			</Typography>
			<Typography color="textSecondary" variant="body2" children={path} />
		</Container>
	);
}

export default CreateModeHeader;
