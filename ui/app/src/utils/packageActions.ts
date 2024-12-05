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

import { defineMessages } from 'react-intl';
import { PackageActions, PublishPackage } from '../models';
import { ContextMenuOptionDescriptor } from './itemActions';
import { ContextMenuOption } from '../components';
import { createPresenceTable } from './array';
import { Action, Dispatch } from 'redux';
import { closePublishPackageApprovalDialog, showPublishPackageApprovalDialog } from '../state/actions/dialogs';
import { batchActions } from '../state/actions/misc';

const translations = defineMessages({
  review: {
    defaultMessage: 'Review'
  },
  clone: {
    defaultMessage: 'Clone'
  },
  cancel: {
    defaultMessage: 'Cancel'
  }
});

const unparsedOptions: Record<PackageActions, ContextMenuOptionDescriptor<PackageActions>> = {
  review: {
    id: 'review',
    label: translations.review
  },
  clone: {
    id: 'clone',
    label: translations.clone
  },
  cancel: {
    id: 'cancel',
    label: translations.cancel
  }
};

export const allPackageActions = Object.keys(unparsedOptions);

// TODO: packages will include AA, we need to consider that
export const generatePackageOptions = (
  pkg: PublishPackage,
  options?: {
    includeOnly?: PackageActions[];
  }
): ContextMenuOption[] => {
  const actionsToInclude = createPresenceTable(options?.includeOnly ?? allPackageActions) as Record<
    PackageActions,
    boolean
  >;
  const packageOptions = [];
  if (pkg.approvalState === 'SUBMITTED' && actionsToInclude.review) {
    packageOptions.push(unparsedOptions.review);
  }
  if (actionsToInclude.clone) {
    packageOptions.push(unparsedOptions.clone);
  }
  if (actionsToInclude.cancel) {
    packageOptions.push(unparsedOptions.cancel);
  }
  return packageOptions;
};

export const packageActionDispatcher = ({
  pkg,
  option,
  dispatch,
  onActionSuccess
}: {
  pkg: PublishPackage;
  option: PackageActions;
  dispatch: Dispatch;
  onActionSuccess?: Action;
}) => {
  switch (option) {
    case 'review':
      dispatch(
        showPublishPackageApprovalDialog({
          packageId: pkg.id,
          onSuccess: batchActions([closePublishPackageApprovalDialog(), ...(onActionSuccess ? [onActionSuccess] : [])])
        })
      );
      break;
    case 'clone':
      console.log('clone');
      break;
    case 'cancel':
      console.log('cancel');
      break;
    default:
      break;
  }
};
