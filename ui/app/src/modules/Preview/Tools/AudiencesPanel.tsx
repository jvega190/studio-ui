/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import React, { useState, useEffect, useReducer } from 'react';
import ToolPanel from './ToolPanel';
import { defineMessages, FormattedMessage } from 'react-intl';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { getAudiencesPanelConfig, AudiencesPanelDescriptor } from '../../../services/configuration';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import Button from '@material-ui/core/Button';
import { get } from '../../../utils/ajax';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      margin: theme.spacing(1),
    },
    formControl: {
      width: '100%',
      '& .MuiFormGroup-root': {
        marginLeft: '10px',
      },
      '& .MuiInputBase-root': {
        marginTop: '12px !important',
      }
    },
    IconButton: {
      padding: '6px',
      marginLeft: '5px'
    },
    InputLabel: {
      position: 'relative'
    },
    PanelMargin: {
      margin: '0 15px',
    },
    textField: {
      width: '100%',
    },
    actionBTN:{
      margin:'18px 0 80px 15px',
      '& .MuiButton-contained':{
        marginRight: '8px',
      }
    },
    divider: {
      margin: '23px 0 10px',
    }
  }),
);

const translations = defineMessages({
  audiencesPanel: {
    id: 'craftercms.ice.audiences.title',
    defaultMessage: 'Audience Targeting'
  }
});

interface AudiencesPanelUIProps {
  config: any;
  profile: any;
  onFormChange: Function;
}

interface AudiencesFormProps {
  property: AudiencesPanelDescriptor;
  value: string;
  onFormChange: Function;
}

export function AudiencesPanelUI(props: AudiencesPanelUIProps) {

  const classes = useStyles({});
  const {
    config,
    profile,
    onFormChange
  } = props;

  return (
    <ToolPanel title={translations.audiencesPanel}>
      {
        config ? (
          <>
            <Grid className={classes.PanelMargin}>
              {
                config.map((property: any, index: number) => (
                  <div key={index}>
                    <GetCodeDependingType
                      property={property}
                      value={profile[property.name]}
                      onFormChange={onFormChange}
                    />
                    <Divider className={classes.divider} />
                  </div>
                ))
              }
            </Grid>
            <Grid className={classes.actionBTN} >
              <Button variant="contained">
                <FormattedMessage
                  id="audiencesPanel.defaults"
                  defaultMessage={`Defaults`}
                />
              </Button>
              <Button variant="contained" color="primary" >
                <FormattedMessage
                  id="audiencesPanel.apply"
                  defaultMessage={`Apply`}
                />
              </Button>
            </Grid>
          </>
        ) : (null)
      }
    </ToolPanel>
  );
}

export default function AudiencesPanel() {

  const [config, setConfig] = useState();
  const [profile, setProfile] = useState();
  const site = 'editorial';   // TODO: get from state

  useEffect(() => {

    forkJoin([
      getAudiencesPanelConfig(site),
      get(`/api/1/profile/get`).pipe(map(response => response.response))
    ]).subscribe(
      // Here code that needs both files
      ([config, profile]) => {
        setConfig(
          config.properties
        );
        setProfile(
          profile
        );
      },
      () => {
        setConfig(
          []
        );
        setProfile(
          {}
        );
      }
    );
  }, []);

  useEffect(() => {
    console.log("PROFILE", profile);
  }, [profile]);

  const onFormChange = (name: string, value: string) => {
    setProfile({ ...profile, [name]: value });
  };

  return (
    <div>
      {
        config && profile &&
        <AudiencesPanelUI
          config={config}
          profile={profile}
          onFormChange={onFormChange}
        />
      }
    </div>
  );

}

function GetCodeDependingType(props: AudiencesFormProps) {

  const classes = useStyles({});
  const {
    property,
    value,
    onFormChange
  } = props;

  const handleSelectChange = (name: string) => (event: React.ChangeEvent<{ value: unknown }>) => {
    onFormChange(name, event.target.value);
  };

  const handleInputChange = (name: string, label?: string, values?: string[]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();

    if(e.target.type === 'text') {
      onFormChange(name, e.target.value);
    } else if (e.target.type === 'checkbox') {
      if (e.target.checked) {
        if (!(label in values)) {
          values.push(label);
        }
      } else {
        values.splice( values.indexOf(label), 1);
      }
      onFormChange(name, values.join(','));
    }
  };

  switch (property.type) {
    case "dropdown":
      return (
        <Grid item xs={12}>
          <FormControl className={classes.formControl} >
            <InputLabel
              className={classes.InputLabel}
              focused={true}
              htmlFor={property.name}
            >
              {property.label}
              <Tooltip title={property.hint} placement="top" >
                <IconButton aria-label={property.hint} className={classes.IconButton}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </InputLabel>
            <Select
              labelId={property.name}
              id={property.name}
              defaultValue={value ? value : property.default_value}
              onChange={handleSelectChange(property.name)}
            >
              {
                property.possible_values ? (
                  property.possible_values.map((possible_value: any, index: number) => (
                    <MenuItem value={possible_value.value} key={index}>{possible_value.value}</MenuItem>
                  ))
                ) : (null)
              }
            </Select>
            <FormHelperText>{property.description}</FormHelperText>
          </FormControl>
        </Grid>
      )
    case "checkboxes":
      const values = value ?? property.default_value,
            valuesArray = values.split(',');

      return (
        <Grid item xs={12}>
          <FormControl className={classes.formControl} >
            <InputLabel
              className={classes.InputLabel}
              focused={true}
              htmlFor={property.name}
            >
              {property.label}
              <Tooltip title={property.hint} placement="top" >
                <IconButton aria-label={property.hint} className={classes.IconButton}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </InputLabel>
            {
              property.possible_values ? (
                property.possible_values.map((possible_value: any, index: number) => (
                  <FormControlLabel
                    key={index}
                    htmlFor={property.name}
                    control={
                      <Checkbox
                        color="primary"
                        checked={valuesArray.includes(possible_value.value)}
                        onChange={handleInputChange(property.name, possible_value.value, valuesArray)}
                      />
                    }
                    label={possible_value.value} />
                ))
              ) : (null)
            }
            <FormHelperText>{property.description}</FormHelperText>
          </FormControl>
        </Grid>
      )
    case "datetime":
      return (
        <Grid item xs={12}>
          <FormControl className={classes.formControl} >
            <InputLabel
              className={classes.InputLabel}
              focused={true}
              htmlFor={property.name}
            >
              {property.label}
              <Tooltip title={property.hint} placement="top" >
                <IconButton aria-label={property.hint} className={classes.IconButton}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </InputLabel>
            <TextField
              id={property.name}
              type="text"
              name="input"
              placeholder="auto"
              fullWidth
              helperText={property.description}
            />
          </FormControl>
        </Grid>
      )
    default:
      return (
        <Grid item xs={12}>
          <FormControl className={classes.formControl} >
            <InputLabel
              className={classes.InputLabel}
              focused={true}
              htmlFor={property.name}
            >
              {property.label}
              <Tooltip title={property.hint} placement="top" >
                <IconButton aria-label={property.hint} className={classes.IconButton}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </InputLabel>
            <TextField
              id={property.name}
              type="text"
              name="input"
              placeholder="auto"
              fullWidth
              defaultValue={ value ? value : property.default_value }
              helperText={property.description}
              onChange={handleInputChange(property.name)}
            />
          </FormControl>
        </Grid>
      )
  }
}
