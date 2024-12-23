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
import {
  closeCancelPackageDialog,
  closePublishPackageApprovalDialog,
  showBulkCancelPackageDialog,
  showCancelPackageDialog,
  showPublishPackageApprovalDialog
} from '../state/actions/dialogs';
import { batchActions } from '../state/actions/misc';

const translations = defineMessages({
  review: {
    defaultMessage: 'Review'
  },
  resubmit: {
    defaultMessage: 'Resubmit'
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
  resubmit: {
    id: 'resubmit',
    label: translations.resubmit
  },
  cancel: {
    id: 'cancel',
    label: translations.cancel
  }
};

export const allPackageActions = Object.keys(unparsedOptions);

// TODO: packages will include AA, we need to consider that
export const generatePackageOptions = (
  packages: PublishPackage[],
  options?: {
    includeOnly?: PackageActions[];
  }
): ContextMenuOption[] => {
  const actionsToInclude = createPresenceTable(options?.includeOnly ?? allPackageActions) as Record<
    PackageActions,
    boolean
  >;
  const packageOptions = [];
  if (packages?.length) {
    if (packages?.length === 1) {
      const pkg = packages[0];
      if (pkg.approvalState === 'SUBMITTED' && actionsToInclude.review) {
        packageOptions.push(unparsedOptions.review);
      }
      if (actionsToInclude.resubmit) {
        packageOptions.push(unparsedOptions.resubmit);
      }
    }
    if (actionsToInclude.cancel) {
      packageOptions.push(unparsedOptions.cancel);
    }
  }
  return packageOptions;
};

export const packageActionDispatcher = ({
  pkg,
  option,
  dispatch,
  onActionSuccess
}: {
  pkg: PublishPackage | PublishPackage[];
  option: PackageActions;
  dispatch: Dispatch;
  onActionSuccess?: Action;
}) => {
  switch (option) {
    case 'review':
      dispatch(
        showPublishPackageApprovalDialog({
          packageId: (pkg as PublishPackage).id,
          onSuccess: batchActions([closePublishPackageApprovalDialog(), ...(onActionSuccess ? [onActionSuccess] : [])])
        })
      );
      break;
    case 'resubmit':
      console.log('resubmit');
      break;
    case 'cancel':
      if (Array.isArray(pkg)) {
        dispatch(
          showBulkCancelPackageDialog({
            packages: pkg,
            onSuccess: batchActions([closeCancelPackageDialog(), ...(onActionSuccess ? [onActionSuccess] : [])])
          })
        );
      } else {
        dispatch(
          showCancelPackageDialog({
            packageId: pkg.id,
            onSuccess: batchActions([closeCancelPackageDialog(), ...(onActionSuccess ? [onActionSuccess] : [])])
          })
        );
      }
      break;
    default:
      break;
  }
};
