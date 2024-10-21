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
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { FormEngineField } from '../common/FormEngineField';
import { ControlProps } from '../types';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemButton from '@mui/material/ListItemButton';
import { FormattedMessage } from 'react-intl';
import Tooltip from '@mui/material/Tooltip';
import { MouseEvent as ReactMouseEvent } from 'react';
import Avatar from '@mui/material/Avatar';
import { StackedButton } from '../common/StackedButton';

export type RepeatItem = Record<string, unknown>;

export interface RepeatProps extends ControlProps {
  value: RepeatItem[];
}

export function Repeat(props: RepeatProps) {
  const { field, value, setValue } = props;
  const [, apiRef] = useFormEngineContext();
  const hasContent = value.length;

  const handleRemoveItem = (event: ReactMouseEvent, index: number) => {
    event.stopPropagation();
    const nextValue = value.concat();
    nextValue.splice(index, 1);
    setValue(nextValue);
  };
  const handleEditItem = (event: ReactMouseEvent, item: RepeatItem, index: number) => {
    // console.log('Edit repeat item', item);
    // const nextValue = value.concat();
    // setValue(nextValue);
    apiRef.current.pushForm({ repeat: { fieldId: field.id, values: item, index } });
  };
  const handleAddItem: IconButtonProps['onClick'] = (e) => {};
  return (
    <>
      <FormEngineField
        field={field}
        min={field.validations.minCount?.value}
        max={field.validations.maxCount?.value}
        length={value.length}
        actions={
          <Tooltip title={<FormattedMessage defaultMessage="Add item" />}>
            <IconButton size="small" color="primary" onClick={handleAddItem}>
              <AddRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      >
        <Box
          sx={{
            border: 1,
            display: 'flex',
            borderColor: 'divider',
            borderRadius: 1,
            ...(hasContent ? { flexDirection: 'column' } : { flexDirection: 'column', borderStyle: 'dashed' })
          }}
        >
          {hasContent ? (
            <List dense>
              {value.map((item, index) => {
                return (
                  <ListItemButton
                    key={index}
                    divider={index !== value.length - 1}
                    onClick={(e) => handleEditItem(e, item, index)}
                  >
                    <ListItemText
                      primary={<FormattedMessage defaultMessage="Item # {num}" values={{ num: index + 1 }} />}
                      secondary={JSON.stringify(item)}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                    <ListItemSecondaryAction sx={{ position: 'static', display: 'flex', transform: 'none' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={<FormattedMessage defaultMessage="Delete" />}>
                        <IconButton size="small" onClick={(e) => handleRemoveItem(e, index)}>
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                );
              })}
            </List>
          ) : (
            <>
              <StackedButton>
                <Avatar variant="circular">
                  <AddRounded />
                </Avatar>
                <FormattedMessage defaultMessage="Add" />
              </StackedButton>
            </>
          )}
        </Box>
      </FormEngineField>
    </>
  );
}

export default Repeat;
