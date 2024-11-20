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

import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  root: {
    width: 'auto'
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  formSection: {
    width: '100%',
    marginBottom: '20px'
  },
  formInputs: {
    fontSize: '14px'
  },
  selectInput: {
    padding: '10px 12px'
  },
  publishingTargetLoaderContainer: {
    paddingTop: '24px',
    display: 'inline-flex'
  },
  publishingTargetLoader: {
    border: '1px solid #ced4da',
    padding: '10px 12px',
    borderRadius: '4px',
    width: '100%'
  },
  publishingTargetEmpty: {
    padding: '10px 12px',
    borderRadius: '4px',
    width: '100%'
  },
  datePicker: {
    position: 'relative',
    paddingLeft: 30,
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '5px',
      height: '100%',
      top: '0',
      left: '7px',
      backgroundColor: theme.palette.background.paper,
      borderRadius: '5px'
    }
  },
  radioGroup: {
    paddingTop: '10px',
    fontSize: '14px'
  },
  radioInput: {
    padding: '4px',
    marginLeft: '5px',
    marginRight: '5px'
  },
  selectIcon: {
    right: '12px'
  },
  mixedDatesWarningMessage: {
    marginBottom: '10px'
  },
  mixedTargetsWarningMessage: {
    marginTop: '10px'
  },
  leftAlignedAction: {
    marginRight: 'auto'
  },
  btnSpinner: {
    marginLeft: 11,
    marginRight: 11,
    color: '#fff'
  }
}));

export default useStyles;
