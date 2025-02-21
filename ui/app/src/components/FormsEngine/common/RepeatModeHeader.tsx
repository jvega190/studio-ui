import React, { useContext } from 'react';
import { ItemMetaContext } from '../formsEngineContext';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';
import { FormsEngineProps } from '../FormsEngine';

export function RepeatModeHeader({ repeat }: { repeat: FormsEngineProps['repeat'] }) {
	const { contentType } = useContext(ItemMetaContext);
	return (
		<Container sx={{ py: 1 }}>
			<Typography variant="h6" component="h3">
				{repeat.index === undefined ? (
					<FormattedMessage defaultMessage="New Repeat Item" />
				) : (
					<FormattedMessage defaultMessage="Item # {number}" values={{ number: repeat.index + 1 }} />
				)}
			</Typography>
			<Typography variant="body2" color="textSecondary">
				<FormattedMessage
					defaultMessage="{name} Repeat Group"
					values={{ name: contentType.fields[repeat.fieldId].name }}
				/>
			</Typography>
		</Container>
	);
}

export default RepeatModeHeader;
