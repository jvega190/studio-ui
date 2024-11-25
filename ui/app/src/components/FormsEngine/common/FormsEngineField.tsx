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
import FormControl, { FormControlProps } from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import FieldRequiredStateIndicator from './FieldRequiredStateIndicator';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import Collapse from '@mui/material/Collapse';
import Alert, { alertClasses } from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import React, { forwardRef, PropsWithChildren, ReactNode, SyntheticEvent, useEffect, useRef, useState } from 'react';
import { isEmptyValue, isFieldRequired } from '../validateFieldValue';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import useItemsByPath from '../../../hooks/useItemsByPath';
import { FormattedMessage, useIntl } from 'react-intl';
import { HelpOutlineRounded } from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import { SystemIconDescriptor } from '../../SystemIcon';
import {
  useFormApiContext,
  useItemMetaContext,
  useStableFormContext,
  useStableGlobalApiContext
} from '../formsEngineContext';
import { useAtomValue } from 'jotai';

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

export interface FormsEngineFieldProps
  extends PropsWithChildren<{
    field: ContentTypeField;
    autoFocus?: boolean;
    htmlFor?: string;
    value?: unknown;
    min?: number;
    max?: number;
    length?: number;
    action?: ReactNode;
    isValid?: boolean;
    sx?: FormControlProps['sx'];
    menu?: false;
    menuOptions?: Array<
      | {
          id: string;
          text: ReactNode;
          icon?: SystemIconDescriptor;
        }
      | 'divider'
    >;
    onMenuOptionClick?(e: SyntheticEvent, optionId: string, closeMenu: () => void): void;
  }> {}

export const FormsEngineField = forwardRef<HTMLDivElement, FormsEngineFieldProps>(function (props, ref) {
  const {
    children,
    field,
    max,
    min,
    length,
    action,
    htmlFor,
    autoFocus,
    menu = true,
    menuOptions,
    onMenuOptionClick
  } = props;
  const { sourceMap } = useItemMetaContext();
  const { changedFieldIds, atoms } = useStableFormContext();
  const formApi = useFormApiContext();
  const globalApi = useStableGlobalApiContext();
  const { formatMessage } = useIntl();
  const itemsByPath = useItemsByPath();
  const labelRef = useRef<HTMLLabelElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>();
  const [openMenu, setOpenMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fieldId = field.id;
  const hasChanges = changedFieldIds.has(field.id);
  const hasHelpText = Boolean(field.helpText);
  const hasDescription = Boolean(field.description);
  const lengthBlock = createLengthBlock({ length, max, min });
  const isRequired = isFieldRequired(field);
  const validityData = useAtomValue(atoms.validationByFieldId[fieldId]);
  const value = useAtomValue(atoms.valueByFieldId[fieldId]);
  const isValid = props.isValid ?? validityData?.isValid;
  const handleCloseMenu = () => setOpenMenu(false);
  const handleRollback = () => formApi.rollbackField(field.id);
  useEffect(() => {
    // Offer controls the option to focus on the label when the field is rendered.
    if (autoFocus) {
      labelRef.current?.focus();
    }
  }, [autoFocus]);
  return (
    <FormControl
      ref={ref}
      fullWidth
      error={!isValid}
      variant="standard"
      data-field-id={fieldId}
      required={isRequired}
      sx={{ '.MuiFormLabel-asterisk': { display: 'none' }, ...props.sx }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <FormLabel htmlFor={htmlFor} component="label" ref={labelRef} tabIndex={autoFocus ? 0 : undefined}>
            {field.name}
          </FormLabel>
          {isRequired && <FieldRequiredStateIndicator isValid={isValid} />}
          {hasHelpText && (
            <IconButton size="small" onClick={() => setShowHelp(!showHelp)}>
              <HelpOutlineRounded fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Box display="flex" alignItems="center">
          {lengthBlock}
          {action}
          {menu && (
            <>
              {/* TODO: Should the menu button be tabbable? Perhaps it could be a preference whether it should be tabbable or not. */}
              <IconButton size="small" tabIndex={-1} ref={menuButtonRef} onClick={() => setOpenMenu(true)}>
                <MoreVertRounded fontSize="small" />
              </IconButton>
              <Menu
                open={openMenu}
                anchorEl={menuButtonRef.current}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
              >
                <MenuItem>
                  <ListItemText>
                    <FormattedMessage defaultMessage="Field Information" />
                  </ListItemText>
                </MenuItem>
                {hasChanges && [
                  <Divider key="rollback-divider" />,
                  <MenuItem key="rollback-action" onClick={handleRollback}>
                    <ListItemText>
                      <FormattedMessage defaultMessage="Rollback changes" />
                    </ListItemText>
                  </MenuItem>
                ]}
                {menuOptions && <Divider />}
                {menuOptions?.map((option, index) =>
                  option === 'divider' ? (
                    <Divider key={`divider_${index}`} />
                  ) : (
                    <MenuItem key={option.id} onClick={(e) => onMenuOptionClick?.(e, option.id, handleCloseMenu)}>
                      <ListItemText children={option.text} />
                    </MenuItem>
                  )
                )}
              </Menu>
            </>
          )}
        </Box>
      </Box>
      {hasHelpText && (
        <Collapse in={showHelp}>
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
      {sourceMap?.[fieldId] && (
        <Alert
          variant="standard"
          severity="info"
          action={
            <>
              <Button
                color="inherit"
                size="small"
                sx={{ px: 0.5, minWidth: 0 }}
                onClick={() => {
                  globalApi.pushForm({
                    readonly: true,
                    update: { path: sourceMap[fieldId] }
                  });
                }}
              >
                View
              </Button>
              {/* TODO: Create or link to content inheritance article */}
              <IconButton
                href="/"
                size="small"
                color="inherit"
                target="_blank"
                component="a"
                title={formatMessage({ defaultMessage: 'Learn more about content inheritance' })}
              >
                <HelpOutlineRounded fontSize="small" />
              </IconButton>
            </>
          }
          sx={{
            px: 1,
            mb: 0.625,
            borderRadius: 5,
            alignItems: 'center',
            [`.${alertClasses.message}`]: { display: 'flex', alignItems: 'center' },
            [`.${alertClasses.action}`]: { mr: 0 },
            [`.${alertClasses.icon}`]: { mr: 1 }
          }}
        >
          {isEmptyValue(field, value) ? (
            <FormattedMessage
              defaultMessage="Value is inherited from {label}"
              values={{ label: itemsByPath[sourceMap[fieldId]]?.label ?? sourceMap[fieldId] }}
            />
          ) : (
            <FormattedMessage
              defaultMessage="Inherited value from {label} is overriden"
              values={{ label: itemsByPath[sourceMap[fieldId]]?.label ?? sourceMap[fieldId] }}
            />
          )}
        </Alert>
      )}
      {children}
      {hasDescription && <FormHelperText>{field.description}</FormHelperText>}
      {!isValid &&
        validityData?.messages?.length &&
        validityData.messages.map((message, key) => <FormHelperText key={key}>{message}</FormHelperText>)}
    </FormControl>
  );
});

export default FormsEngineField;
