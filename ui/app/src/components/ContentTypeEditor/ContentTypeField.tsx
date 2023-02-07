/*
 * Copyright (C) 2007-2023 Crafter Software Corporation. All Rights Reserved.
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
import { ContentTypeField as ContentTypeFieldType } from '../../models';
import Chip from '@mui/material/Chip';
import getStyles from './styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { FormattedMessage, useIntl } from 'react-intl';
import translations from './translations';
import Button from '@mui/material/Button';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FIELD_DROPPABLE_TYPE } from './utils';

export interface ContentTypeFieldProps {
  field: ContentTypeFieldType;
  sectionId: string;
}

function SingleField(props: ContentTypeFieldProps) {
  const { name, id, type } = props.field;
  const sx = getStyles();

  return (
    <Chip
      label={
        <>
          <Box
            component="span"
            sx={{
              ...sx.semibold,
              ml: 1
            }}
          >
            {name}
          </Box>{' '}
          ({id}) • {type}
        </>
      }
      sx={sx.contentTypeSingleField}
      color="default"
    />
  );
}

function RepeatField(props: ContentTypeFieldProps) {
  const { field, sectionId } = props;
  const { name, fields } = field;
  const sx = getStyles();
  const { formatMessage } = useIntl();

  return (
    <Paper sx={sx.contentTypeRepeatField}>
      <Typography sx={{ mb: 1 }}>
        <strong>{formatMessage(translations.repeat)}</strong>: {name}
      </Typography>
      <Droppable droppableId={sectionId} type={FIELD_DROPPABLE_TYPE + '-test'}>
        {(provided, snapshot) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {Object.values(fields).map((field, index) => (
              <Draggable key={field.name} index={index} draggableId={`${sectionId}|${field.name}`}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <ContentTypeField field={field} sectionId={`${sectionId}|${field.name}`} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <Button variant="outlined" fullWidth sx={{ borderStyle: 'dashed !important', borderRadius: '4px' }}>
        <FormattedMessage id="contentTypeEditor.addFields" defaultMessage="Add Fields" />
      </Button>
    </Paper>
  );
}

export function ContentTypeField(props: ContentTypeFieldProps) {
  const { field, sectionId } = props;

  if (field.type === 'repeat') {
    return <RepeatField field={field} sectionId={sectionId} />;
  } else {
    return <SingleField field={field} sectionId={sectionId} />;
  }
}

export default ContentTypeField;
