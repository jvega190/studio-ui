import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import React, { useContext } from 'react';
import { ItemMetaContext } from '../formsEngineContext';
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
