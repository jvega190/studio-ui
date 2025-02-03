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

import { combineReducers } from 'redux';
import error from './error';
import minimizedTabs from './minimizedTabs';
import history from './history';
import viewVersion from './viewVersion';
import compareVersions from './compareVersions';
import deleteDialog from './delete';
import edit from './edit';
import codeEditor from './codeEditor';
import editSite from './editSite';
import itemMenu from './itemMenu';
import itemMegaMenu from './itemMegaMenu';
import launcher from './launcher';
import publishingStatus from './publishingStatus';
import uiBlocker from './uiBlocker';
import renameAsset from './renameAsset';
import brokenReferences from './brokenReferences';
import publishingPackageApproval from './publishingPackageReview';
import cancelPackage from './cancelPackage';
import bulkCancelPackage from './bulkCancelPackage';
import publishingPackageResubmit from './publishingPackageResubmit';
import packageDetails from './packageDetails';
import viewPackages from './viewPackages';

export default combineReducers({
  error,
  minimizedTabs,
  history,
  viewVersion,
  compareVersions,
  publishingPackageApproval,
  publishingPackageResubmit,
  delete: deleteDialog,
  edit,
  codeEditor,
  editSite,
  renameAsset,
  itemMenu,
  itemMegaMenu,
  launcher,
  publishingStatus.
  uiBlocker,
  brokenReferences,
  cancelPackage,
  bulkCancelPackage,
  packageDetails,
  viewPackages
});
