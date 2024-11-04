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

import { ContentTypeField } from '../../../models';
import { useFormsEngineContext } from '../formsEngineContext';
import FormControl, { FormControlProps } from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import { FieldRequiredStateIndicator } from './FieldRequiredStateIndicator';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import React, { PropsWithChildren, ReactNode } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { isFieldRequired } from '../validateFieldValue';
import FormLabel from '@mui/material/FormLabel';

function createLengthBlock({ length, max, min }: { length: number; max: number; min: number }) {
  const pieces = [];
  if (length != null) {
    pieces.push(`${length}`);
  }
  if (min != null && max != null) {
    pieces.push(` (${min}-${max})`);
  } else if (max != null) {
    // pieces.push(`≤${max}`);
    pieces.push(`/${max}`);
  } else if (min != null) {
    // pieces.push(`≥${min}`);
    // pieces.push(` (${min} - ∞)`);
    pieces.push(`/${min}+`);
  }
  return pieces.length ? (
    <Typography variant="body2" color="textSecondary" children={pieces.join('')} sx={{ mr: 1 }} />
  ) : null;
}

export interface FormEngineFieldProps
  extends PropsWithChildren<{
    field: ContentTypeField;
    htmlFor?: string;
    value?: unknown;
    min?: number;
    max?: number;
    length?: number;
    actions?: ReactNode;
    isValid?: boolean;
    sx?: FormControlProps['sx'];
  }> {}

export function FormEngineField(props: FormEngineFieldProps) {
  const { children, field, max, min, length, actions, htmlFor } = props;
  const [{ fieldHelpExpandedState, fieldValidityState }, { current }] = useFormsEngineContext();
  const fieldId = field.id;
  const hasHelpText = Boolean(field.helpText);
  const hasDescription = Boolean(field.description);
  const lengthBlock = createLengthBlock({ length, max, min });
  const isRequired = isFieldRequired(field);
  const validityData = fieldValidityState[field.id];
  const isValid = props.isValid ?? validityData?.isValid;
  return (
    <FormControl
      fullWidth
      error={!isValid}
      variant="standard"
      data-field-id={fieldId}
      required={isRequired}
      sx={{ '.MuiFormLabel-asterisk': { display: 'none' }, ...props.sx }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <FormLabel htmlFor={htmlFor} component="label">
            {field.name}
          </FormLabel>
          {isRequired && <FieldRequiredStateIndicator isValid={isValid} />}
          {hasHelpText && (
            <IconButton size="small" onClick={(e) => current.handleViewFieldHelpText(e, field)}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Box display="flex" alignItems="center">
          {lengthBlock}
          {actions}
          <IconButton size="small">
            <MoreVertRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      {hasHelpText && (
        <Collapse in={fieldHelpExpandedState[fieldId]}>
          <Alert severity="info" variant="outlined" sx={{ border: 'none' }}>
            <Typography
              variant="body2"
              component="section"
              color="textSecondary"
              dangerouslySetInnerHTML={{ __html: field.helpText }}
              sx={{ 'p:first-of-type:last-of-type': { margin: 0 } }}
            />
          </Alert>
        </Collapse>
      )}
      {children}
      {hasDescription && <FormHelperText>{field.description}</FormHelperText>}
      {!isValid &&
        validityData?.messages?.length &&
        validityData.messages.map((message, key) => <FormHelperText key={key}>{message}</FormHelperText>)}
    </FormControl>
  );
}
