/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { Dialog } from '../Dialog';
import { HistoryDialogContainer } from './HistoryDialogContainer';
import { HistoryDialogProps } from './utils';

export const historyStyles = makeStyles(() =>
  createStyles({
    dialogBody: {
      overflow: 'auto',
      minHeight: '50vh'
    },
    dialogFooter: {
      padding: 0
    },
    singleItemSelector: {
      marginBottom: '10px'
    }
  })
);

export const paginationStyles = makeStyles((theme) =>
  createStyles({
    pagination: {
      marginLeft: 'auto',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      '& p': {
        padding: 0
      },
      '& svg': {
        top: 'inherit'
      },
      '& .hidden': {
        display: 'none'
      }
    },
    toolbar: {
      padding: 0,
      display: 'flex',
      justifyContent: 'space-between',
      paddingLeft: '20px',
      '& .MuiTablePagination-spacer': {
        display: 'none'
      },
      '& .MuiTablePagination-spacer + p': {
        display: 'none'
      }
    }
  })
);

export default function HistoryDialog(props: HistoryDialogProps) {
  const { open, onClose, ...rest } = props;
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <HistoryDialogContainer {...rest} />
    </Dialog>
  );
}
