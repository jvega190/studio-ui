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

import { useFormEngineContext } from '../formEngineContext';
import Box from '@mui/material/Box';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { svgIconClasses } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@mui/icons-material';
import { FormEngineField } from '../common/FormEngineField';
import { ControlProps } from '../types';
import React, { MouseEvent as ReactMouseEvent, useMemo, useRef, useState } from 'react';
import useContentTypes from '../../../hooks/useContentTypes';
import { FormattedMessage } from 'react-intl';
import Menu from '@mui/material/Menu';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { getFileNameFromPath, processPathMacros } from '../../../utils/path';
import BrowseFilesDialog, { BrowseFilesDialogProps } from '../../BrowseFilesDialog';
import { SingleFileUploadDialog, SingleFileUploadDialogProps } from '../../SingleFileUploadDialog';
import useSpreadState from '../../../hooks/useSpreadState';
import useActiveSiteId from '../../../hooks/useActiveSiteId';
import { FileUploadResult } from '../../SingleFileUpload';
import { ensureSingleSlash } from '../../../utils/string';
import useImageInfo from '../../../hooks/useImageInfo';
import { MediaItem } from '../../../models';
import Dialog from '@mui/material/Dialog';
import { DialogHeader } from '../../DialogHeader';
import { DialogBody } from '../../DialogBody';
import { AllowedPathsData, ContentPicker } from '../common/ContentPicker';
import useEnv from '../../../hooks/useEnv';

export interface ImagePickerProps extends ControlProps {
  value: string;
}

const imageDataSourcesTypesMap = {
  'img-repository-upload': 'browse',
  'img-desktop-upload': 'upload',
  'img-S3-repo': 'browse',
  'img-S3-upload': 'upload',
  'img-WebDAV-repo': 'browse',
  'img-WebDAV-upload': 'upload'
};

export interface ImagePickerProps extends ControlProps {
  value: string;
}

type PickerType = 'browse' | 'upload';

