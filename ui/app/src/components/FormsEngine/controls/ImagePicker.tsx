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

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@mui/icons-material';
import { FormEngineField } from '../common/FormEngineField';
import useEnv from '../../../hooks/useEnv';
import { ControlProps } from '../types';
import { StackedButton } from '../common/StackedButton';
import { FormattedMessage } from 'react-intl';

export interface ImagePickerProps extends ControlProps {
  value: string;
}

export function ImagePicker(props: ImagePickerProps) {
  const { field, value } = props;
  const { guestBase } = useEnv();
  const hasValue = Boolean(value);
  return (
    <FormEngineField field={field}>
      {hasValue ? (
        <Card sx={{ display: 'flex' }}>
          <CardMedia
            component="img"
            sx={{ width: '40%' }}
            image={`${guestBase}${value}`}
            alt="Live from space album cover"
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: '1 0 auto' }}>
              <Typography component="div" variant="body1" marginBottom={1}>
                /static/images/cards/live-from-space.jpg
              </Typography>
              <Typography variant="body2" component="div" color="textSecondary" marginBottom={1}>
                image/webp
                <br />
                640x427
                <br />
                12.3Kb
              </Typography>
              <Box>
                <IconButton size="small">
                  <EditOutlined />
                </IconButton>
                <IconButton size="small">
                  <DownloadOutlined />
                </IconButton>
                <IconButton size="small">
                  <DeleteOutlined />
                </IconButton>
              </Box>
            </CardContent>
          </Box>
        </Card>
      ) : (
        <Box
          sx={{
            p: 2,
            border: 1,
            borderRadius: 1,
            borderColor: 'divider',
            borderStyle: 'dashed',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <StackedButton>
            <Avatar variant="circular">
              <UploadFileOutlinedIcon />
            </Avatar>
            <FormattedMessage defaultMessage="Upload" />
          </StackedButton>
          <StackedButton>
            <Avatar variant="circular">
              <UploadFileOutlinedIcon />
            </Avatar>
            <FormattedMessage defaultMessage="Browse" />
          </StackedButton>
          <StackedButton>
            <Avatar variant="circular">
              <UploadFileOutlinedIcon />
            </Avatar>
            <FormattedMessage defaultMessage="Search" />
          </StackedButton>
        </Box>
      )}
    </FormEngineField>
  );
}

export default ImagePicker;
