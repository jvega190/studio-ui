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

import { useFormsEngineContext, useFormsEngineContextApi } from '../formsEngineContext';
import Box from '@mui/material/Box';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { svgIconClasses } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@mui/icons-material';
import { FormsEngineField } from '../common/FormsEngineField';
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
import { BrowseFilesDialogProps } from '../../BrowseFilesDialog';
import { SingleFileUploadDialogProps } from '../../SingleFileUploadDialog';
import useActiveSiteId from '../../../hooks/useActiveSiteId';
import { FileUploadResult } from '../../SingleFileUpload';
import { ensureSingleSlash } from '../../../utils/string';
import useImageInfo from '../../../hooks/useImageInfo';
import { MediaItem } from '../../../models';
import Dialog from '@mui/material/Dialog';
import { DialogHeader } from '../../DialogHeader';
import { DialogBody } from '../../DialogBody';
import { AllowedPathsData, ContentPicker } from '../common/ContentPicker';
import SearchRounded from '@mui/icons-material/SearchRounded';
import useUpdateRefs from '../../../hooks/useUpdateRefs';
import { useDispatch } from 'react-redux';
import { popDialog, pushDialog, pushNonDialog } from '../../../state/actions/dialogStack';
import { nanoid } from 'nanoid';
import { SearchProps } from '../../Search';
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

type PickerType = 'browse' | 'upload' | 'search';

