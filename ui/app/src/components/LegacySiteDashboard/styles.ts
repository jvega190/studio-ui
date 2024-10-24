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
    padding: '20px',
    background: theme.palette.background.default,
    '& > div.MuiAccordion-root': {
      marginTop: '20px',
      '&:first-child': {
        marginTop: 0
      }
    }
  },
  tableRoot: {
    tableLayout: 'fixed'
  },
  itemPath: {
    color: theme.palette.text.secondary
  },
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  showSelectRoot: {
    paddingTop: '8.5px',
    paddingBottom: '8.5px'
  },
  showLabel: {
    marginRight: theme.spacing(1)
  },
  skeletonCheckbox: {
    margin: '6px 10px'
  },
  collapseAll: {
    marginRight: '10px'
  },
  actionsBarRoot: {
    left: '0',
    right: '0',
    zIndex: 2,
    position: 'absolute'
  },
  actionsBarCheckbox: {
    margin: '2px'
  }
}));

export default useStyles;
