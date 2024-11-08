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

const useStyles = makeStyles()((theme) => {
  let widgetDialogBody;
  const toolbarMixin: any = theme.mixins.toolbar;
  const minWidth0 = '@media (min-width:0px)';
  const orientationLandscape = '@media (orientation: landscape)';
  const minWidth600 = '@media (min-width:600px)';
  if (!toolbarMixin[minWidth0]?.[orientationLandscape] || !toolbarMixin[minWidth600] || !toolbarMixin.minHeight) {
    console.error('[WidgetDialog] MUI may have changed their toolbar mixin.', toolbarMixin);
    widgetDialogBody = {
      overflow: 'auto',
      height: `calc(90vh - 57px)`
    };
  } else {
    widgetDialogBody = {
      [minWidth0]: {
        [orientationLandscape]: {
          height: `calc(90vh - ${toolbarMixin[minWidth0].minHeight}px - 1px)`
        }
      },
      [minWidth600]: {
        height: `calc(90vh - ${toolbarMixin[minWidth600].minHeight}px - 1px)`
      },
      overflow: 'auto',
      height: `calc(90vh - ${toolbarMixin.minHeight}px - 1px)`
    };
  }
  return {
    widgetDialogPaper: { minHeight: '90vh' },
    widgetDialogBody
  };
});

export default useStyles;
