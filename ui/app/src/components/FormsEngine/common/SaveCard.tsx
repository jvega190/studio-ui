import { useAtom, useAtomValue, useStore as useJotaiStore } from 'jotai/index';
import { useDispatch, useStore as useReduxStore } from 'react-redux';
import GlobalState from '../../../models/GlobalState';
import { FormattedMessage, useIntl } from 'react-intl';
import useActiveSiteId from '../../../hooks/useActiveSiteId';
import React, { ChangeEvent, useContext, useState } from 'react';
import { FormsEngineFormContextApi, ItemMetaContext, StableFormContext } from '../formsEngineContext';
import { ButtonProps } from '@mui/material/Button';
import { buildContentXml, createObjectWithSystemProps, extractValueAtoms, showAlert } from './formUtils';
import { fromString } from '../../../utils/xml';
import { ensureSingleSlash } from '../../../utils/string';
import { writeContent } from '../../../services/content';
import { AjaxError } from 'rxjs/ajax';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import PrimaryButton from '../../PrimaryButton';
import FormHelperText from '@mui/material/FormHelperText';
import Grow from '@mui/material/Grow';
import Alert from '@mui/material/Alert';
import { FormSavePromiseResult, FormsEngineProps } from '../FormsEngine';
import { XmlKeys } from './formConsts';

export interface SaveCardProps {
  createPath?: string;
  isRepeatMode: boolean;
  isCreateMode: boolean;
  isStackedForm: boolean;
  isEmbedded: boolean;
  onSave?: FormsEngineProps['onSave'];
  onClose?: FormsEngineProps['onClose']; // (isStackedForm ? onCloseProp : enhancedDialogOnClose)
}

// TODO: By extracting this out of the main component, could make it challenging to later add keyshortcuts to save?
export function SaveCard(props: SaveCardProps) {
  const jotai = useJotaiStore();
  const store = useReduxStore<GlobalState>();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const siteId = useActiveSiteId();
  const { isEmbedded, isStackedForm, isRepeatMode, isCreateMode, onSave, onClose, createPath } = props;
  const { id, contentType, contentObject, path: itemPath } = useContext(ItemMetaContext);
  const stableFormContext = useContext(StableFormContext);
  const formContextApi = useContext(FormsEngineFormContextApi);
  const { affectedPackages } = useAtomValue(stableFormContext.atoms.lockResult);
  const [isSubmitting, setIsSubmitting] = useAtom(stableFormContext.atoms.isSubmitting);
  const [versionComment, setVersionComment] = useAtom(stableFormContext.atoms.versionComment);
  const [hasPendingChanges, setHasPendingChanges] = useAtom(stableFormContext.atoms.hasPendingChanges);
  const [acceptedWorkflowCancellation, setAcceptedWorkflowCancellation] = useState(false);
  const hasAffectedPackages = Boolean(affectedPackages?.length > 0);
  const disableSave = isSubmitting || !hasPendingChanges || (hasAffectedPackages && !acceptedWorkflowCancellation);
  const handleSave: ButtonProps['onClick'] = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // TODO: Run necessary validations to ensure the form is ready to be saved.
    const values = extractValueAtoms(jotai, stableFormContext.atoms.valueByFieldId);
    const onSavePromiseHandler = ({ close }: FormSavePromiseResult) => {
      close && onClose?.(e, null);
    };
    // Repeat handled here. If true, execution ends inside if statement.
    if (isRepeatMode) {
      setHasPendingChanges(false);
      onSave?.({ values, versionComment })?.then(onSavePromiseHandler);
      return;
    }
    // Put system properties in before creating the XML
    Object.assign(
      values,
      createObjectWithSystemProps(contentType, {
        [XmlKeys.modelId]: id,
        [XmlKeys.internalName]: values[XmlKeys.internalName] as string,
        [XmlKeys.fileName]: (values[XmlKeys.fileName] ?? contentObject[XmlKeys.fileName]) as string,
        [XmlKeys.folderName]: (values[XmlKeys.folderName] ?? contentObject[XmlKeys.folderName]) as string,
        [XmlKeys.dateCreated]: contentObject[XmlKeys.dateCreated] as string,
        [XmlKeys.dateCreatedDt]: contentObject[XmlKeys.dateCreatedDt] as string,
        [XmlKeys.savedAsDraft]: Object.values(stableFormContext.atoms.validationByFieldId).some(
          (validityDataAtom) => !jotai.get(validityDataAtom).isValid
        )
      })
    );
    // Validate minimum requirements to save as draft. Execution stops if minimum reqs aren't fulfilled.
    if (
      String(values[XmlKeys.internalName]).trim() === '' ||
      String(values[XmlKeys.fileName]).trim() === '' ||
      String(values[XmlKeys.folderName]).trim() === ''
    ) {
      return showAlert({
        dispatch,
        message: formatMessage(
          { defaultMessage: 'You need a {fileName} and {internalName} at a minimum to save content.' },
          {
            fileName: contentType.fields[XmlKeys.fileName].name,
            internalName: contentType.fields[XmlKeys.internalName].name
          }
        )
      });
    }
    const xml = buildContentXml(values, store.getState().contentTypes.byId);
    // Embedded handled here. If true, execution ends inside if statement.
    if (isEmbedded) {
      setHasPendingChanges(false);
      const dom = fromString(xml);
      onSave?.({ dom, xml, values, versionComment })?.then(onSavePromiseHandler);
      return;
    }
    setIsSubmitting(true);
    let path: string;
    if (isCreateMode) {
      path = ensureSingleSlash(`${createPath}/${values[XmlKeys.folderName]}/${values[XmlKeys.fileName]}`);
    } /* is a plain update (page or component) */ else {
      path = itemPath;
    }
    // TODO: Temporary playground save path. Remove.
    // path = '/site/website/fe2-save-result.xml';
    writeContent(siteId, path, xml).subscribe({
      next() {
        setIsSubmitting(false);
        setHasPendingChanges(false);
        formContextApi.setValuesCheckpoint(values);
        const dom = fromString(xml);
        onSave?.({ dom, xml, values, versionComment })?.then(onSavePromiseHandler);
      },
      error(error: AjaxError) {
        setIsSubmitting(false);
        showAlert({
          dispatch,
          children: (
            <Box>
              <Typography marginBottom={1}>
                <FormattedMessage defaultMessage="An error occurred trying to save the form" />
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {error.response.response?.message ?? error.response.message}
              </Typography>
            </Box>
          )
        });
      }
    });
  };
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
      <PrimaryButton fullWidth variant="contained" onClick={handleSave} disabled={disableSave} loading={isSubmitting}>
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
