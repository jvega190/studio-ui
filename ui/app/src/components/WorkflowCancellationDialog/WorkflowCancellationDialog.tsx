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
import EnhancedDialog from '../EnhancedDialog';
import WorkflowCancellationDialogContainer from './WorkflowCancellationDialogContainer';
import { WorkflowCancellationDialogProps } from './utils';

export function WorkflowCancellationDialog(props: WorkflowCancellationDialogProps) {
  const { packages, onContinue, ...rest } = props;

  return (
    <EnhancedDialog
      maxWidth="sm"
      title={<FormattedMessage defaultMessage="Publish Cancellation Warning" />}
      dialogHeaderProps={{
        subtitle: (
          <FormattedMessage defaultMessage="The item is part of one or more publishing packages. Editing it will cancel the packages." />
        )
      }}
      {...rest}
    >
      <WorkflowCancellationDialogContainer packages={packages} onContinue={onContinue} />
    </EnhancedDialog>
  );
}

export default WorkflowCancellationDialog;
