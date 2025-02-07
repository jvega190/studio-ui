/*
 * Copyright (C) 2007-2025 Crafter Software Corporation. All Rights Reserved.
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

import React, { forwardRef, PropsWithChildren, ReactNode, RefObject, useContext, useImperativeHandle } from 'react';
import { useTheme } from '@mui/material/styles';
import { ItemMetaContext, StableFormContext } from '../formsEngineContext';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import { useAtomValue } from 'jotai/index';
import { UIBlocker } from '../../UIBlocker';

export type FormLayoutProps = PropsWithChildren<{
  isLargeContainer: boolean;
  targetHeight: string;
  gridFragment: ReactNode;
  headerFragment: ReactNode;
  containerRef: RefObject<HTMLDivElement>;
}>;

export const FormLayout = forwardRef<HTMLDivElement, FormLayoutProps>(function (
  { children, gridFragment, targetHeight, containerRef, headerFragment, isLargeContainer },
  ref
) {
  const theme = useTheme();
  const { id } = useContext(ItemMetaContext);
  useImperativeHandle(ref, () => containerRef.current);
  return (
    <Box
      ref={containerRef}
      data-model-id={id}
      data-area-id="formContainer"
      sx={{
        display: 'flex',
        height: targetHeight,
        flexDirection: 'column',
        position: 'relative',
        overflow: 'auto',
        '.space-y > :not([hidden]) ~ :not([hidden])': { mt: 1 },
        '.space-y-half > :not([hidden]) ~ :not([hidden])': { mt: 0.5 },
        '.space-x > :not([hidden]) ~ :not([hidden])': { ml: 1 },
        '.space-y-2 > :not([hidden]) ~ :not([hidden])': { mt: 2 }
      }}
    >
      <UIBlockerOverlay />
      <Paper component="header" data-area-id="formHeader" elevation={0} square>
        {headerFragment}
        <Divider />
      </Paper>
      <Box
        sx={{
          // TODO: Tabs will be done at a later phase.
          // display: activeTab === 0 ? 'inherit' : 'none',
          px: 0,
          py: 2,
          backgroundColor: theme.palette.background.default
        }}
      >
        <Container maxWidth={isLargeContainer ? 'xl' : undefined}>
          <Grid container spacing={2}>
            {gridFragment}
          </Grid>
        </Container>
      </Box>
      {/*
      TODO: Tabs differed to a later stage. Should tabs be pluggable & configurable?
      {activeTab === 1 && (
        <IFrame
          url={useEnv().guestBase}
          title="Preview"
          sx={{ display: 'flex', flex: '1' }}
          styles={{ iframe: { height: null } }}
        />
      )}
      */}
      {children}
    </Box>
  );
});

function UIBlockerOverlay() {
  const stableFormContext = useContext(StableFormContext);
  const isSubmitting = useAtomValue(stableFormContext.atoms.isSubmitting);
  return <UIBlocker open={isSubmitting} />;
}

export default FormLayout;
