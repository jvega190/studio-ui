import { useAtom, useAtomValue } from 'jotai';
import { useDispatch } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import React, { ChangeEvent, useContext, useState } from 'react';
import { StableFormContext } from '../formsEngineContext';
import { ButtonProps } from '@mui/material/Button';
import { showAlert } from './formUtils';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import PrimaryButton from '../../PrimaryButton';
import FormHelperText from '@mui/material/FormHelperText';
import Grow from '@mui/material/Grow';
import Alert from '@mui/material/Alert';

export interface SaveCardProps {
	isRepeatMode: boolean;
	isStackedForm: boolean;
	isEmbedded: boolean;
	onSave: ButtonProps['onClick'];
}

export function SaveCard(props: SaveCardProps) {
	const dispatch = useDispatch();
	const { formatMessage } = useIntl();
	const { isEmbedded, isStackedForm, isRepeatMode, onSave } = props;
	const stableFormContext = useContext(StableFormContext);
	const { affectedPackages } = useAtomValue(stableFormContext.atoms.lockResult);
	const isSubmitting = useAtomValue(stableFormContext.atoms.isSubmitting);
	const [versionComment, setVersionComment] = useAtom(stableFormContext.atoms.versionComment);
	const hasPendingChanges = useAtomValue(stableFormContext.atoms.hasPendingChanges);
	const [acceptedWorkflowCancellation, setAcceptedWorkflowCancellation] = useState(false);
	const hasAffectedPackages = Boolean(affectedPackages?.length > 0);
	const disableSave = isSubmitting || !hasPendingChanges || (hasAffectedPackages && !acceptedWorkflowCancellation);
	return (
		<Paper sx={{ p: 1 }} className="space-y-half">
			{(!isEmbedded || !isStackedForm) && !isRepeatMode && (
				// TODO: Should embedded components and repeats get a version comment? How would that work?
				<TextField
					size="small"
					multiline
					fullWidth
					label={<FormattedMessage defaultMessage="Version Comment" />}
					value={versionComment}
					onChange={(e) => setVersionComment(e.target.value)}
					onFocus={(e) => e.target.select()}
				/>
			)}
			{hasAffectedPackages && (
				<FormControlLabel
					title={formatMessage({
						defaultMessage: 'The item is part of a publishing package. Editing it will cancel the entire package.'
					})}
					label={<FormattedMessage defaultMessage="Accept publish cancellation" />}
					control={
						<Checkbox
							size="small"
							checked={acceptedWorkflowCancellation}
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								setAcceptedWorkflowCancellation(e.target.checked);
							}}
						/>
					}
				/>
			)}
			<FormControlLabel
				label={<FormattedMessage defaultMessage="Close after saving" />}
				control={
					<Checkbox
						size="small"
						checked={false}
						onClick={() => showAlert({ dispatch, message: 'Not implemented yet.' })}
					/>
				}
			/>
			{/*
			TODO:
				- If validations aren't all passed, should read "Save Draft" and a different colour.
				- What about embedded drafts? Should they be allowed?
      */}
			<PrimaryButton fullWidth variant="contained" onClick={onSave} disabled={disableSave} loading={isSubmitting}>
				{isRepeatMode || (isEmbedded && isStackedForm) ? (
					<FormattedMessage defaultMessage="Done" />
				) : (
					<FormattedMessage defaultMessage="Save" />
				)}
			</PrimaryButton>
			{isStackedForm && isEmbedded && (
				<FormHelperText sx={{ textAlign: 'center' }}>
					<FormattedMessage defaultMessage="Changes are saved with the main item." />
				</FormHelperText>
			)}
			<Grow in={!hasPendingChanges} appear unmountOnExit>
				<Alert severity="info" variant="outlined" sx={{ p: 0, border: 'none', placeContent: 'center' }}>
					<FormattedMessage defaultMessage="No changes detected" />
				</Alert>
			</Grow>
		</Paper>
	);
}

export default SaveCard;
