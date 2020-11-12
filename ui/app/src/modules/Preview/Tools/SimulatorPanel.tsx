/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import { defineMessages, useIntl } from 'react-intl';
import React, { useEffect, useMemo, useReducer } from 'react';
import { getTranslation } from '../../../utils/i18n';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { ScreenRotationRounded } from '@material-ui/icons';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';
import ToolPanel from './ToolPanel';
import { setHostSize } from '../../../state/actions/preview';
import { useDispatch } from 'react-redux';
import { useSelection } from '../../../utils/hooks';
import { WidthAndHeight } from '../../../models/WidthAndHeight';

const SIMULATOR_PANEL_RESPONSIVE_MODE = 'previewSimulatorTool.previewWindowSize';
const SIMULATOR_PANEL_CUSTOM_MODE = 'previewSimulatorTool.custom';

const translations = defineMessages({
  simulatorPanel: {
    id: 'previewSimulatorTool.title',
    defaultMessage: 'Device Simulator'
  },
  smartPhone: {
    id: 'words.phone',
    defaultMessage: 'Phone'
  },
  tablet: {
    id: 'words.tablet',
    defaultMessage: 'Tablet'
  },
  desktop: {
    id: 'words.desktop',
    defaultMessage: 'Desktop'
  },
  previewWindowSize: {
    id: 'previewSimulatorTool.previewWindowSize',
    defaultMessage: 'Preview Window Size'
  },
  presets: {
    id: 'words.presets',
    defaultMessage: 'Presets'
  },
  custom: {
    id: 'words.custom',
    defaultMessage: 'Custom'
  }
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    simulatorFlipColumn: {
      display: 'flex',
      alignItems: 'flex-end'
    },
    simulatorFlipButton: {
      marginBottom: `${theme.spacing(1)}px`
    },
    presetFieldset: {
      marginTop: theme.spacing(1)
    },
    panelBodyInner: {
      padding: theme.spacing(1)
    }
  })
);

const INITIAL_STATE = {
  width: '',
  height: '',
  preset: SIMULATOR_PANEL_RESPONSIVE_MODE
};

const reducer = (a: any, b: any) => ({ ...a, ...b });

export default function SimulatorPanel(props: any) {
  const classes = useStyles({});
  const { formatMessage } = useIntl();
  const toolsPanelWidth = useSelection<number>((state) => state.preview.toolsPanelWidth);
  const maxWidth = window.innerWidth - toolsPanelWidth;

  const devices = useMemo(() => {
    const _devices = props.devices;
    if (_devices) {
      if (!Array.isArray(_devices)) {
        console.log(`[SimulatorPanel] Expected devices to be array but instead got "${typeof _devices}"`);
      }
      return _devices.map((device) => ({
        ...device,
        value: `${device.width}_${device.height}`
      }));
    }
    return [];
  }, [props.devices]);

  const [{ width, height, preset }, setState] = useReducer(reducer, INITIAL_STATE);
  const setWidth = (value) => setState({ width: value });
  const setHeight = (value) => setState({ height: value });

  const handlePresetChange = (e: any) => {
    const value = e.target.value;
    if (value === SIMULATOR_PANEL_RESPONSIVE_MODE) {
      dispatch(
        setHostSize({
          width: null,
          height: null
        })
      );
    } else {
      const device = devices.find((dev) => dev.value === value);
      device &&
        dispatch(
          setHostSize({
            width: device.width > maxWidth ? maxWidth : device.width,
            height: device.height
          })
        );
    }
  };

  const dispatch = useDispatch();
  const hostSize = useSelection<WidthAndHeight>((state) => state.preview.hostSize);
  const onDimensionKeyUp = (e: any) => {
    if (e.key === 'Enter') {
      let widthToSet, heightToSet;

      if (!width) {
        widthToSet = null;
      } else if (!isNaN(width as any)) {
        widthToSet = parseInt(width);
      } else {
        widthToSet = hostSize.width;
      }

      if (!height) {
        heightToSet = null;
      } else if (!isNaN(height as any)) {
        heightToSet = parseInt(height);
      } else {
        heightToSet = hostSize.height;
      }

      dispatch(
        setHostSize({
          width: widthToSet > maxWidth ? maxWidth : widthToSet,
          height: heightToSet
        })
      );
    }
  };

  useEffect(() => {
    const nextState: any = {};
    if (hostSize.width != null) {
      nextState.width = `${hostSize.width}`;
    } else {
      nextState.width = '';
    }
    if (hostSize.height != null) {
      nextState.height = `${hostSize.height}`;
    } else {
      nextState.height = '';
    }
    if (hostSize.width != null || hostSize.height != null) {
      const matchingPreset = devices.find(
        (device) =>
          // @ts-ignore
          // eslint-disable-next-line
          device.width == hostSize.width && device.height == hostSize.height
      );
      nextState.preset = matchingPreset ? matchingPreset.value : SIMULATOR_PANEL_CUSTOM_MODE;
    } else {
      nextState.preset = SIMULATOR_PANEL_RESPONSIVE_MODE;
    }
    setState(nextState);
  }, [hostSize, props.config, devices]);

  const onFlipDimensions = () => {
    const nextWidth = parseInt(height);
    const nextHeight = parseInt(width);
    dispatch(
      setHostSize({
        width: nextWidth > maxWidth ? maxWidth : nextWidth,
        height: nextHeight
      })
    );
  };

  const PRESETS = formatMessage(translations.presets);

  return (
    <ToolPanel title={translations.simulatorPanel}>
      <div className={classes.panelBodyInner}>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <TextField
              id="standard-basic"
              label="Width"
              name="width"
              type="number"
              margin="normal"
              placeholder="auto"
              onKeyUp={onDimensionKeyUp}
              onChange={(e) => setWidth(e.target.value)}
              value={width}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              id="standard-basic"
              label="Height"
              type="number"
              name="height"
              margin="normal"
              placeholder="auto"
              onKeyUp={onDimensionKeyUp}
              onChange={(e) => setHeight(e.target.value)}
              value={height}
            />
          </Grid>
          <Grid item xs={4} className={classes.simulatorFlipColumn}>
            <IconButton onClick={onFlipDimensions} className={classes.simulatorFlipButton}>
              <ScreenRotationRounded />
            </IconButton>
          </Grid>
        </Grid>
        <Divider />
        <FormControl component="fieldset" className={classes.presetFieldset}>
          <FormLabel component="legend">{PRESETS}</FormLabel>
          <RadioGroup value={preset} onChange={handlePresetChange} aria-label={PRESETS} name="words.device">
            <FormControlLabel
              value={SIMULATOR_PANEL_CUSTOM_MODE}
              control={<Radio />}
              label={formatMessage(translations.custom)}
              disabled={true}
            />
            <FormControlLabel
              value={SIMULATOR_PANEL_RESPONSIVE_MODE}
              control={<Radio />}
              label={formatMessage(translations.previewWindowSize)}
            />
            {devices.map((device) => (
              <FormControlLabel
                key={device.value}
                value={device.value}
                control={<Radio />}
                label={formatMessage(getTranslation(device.title, translations))}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </div>
    </ToolPanel>
  );
}
