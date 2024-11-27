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

import { ApproveRejectDialogContainerProps } from './utils';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchPackage, PublishingPackage } from '../../services/publishing';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { DialogBody } from '../DialogBody';
import { ApiResponse, SandboxItem } from '../../models';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { LoadingState } from '../LoadingState';
import Grid from '@mui/material/Grid2';
import { Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import Box from '@mui/material/Box';
import { DependencyChip } from '../PublishDialog';
import Divider from '@mui/material/Divider';
import { PersonAvatar } from '../DashletCard/dashletCommons'; // TODO: move this to a common place
import { getPersonFullName } from '../SiteDashboard';
import ItemPublishingTargetIcon from '../ItemPublishingTargetIcon';
import { getItemPublishingTargetText } from '../ItemDisplay/utils';
import { createLookupTable } from '../../utils/object';
import Paper from '@mui/material/Paper';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel'; // TODO: move this to a common place
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import TextFieldWithMax from '../TextFieldWithMax';

export function ApproveRejectDialogContainer(props: ApproveRejectDialogContainerProps) {
  const { packageId } = props;
  const [publishingPackage, setPublishingPackage] = useState<PublishingPackage>();
  const [isFetchingPackage, setIsFetchingPackage] = useState(false);
  const [error, setError] = useState<ApiResponse>();
  const siteId = useActiveSiteId();
  const itemsMap = useMemo(() => createLookupTable(publishingPackage?.items || [], 'path'), [publishingPackage]);

  const statusItems = {
    staging: { stateMap: { staged: true } },
    live: { stateMap: { live: true } }
  };

  useEffect(() => {
    setIsFetchingPackage(true);
    fetchPackage(siteId, packageId).subscribe({
      next: (response) => {
        console.log('response', response);
        setPublishingPackage(response);
        setIsFetchingPackage(false);
      },
      error: ({ response }) => {
        setError(response.response);
        setIsFetchingPackage(false);
      }
    });
  }, [siteId, packageId]);

  return (
    <>
      <DialogBody sx={{ px: 4, minHeight: 'calc(100vh * 0.5)' }}>
        {error ? (
          <ApiResponseErrorState error={error} />
        ) : isFetchingPackage ? (
          <LoadingState sx={{ flexGrow: 1 }} />
        ) : publishingPackage ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Submitter" />
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonAvatar person={publishingPackage.submitter} />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {getPersonFullName(publishingPackage.submitter)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Package Title" />
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {/* TODO: title doesn't exist yet in package */}
                  {/* {publishingPackage.title}*/}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Submission Comment" />
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {publishingPackage.submitterComment || (
                    <FormattedMessage defaultMessage="No submission comment provided" />
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Publishing Target" />
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                  <ItemPublishingTargetIcon item={statusItems[publishingPackage.target] as SandboxItem} />
                  <Typography variant="body2" component="span">
                    {getItemPublishingTargetText(statusItems[publishingPackage.target].stateMap)}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box component="form" sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Action" />
                </Typography>
                <RadioGroup sx={{ mb: 3 }}>
                  <FormControlLabel
                    value="approve"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VerifiedUserOutlinedIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
                        <FormattedMessage defaultMessage="Approve" />
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="reject"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BlockOutlinedIcon color="error" sx={{ mr: 1, fontSize: 18 }} />
                        <FormattedMessage defaultMessage="Reject" />
                      </Box>
                    }
                  />
                </RadioGroup>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="Scheduling" />
                </Typography>
                <RadioGroup sx={{ mb: 3 }}>
                  <FormControlLabel
                    value="keep"
                    control={<Radio color="primary" />}
                    label={<FormattedMessage defaultMessage="Keep" />}
                  />
                  <FormControlLabel
                    value="now"
                    control={<Radio color="primary" />}
                    label={<FormattedMessage defaultMessage="Now" />}
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio color="primary" />}
                    label={<FormattedMessage defaultMessage="Later" />}
                  />
                </RadioGroup>
                <TextFieldWithMax
                  label={<FormattedMessage defaultMessage="Approver Comment" />}
                  fullWidth
                  onChange={() => {}}
                  multiline
                />
              </Box>
              <Divider />
              <Box my={2}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <FormattedMessage defaultMessage="LEGEND" />
                </Typography>
                <Box display="flex" sx={{ display: 'flex', mb: 1, gap: 1 }}>
                  <DependencyChip type="hard" />
                  <Typography variant="body2" color="textSecondary">
                    <FormattedMessage defaultMessage="References of mandatory submission" />
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <DependencyChip type="soft" />
                  <Typography variant="body2" color="textSecondary">
                    <FormattedMessage defaultMessage="References of optional submission" />
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <Paper
                elevation={1}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? theme.palette.background.default : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* TODO: render items list/tree, actions, etc */}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <></>
        )}
      </DialogBody>
    </>
  );
}

export default ApproveRejectDialogContainer;
