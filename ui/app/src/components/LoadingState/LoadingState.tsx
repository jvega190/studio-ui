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

import React, { ElementType, PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Gears from '../Gears/Gears';
import { PartialSxRecord } from '../../models';
import Box, { BoxProps } from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

type LoadingStateClassKey = 'root' | 'title' | 'subtitle' | 'graphic' | 'graphicRoot';

export interface LoadingStateProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  graphic?: ElementType;
  graphicProps?: any;
  classes?: Partial<Record<LoadingStateClassKey, string>>;
  sxs?: PartialSxRecord<LoadingStateClassKey>;
  sx?: SxProps<Theme>;
  revealTimeout?: number;
}

export type ConditionalLoadingStateProps = LoadingStateProps & PropsWithChildren<{ isLoading: boolean }>;

export function LoadingState(props: LoadingStateProps) {
  const { graphic: Graphic = Gears, classes, revealTimeout = 300, sxs } = props;
  const [reveal, setReveal] = useState(revealTimeout === 0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setReveal(true);
    }, revealTimeout);
    return () => clearTimeout(timeout);
  }, [revealTimeout]);
  return (
    <Box
      className={classes?.root}
      sx={{
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        margin: (theme) => `${theme.spacing(2)} auto`,
        minHeight: '100%',
        ...sxs?.root,
        ...props.sx,
        visibility: reveal ? undefined : 'hidden'
      }}
    >
      {props.title && (
        <Typography
          variant="h6"
          component="h3"
          className={classes?.title}
          sx={{
            marginTop: '40px',
            marginBottom: '15px',
            ...sxs?.title
          }}
        >
          {props.title}
        </Typography>
      )}
      {props.subtitle && (
        <Typography
          variant="subtitle1"
          component="p"
          className={classes?.subtitle}
          sx={{
            marginBottom: '10px',
            ...sxs?.subtitle
          }}
        >
          {props.subtitle}
        </Typography>
      )}
      <Box
        className={classes?.graphicRoot}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          ...sxs?.graphicRoot
        }}
      >
        <Graphic className={classes?.graphic} sxs={{ root: { width: 120, ...sxs?.graphic } }} {...props.graphicProps} />
      </Box>
    </Box>
  );
}

export function ConditionalLoadingState(props: ConditionalLoadingStateProps) {
  const { children, isLoading, ...loadingStateProps } = props;
  return isLoading ? <LoadingState {...loadingStateProps} /> : <>{children}</>;
}

export default LoadingState;
