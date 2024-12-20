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
import { FormattedMessage } from 'react-intl';
import { EnhancedDialog, EnhancedDialogProps } from '../EnhancedDialog';
import Box from '@mui/material/Box';
import DialogFooter from '../DialogFooter';
import PackageDetailsDialogContainer from './PackageDetailsDialogContainer';

export interface PackageDetailsDialogProps extends EnhancedDialogProps {
  packageId: number;
}

export function PackageDetailsDialog(props: PackageDetailsDialogProps) {
  const { packageId, ...enhancedDialogProps } = props;
  return (
    <EnhancedDialog
      fullWidth
      maxWidth="lg"
      {...enhancedDialogProps}
      title={
        <FormattedMessage
          id="packageDetailsDialog.packageDetailsDialogTitle"
          defaultMessage="Publishing Package Details"
        />
      }
    >
      <PackageDetailsDialogContainer packageId={packageId} />
    </EnhancedDialog>
  );
}

export default PackageDetailsDialog;
