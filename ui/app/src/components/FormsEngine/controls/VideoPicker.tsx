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

import React, { MouseEvent as ReactMouseEvent, useMemo } from 'react';
import { ControlProps } from '../types';
import { FormsEngineField } from '../common/FormsEngineField';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@mui/icons-material';
import { AllowedPathsData } from '../common/ContentPicker';
import useContentTypes from '../../../hooks/useContentTypes';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import ListItemText from '@mui/material/ListItemText';
import { FormattedMessage } from 'react-intl';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { svgIconClasses } from '@mui/material';
import useEnv from '../../../hooks/useEnv';

export interface VideoPickerProps extends ControlProps {
  value: string;
}

const videoDataSourcesTypesMap = {
  'video-browse-repo': 'browse',
  'video-desktop-upload': 'upload'
};

type PickerType = 'browse' | 'upload';

// TODO: video datasource supports search
export function VideoPicker(props: VideoPickerProps) {
  const { field, value, contentType } = props;
  const { guestBase } = useEnv();
  // For testing, by using 3000 as the guestBase both the fetch in `useImageInfo` and the download functionality will work
  // const guestBase = 'http://localhost:3000';
  const hasValue = Boolean(value);

  const contentTypes = useContentTypes();
  // TODO: pretty similar to the one in ImagePicker
  const { menuOptions, allowedBrowsePaths, allowedUploadPaths } = useMemo(() => {
    const dataSourceIds = field.properties.videoManager.value.split(',');
    console.log('dataSourceIds', dataSourceIds);
    // TODO: video datasource supports 'search' too
    const allowedBrowsePaths: AllowedPathsData[] = [];
    const allowedUploadPaths: AllowedPathsData[] = [];

    contentTypes[contentType.id].dataSources.forEach((ds) => {
      console.log('ds', ds);
      if (dataSourceIds.includes(ds.id)) {
        // TODO: when adding other DS (like s3 and webdav, check if property is 'repoPath' too
        if (videoDataSourcesTypesMap[ds.type] === 'browse') {
          allowedBrowsePaths.push({
            title: ds.title,
            path: ds.properties.repoPath
          });
        } else if (videoDataSourcesTypesMap[ds.type] === 'upload') {
          allowedUploadPaths.push({
            title: ds.title,
            path: ds.properties.repoPath
          });
        } else {
          console.warn(`Unknown data source type "${ds.type}" for Video Picker control`, ds);
        }
      }
    });

    const menuOptions = [];
    const handleDataSourceOptionClick = (event: ReactMouseEvent<HTMLLIElement, MouseEvent>, option: PickerType) => {};
    if (allowedBrowsePaths.length > 0) {
      menuOptions.push(
        <MenuItem key="search" onClick={(event) => handleDataSourceOptionClick(event, 'browse')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <TravelExploreOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Browse" />} />
        </MenuItem>
      );
    }
    if (allowedUploadPaths.length > 0) {
      menuOptions.push(
        <MenuItem key="upload" onClick={(event) => handleDataSourceOptionClick(event, 'upload')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <UploadFileOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Upload" />} />
        </MenuItem>
      );
    }

    return {
      menuOptions,
      allowedBrowsePaths,
      allowedUploadPaths
    };
  }, [contentType.id, contentTypes, field]);

  return (
    <>
      <FormsEngineField field={field}>
        {hasValue ? (
          <Card sx={{ display: 'flex' }}>
            <CardMedia component="video" sx={{ width: '40%' }} image={`${guestBase}${value}`} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography component="div" variant="body1" marginBottom={1}>
                  {value}
                </Typography>
                <Typography variant="body2" component="div" color="textSecondary" marginBottom={1}>
                  video/mp4
                  <br />
                  800 x 600
                  <br />
                  1300Kb
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    // ref={addMenuButtonRef}
                    onClick={() => {
                      // setAddMenuOpen(true);
                    }}
                  >
                    <EditOutlined />
                  </IconButton>
                  <IconButton component="a" size="small" onClick={() => {}}>
                    <DownloadOutlined />
                  </IconButton>
                  <IconButton size="small" onClick={() => {}}>
                    <DeleteOutlined />
                  </IconButton>
                </Box>
              </CardContent>
            </Box>
          </Card>
        ) : (
          // TODO: same as in NodeSelector and ImagePicker
          <Box
            children={menuOptions}
            sx={{
              p: 1,
              gap: 1,
              py: 0.5,
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              color: 'primary.main',
              justifyContent: 'center',
              [`.${svgIconClasses.root}`]: {
                color: 'primary.main'
              },
              [`.${menuItemClasses.root}`]: {
                flexDirection: 'column',
                justifyContent: 'center',
                borderRadius: 1
              },
              [`.${listItemIconClasses.root}`]: {
                justifyContent: 'center'
              }
            }}
          />
        )}
      </FormsEngineField>
    </>
  );
}

export default VideoPicker;
