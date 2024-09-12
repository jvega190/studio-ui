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

import { CompareVersionsDialogContainerProps, hasFieldChanged } from './utils';
import React, { useEffect, useRef, useState } from 'react';
import { CompareVersions } from './CompareVersions';
import DialogBody from '../DialogBody/DialogBody';
import { LoadingState } from '../LoadingState';
import useSpreadState from '../../hooks/useSpreadState';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { forkJoin } from 'rxjs';
import { fetchContentByCommitId } from '../../services/content';
import { fromString } from '../../utils/xml';
import { getContentInstanceValueFromProp, parseContentXML } from '../../utils/content';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { ResizeableDrawer } from '../ResizeableDrawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ContentTypeField } from '../../models';

export function CompareVersionsDialogContainer(props: CompareVersionsDialogContainerProps) {
  const { selectedA, selectedB, versionsBranch, contentTypesBranch, compareXml } = props;
  const { compareVersionsBranch, item } = versionsBranch;
  const compareMode = selectedA && selectedB;
  const [selectionContent, setSelectionContent] = useSpreadState({
    contentA: null,
    contentB: null,
    contentAXml: null,
    contentBXml: null
  });
  const siteId = useActiveSiteId();
  const isCompareDataReady =
    compareVersionsBranch?.compareVersions &&
    contentTypesBranch?.byId &&
    item?.contentTypeId &&
    selectionContent.contentA &&
    selectionContent.contentB;
  const contentTypeFields = isCompareDataReady
    ? Object.values(contentTypesBranch.byId[item.contentTypeId].fields).filter((field) =>
        hasFieldChanged(
          field,
          getContentInstanceValueFromProp(selectionContent.contentA, field.id),
          getContentInstanceValueFromProp(selectionContent.contentB, field.id)
        )
      )
    : [];
  const [selectedField, setSelectedField] = useState(null);
  const fieldRefs = useRef({});
  contentTypeFields?.forEach((field) => {
    fieldRefs.current[field.id] = React.createRef<HTMLDivElement>();
  });

  const onSelectField = (field: ContentTypeField) => {
    setSelectedField(selectedField?.id === field.id ? null : field);
    fieldRefs.current[field.id].current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedA && selectedB) {
      forkJoin([
        fetchContentByCommitId(siteId, selectedA.path, selectedA.versionNumber),
        fetchContentByCommitId(siteId, selectedB.path, selectedB.versionNumber)
      ]).subscribe(([contentA, contentB]) => {
        setSelectionContent({
          contentA: parseContentXML(fromString(contentA as string), selectedA.path, contentTypesBranch.byId, {}),
          contentB: parseContentXML(fromString(contentB as string), selectedB.path, contentTypesBranch.byId, {}),
          contentAXml: contentA,
          contentBXml: contentB
        });
      });
    }
  }, [selectedA, selectedB, siteId, setSelectionContent, contentTypesBranch.byId]);

  return (
    <>
      <DialogBody
        sx={{
          overflow: 'auto',
          minHeight: '50vh',
          ...(compareMode && { padding: 0 })
        }}
      >
        {!isCompareDataReady ? (
          <LoadingState />
        ) : compareVersionsBranch.error || contentTypesBranch.error ? (
          <ApiResponseErrorState error={compareVersionsBranch.error ?? contentTypesBranch.error} />
        ) : (
          <>
            <ResizeableDrawer
              open={true}
              width={280}
              styles={{
                drawerBody: {
                  overflowY: 'inherit'
                },
                drawerPaper: {
                  overflow: 'auto',
                  position: 'absolute'
                }
              }}
            >
              <List>
                {contentTypeFields.map((field) => (
                  <ListItemButton
                    key={field.id}
                    onClick={() => onSelectField(field)}
                    selected={selectedField?.id === field.id}
                  >
                    <Typography>
                      {field.name} ({field.id})
                    </Typography>
                  </ListItemButton>
                ))}
              </List>
            </ResizeableDrawer>
            <Box sx={{ marginLeft: '280px', overflowY: 'auto' }}>
              <CompareVersions
                a={{
                  ...selectedA,
                  ...compareVersionsBranch.compareVersions?.[0],
                  content: selectionContent.contentA,
                  xml: selectionContent.contentAXml
                }}
                b={{
                  ...selectedB,
                  ...compareVersionsBranch.compareVersions?.[1],
                  content: selectionContent.contentB,
                  xml: selectionContent.contentBXml
                }}
                contentTypeId={item.contentTypeId}
                contentTypes={contentTypesBranch.byId}
                compareXml={compareXml}
                selectedFieldId={selectedField?.id}
                fieldRefs={fieldRefs.current}
              />
            </Box>
          </>
        )}
      </DialogBody>
    </>
  );
}

export default CompareVersionsDialogContainer;
