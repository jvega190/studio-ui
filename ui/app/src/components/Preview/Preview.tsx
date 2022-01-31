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
import makeStyles from '@mui/styles/makeStyles';
import ToolsPanel from '../ToolsPanel/ToolsPanel';
import Host from '../Host/Host';
import ToolBar from '../ToolBar/ToolBar';
import { PreviewConcierge } from '../../modules/Preview/PreviewConcierge';
import usePreviewUrlControl from '../../hooks/usePreviewUrlControl';
import ICEToolsPanel from '../ICEToolsPanel';

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }
}));

function Preview(props) {
  const classes = useStyles();
  usePreviewUrlControl(props.history);
  return (
    <>
      <PreviewConcierge>
        <section className={classes.root}>
          <ToolBar />
          <Host />
          <ToolsPanel />
          <ICEToolsPanel />
        </section>
      </PreviewConcierge>
    </>
  );
}

export default Preview;