export function ImagePicker(props: ImagePickerProps) {
  const { field, value, contentType, autoFocus } = props;

  const siteId = useActiveSiteId();
  const { guestBase } = useEnv();
  // For testing, by using 3000 as the guestBase both the fetch in `useImageInfo` and the download functionality will work
  // const guestBase = 'http://localhost:3000';
  const { item: contextItem, pathInProject, values } = useFormsEngineContext();
  const api = useFormsEngineContextApi();
  const imageInfo = useImageInfo(`${guestBase}${value}`);
  const hasValue = Boolean(value);
  const addMenuButtonRef = useRef<HTMLButtonElement>();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const [openPickerDialog, setOpenPickerDialog] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const contentTypes = useContentTypes();
  const dataSourceSummary = useMemo(() => {
    const allowedBrowsePaths: AllowedPathsData[] = [];
    const allowedUploadPaths: AllowedPathsData[] = [];
    const allowedSearchPaths: AllowedPathsData[] = [];
    const dataSourceIds = (field.properties.imageManager.value as string).split(',');

    contentTypes[contentType.id].dataSources.forEach((ds) => {
      if (dataSourceIds.includes(ds.id)) {
        if (imageDataSourcesTypesMap[ds.type] === 'browse') {
          if (ds.properties.useSearch) {
            allowedSearchPaths.push({
              title: ds.title,
              path: ds.properties.repoPath || ds.properties.path
            });
          } else {
            allowedBrowsePaths.push({
              title: ds.title,
              path: ds.properties.repoPath || ds.properties.path
            });
          }
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

    return {
      allowedBrowsePaths,
      allowedUploadPaths,
      allowedSearchPaths
    };
  }, [contentType.id, contentTypes, field]);
  const { allowedBrowsePaths, allowedUploadPaths, allowedSearchPaths } = dataSourceSummary;
  const executeDataSourceOption = (optionType: PickerType, choice: AllowedPathsData) => {
    const processPath = (path: string) =>
      processPathMacros({
        path,
        objectId: values.objectId as string,
        fullParentPath: contextItem?.path ?? pathInProject
      });

    switch (optionType) {
      case 'browse': {
        const id = nanoid();
        dispatch(
          pushDialog({
            id,
            component: 'craftercms.components.BrowseFilesDialog',
            props: {
              path: processPath(choice.path),
              allowUpload: false,
              onSuccess(imageData: MediaItem) {
                api.updateValue(field.id, imageData.path);
                dispatch(popDialog({ id }));
              }
            } as BrowseFilesDialogProps
          })
        );
        break;
      }
      case 'search': {
        const id = nanoid();
        dispatch(
          pushNonDialog({
            id,
            component: 'craftercms.components.Search',
            props: {
              mode: 'select',
              embedded: true,
              initialParameters: {
                path: ensureSingleSlash(`${processPath(choice.path)}/.+`),
                sortBy: 'internalName'
              },
              onAcceptSelection(images) {
                // TODO: how do I set Search to single selection?
                api.updateValue(field.id, images[0]);
                dispatch(popDialog({ id }));
              }
            } as SearchProps
          })
        );
        break;
      }
      case 'upload': {
        const id = nanoid();
        dispatch(
          pushDialog({
            id,
            component: 'craftercms.components.SingleFileUploadDialog',
            props: {
              site: siteId,
              path: processPath(choice.path),
              fileTypes: ['image/*'],
              onUploadComplete(result: FileUploadResult) {
                if (result.successful.length) {
                  const newValue = ensureSingleSlash(
                    `${result.successful[0].meta.path}/${result.successful[0].meta.name}`
                  );
                  api.updateValue(field.id, newValue);
                  dispatch(popDialog({ id }));
                }
              }
            } as SingleFileUploadDialogProps
          })
        );
        break;
      }
    }
  };
  const handleDataSourceOptionClick = (event: ReactMouseEvent<HTMLLIElement, MouseEvent>, option: PickerType) => {
    setAddMenuOpen(false);
    switch (option) {
      case 'browse': {
        if (allowedBrowsePaths.length === 1) {
          executeDataSourceOption('browse', allowedBrowsePaths[0]);
        } else {
          // Open browse picker
          setPickerType('browse');
          setOpenPickerDialog(true);
        }
        break;
      }
      case 'upload': {
        if (allowedUploadPaths.length === 1) {
          executeDataSourceOption('upload', allowedBrowsePaths[0]);
        } else {
          // Open upload picker
          setPickerType('upload');
          setOpenPickerDialog(true);
        }
        break;
      }
      case 'search': {
        if (allowedSearchPaths.length === 1) {
          executeDataSourceOption('search', allowedSearchPaths[0]);
        } else {
          // Open search picker
          setPickerType('search');
          setOpenPickerDialog(true);
        }
      }
    }
  };
  const handleDataSourcePickerDialogChange = (event, choice: AllowedPathsData) => {
    executeDataSourceOption(pickerType, choice);
    setOpenPickerDialog(false);
  };
  const memoRefs = useUpdateRefs({ handleDataSourceOptionClick });
  const menuOptions = useMemo(() => {
    const { allowedBrowsePaths, allowedUploadPaths, allowedSearchPaths } = dataSourceSummary;
    const menuOptions = [];

    if (allowedBrowsePaths.length > 0) {
      menuOptions.push(
        <MenuItem key="browse" onClick={(event) => memoRefs.current.handleDataSourceOptionClick(event, 'browse')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <TravelExploreOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Browse" />} />
        </MenuItem>
      );
    }
    if (allowedSearchPaths.length > 0) {
      menuOptions.push(
        <MenuItem key="search" onClick={(event) => memoRefs.current.handleDataSourceOptionClick(event, 'search')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <SearchRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Search" />} />
        </MenuItem>
      );
    }
    if (allowedUploadPaths.length > 0) {
      menuOptions.push(
        <MenuItem key="upload" onClick={(event) => memoRefs.current.handleDataSourceOptionClick(event, 'upload')}>
          <ListItemIcon sx={{ mr: 0 }}>
            <UploadFileOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText children={<FormattedMessage defaultMessage="Upload" />} />
        </MenuItem>
      );
    }
    return menuOptions;
    // TODO: check readonly in NodeSelector control
  }, [memoRefs, dataSourceSummary]);
  const handleRemoveImage = () => {
    api.updateValue(field.id, null);
  };
  const onDownload = () => {
    const link = document.createElement('a');
    link.href = `${guestBase}${value}`;
    link.download = getFileNameFromPath(value); // Extracts the file name from the URL
    link.click();
  };
  const handleClosePickerDialog = () => setOpenPickerDialog(false);

  return (
    <>
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
                    onChange={handleDataSourcePickerDialogChange}
                  />
                );
              case 'upload':
                return (
                  <ContentPicker
                    label={<FormattedMessage defaultMessage="Upload Settings" />}
                    allowedPaths={allowedUploadPaths}
                    onChange={handleDataSourcePickerDialogChange}
                  />
                );
              case 'search':
                return <>search</>;
            }
          })()}
        </DialogBody>
      </Dialog>
      <FormsEngineField field={field}>
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
      </FormsEngineField>
    </>
  );
}

export default ImagePicker;
