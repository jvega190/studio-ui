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

import OutlinedInput from '@mui/material/OutlinedInput';
import React, { useEffect, useId } from 'react';
import { FormEngineField } from '../common/FormEngineField';
import { ControlProps } from '../types';
import { useFormsEngineContext } from '../formsEngineContext';

export interface AutoFileNameProps extends ControlProps {
  value: string;
}

export function AutoFileName(props: AutoFileNameProps) {
  const { field, value, setValue } = props;
  const [{ values }] = useFormsEngineContext();
  const htmlId = useId();
  useEffect(() => {
    if (!value) {
      setValue(`${values.objectId as string}.xml`);
    }
  }, [setValue, value, values.objectId]);
  return (
    <FormEngineField htmlFor={htmlId} field={field}>
      <OutlinedInput readOnly fullWidth id={htmlId} value={value.replace(/\.xml$/, '')} />
    </FormEngineField>
  );
}

export default AutoFileName;