export function ImagePicker(props: ImagePickerProps) {
  const { field, value, contentType } = props;

  const siteId = useActiveSiteId();
  const { guestBase } = useEnv();
  // For testing, by using 3000 as the guestBase both the fetch in `useImageInfo` and the download functionality will work
  // const guestBase = 'http://localhost:3000';
  const [, apiRef] = useFormEngineContext();
  const imageInfo = useImageInfo(`${guestBase}${value}`);
  const hasValue = Boolean(value);
  const addMenuButtonRef = useRef<HTMLButtonElement>();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [openPickerDialog, setOpenPickerDialog] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [browseDialogState, setBrowseDialogState] = useSpreadState<BrowseFilesDialogProps>({
    path: '',
    open: false,
    allowUpload: false
  });
  const [uploadDialogState, setUploadDialogState] = useSpreadState<
    Omit<SingleFileUploadDialogProps, 'site' | 'onClose'>
  >({
    open: false,
    path: '',
    fileTypes: ['image/*']
  });
  const contentTypes = useContentTypes();
  const { menuOptions, allowedBrowsePaths, allowedUploadPaths } = useMemo(() => {
    const dataSourceIds = field.properties.imageManager.value.split(',');
    const allowedBrowsePaths: AllowedPathsData[] = [];
    const allowedUploadPaths: AllowedPathsData[] = [];

    contentTypes[contentType.id].dataSources.forEach((ds) => {
      if (dataSourceIds.includes(ds.id)) {
        if (imageDataSourcesTypesMap[ds.type] === 'browse') {
          allowedBrowsePaths.push({
            title: ds.title,
            path: ds.properties.repoPath || ds.properties.path
          });
        } else if (imageDataSourcesTypesMap[ds.type] === 'upload') {
          // TODO: check if prop is always 'repoPath'
          allowedUploadPaths.push({
            title: ds.title,
            path: ds.properties.repoPath
          });
        } else {
          console.warn(`Unknown data source type "${ds.type}" for Image Picker control`, ds);
        }
      }
    });

    const menuOptions = [];
    const handleDataSourceOptionClick = (event: ReactMouseEvent<HTMLLIElement, MouseEvent>, option: PickerType) => {
      setAddMenuOpen(false);
      switch (option) {
        case 'browse': {
          if (allowedBrowsePaths.length === 1) {
            setBrowseDialogState({
              open: true,
              path: processPathMacros({ path: allowedBrowsePaths[0].path })
            });
          } else {
            // Open browse picker
            setPickerType('browse');
            setOpenPickerDialog(true);
          }
          break;
        }
        case 'upload': {
          if (allowedUploadPaths.length === 1) {
            setUploadDialogState({
              open: true,
              path: processPathMacros({ path: allowedUploadPaths[0].path })
            });
          } else {
            // Open upload picker
            setPickerType('upload');
            setOpenPickerDialog(true);
          }
          break;
        }
      }
    };
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
  }, [contentType.id, contentTypes, field, setBrowseDialogState, setUploadDialogState]);

  const handleRemoveImage = () => {
    apiRef.current.updateValue(field.id, null);
  };
  const onDownload = () => {
    const link = document.createElement('a');
    link.href = `${guestBase}${value}`;
    link.download = getFileNameFromPath(value); // Extracts the file name from the URL
    link.click();
  };
  const handleBrowseDialogClose = () => setBrowseDialogState({ open: false });
  const handleBrowseDialogSuccess = (imageData: MediaItem) => {
    apiRef.current.updateValue(field.id, imageData.path);
    handleBrowseDialogClose();
  };
  const handleClosePickerDialog = () => setOpenPickerDialog(false);

  return (
    <>
      <BrowseFilesDialog
        {...browseDialogState}
        onClose={handleBrowseDialogClose}
        onSuccess={handleBrowseDialogSuccess}
      />
      <SingleFileUploadDialog
        {...uploadDialogState}
        site={siteId}
        onClose={() => setUploadDialogState({ open: false })}
        onUploadComplete={(result: FileUploadResult) => {
          if (result.successful.length) {
            const newValue = ensureSingleSlash(`${result.successful[0].meta.path}/${result.successful[0].meta.name}`);
            apiRef.current.updateValue(field.id, newValue);
            setUploadDialogState({ open: false });
          }
        }}
      />
      <Menu
        anchorEl={addMenuButtonRef.current}
        open={addMenuOpen}
        onClose={() => setAddMenuOpen(false)}
        sx={{
          [`.${menuItemClasses.root}`]: { pl: 3 }
        }}
        children={menuOptions}
      />
      <Dialog open={openPickerDialog} onClose={handleClosePickerDialog} fullWidth maxWidth="sm">
        <DialogHeader
          title={<FormattedMessage defaultMessage="Choose how to proceed" />}
          onCloseButtonClick={handleClosePickerDialog}
        />
        <DialogBody>
          {(() => {
            switch (pickerType) {
              case 'browse':
                return (
                  <ContentPicker
                    label={<FormattedMessage defaultMessage="Browse Settings" />}
                    allowedPaths={allowedBrowsePaths}
                    onChange={(e, choice) => {
                      handleClosePickerDialog();
                      // TODO: this doesn't work yet with s3 or webdav
                      setBrowseDialogState({
                        open: true,
                        path: processPathMacros({ path: choice.path })
                      });
                    }}
                  />
                );
              case 'upload':
                return (
                  <ContentPicker
                    label={<FormattedMessage defaultMessage="Upload Settings" />}
                    allowedPaths={allowedUploadPaths}
                    onChange={(e, choice) => {
                      handleClosePickerDialog();
                      // TODO: this doesn't work yet with s3 or webdav
                      setUploadDialogState({
                        open: true,
                        path: processPathMacros({ path: choice.path })
                      });
                    }}
                  />
                );
            }
          })()}
        </DialogBody>
      </Dialog>
      <FormEngineField field={field}>
        {hasValue ? (
          <Card sx={{ display: 'flex' }}>
            <CardMedia component="img" sx={{ width: '40%' }} image={`${guestBase}${value}`} alt={value} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography component="div" variant="body1" marginBottom={1}>
                  {value}
                </Typography>
                <Typography variant="body2" component="div" color="textSecondary" marginBottom={1}>
                  {imageInfo?.contentType}
                  <br />
                  {imageInfo?.width} x {imageInfo?.height}
                  <br />
                  {imageInfo?.size}Kb
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    ref={addMenuButtonRef}
                    onClick={() => {
                      setAddMenuOpen(true);
                    }}
                  >
                    <EditOutlined />
                  </IconButton>
                  <IconButton component="a" size="small" onClick={() => onDownload()}>
                    <DownloadOutlined />
                  </IconButton>
                  <IconButton size="small" onClick={handleRemoveImage}>
                    <DeleteOutlined />
                  </IconButton>
                </Box>
              </CardContent>
            </Box>
          </Card>
        ) : (
          // TODO: same as NodeSelector and VideoPicker
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
      </FormEngineField>
    </>
  );
}

export default ImagePicker;
