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

import OutlinedInput, { OutlinedInputProps } from '@mui/material/OutlinedInput';
import React, { useId } from 'react';
import { useFormEngineContext } from '../formEngineContext';
import { applyContentNameRules } from '../../../utils/content';
import { FormEngineField } from '../common/FormEngineField';
import InputAdornment from '@mui/material/InputAdornment';
import { ControlProps } from '../types';

export interface SlugProps extends ControlProps {
  value: string;
}

export function Slug(props: SlugProps) {
  const { field, readonly } = props;
  const htmlId = useId();
  const fieldId = field.id === 'fileName' || field.id === 'file-name' ? 'folder-name' : field.id;
  const [context, api] = useFormEngineContext();
  const { pathInProject, values } = context;
  const value = values[fieldId] as string;
  const handleChange: OutlinedInputProps['onChange'] = (e) =>
    api.current.updateValue(fieldId, applyContentNameRules(e.currentTarget.value));
  return (
    <FormEngineField
      htmlFor={htmlId}
      field={field}
      min={field.validations.minValue?.value}
      max={field.validations.maxLength?.value}
      length={value.length}
    >
      <OutlinedInput
        fullWidth
        id={htmlId}
        value={value}
        onChange={handleChange}
        disabled={readonly}
        startAdornment={
          <InputAdornment position="start" title={pathInProject} sx={{ mr: 0 }}>
            {pathInProject}
          </InputAdornment>
        }
      />
    </FormEngineField>
  );
}

export default Slug;
