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

import React, { useCallback, useEffect, useState } from 'react';
import { EnhancedDialog } from '../EnhancedDialog';
import { FormattedMessage } from 'react-intl';
import { BrowseS3DialogContainerProps, BrowseS3DialogProps } from './types';
import ApiResponse from '../../models/ApiResponse';
import { MediaItem } from '../../models';
import useSpreadState from '../../hooks/useSpreadState';
import LookupTable from '../../models/LookupTable';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import { list } from '../../services/aws';
import { parseAwsItemToMediaItem } from './utils';
import { DialogBody } from '../DialogBody';
import Box from '@mui/material/Box';
import MediaCard from '../MediaCard';
import { EmptyState } from '../EmptyState';
import { DialogFooter } from '../DialogFooter';
import SecondaryButton from '../SecondaryButton';
import PrimaryButton from '../PrimaryButton';

function BrowseS3DialogBody(props: BrowseS3DialogContainerProps) {
  const { path, profileId, multiSelect, onClose, onSuccess } = props;
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [error, setError] = useState<ApiResponse>(null);
  const [items, setItems] = useState<MediaItem[]>();
  const [selectedCard, setSelectedCard] = useState<MediaItem>();
  const [selectedLookup, setSelectedLookup] = useSpreadState<LookupTable<MediaItem>>({});
  const siteId = useActiveSiteId();

  const fetchItems = useCallback(() => {
    setIsFetchingItems(true);
    list(siteId, profileId, {
      path
    }).subscribe({
      next: (items) => {
        console.log('items', items);
        setIsFetchingItems(false);
        // TODO: flatmap
        setItems(items.filter((item) => !item.folder).map((item) => parseAwsItemToMediaItem(item)));
      },
      error: (error) => {
        setIsFetchingItems(false);
        setError(error);
      }
    });
  }, [path, profileId, siteId]);

  useEffect(() => {
    if (profileId) {
      fetchItems();
    }
  }, [fetchItems, profileId]);

  const onCardSelected = (item: MediaItem) => {
    if (multiSelect) {
      // TODO: implement
    } else {
      setSelectedCard(selectedCard?.path === item.path ? null : item);
    }
  };

  const onCloseButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onClose(e, null);

  const onSelectButtonClick = () => {
    onSuccess?.(selectedCard);
  };

  const onRefresh = () => fetchItems();

  const switchViewMode = () => {};

  return isFetchingItems ? (
    <>Skeleton here</>
  ) : items?.length ? (
    <>
      <DialogBody sx={{ minHeight: '60vh', padding: 0 }}>
        <Box sx={{ display: 'flex', overflow: 'hidden' }}>
          <Box sx={{ width: '270px', padding: '16px', overflow: 'auto', rowGap: (theme) => theme.spacing(1) }}>
            tree here
          </Box>
          <Box component="section" sx={{ flexGrow: 1, padding: '16px', overflow: 'auto' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, max-content))',
                gridGap: '16px',
                padding: 'initial'
              }}
            >
              {items ? (
                items.map((item: MediaItem) => (
                  <MediaCard
                    key={item.path}
                    item={item}
                    previewAppBaseUri=""
                    onClick={() => onCardSelected(item)}
                    sxs={{
                      root: {
                        cursor: 'pointer',
                        ...(item.path === selectedCard?.path
                          ? {
                              boxShadow: (theme) => `0px 0px 4px 4px ${theme.palette.primary.main}`
                            }
                          : {})
                      }
                    }}
                  />
                ))
              ) : (
                <EmptyState title={<FormattedMessage defaultMessage="No items found." />} />
              )}
            </Box>
          </Box>
        </Box>
      </DialogBody>
      <DialogFooter>
        <SecondaryButton onClick={onCloseButtonClick}>
          <FormattedMessage defaultMessage="Cancel" />
        </SecondaryButton>
        <PrimaryButton disabled={!selectedCard} onClick={onSelectButtonClick}>
          <FormattedMessage defaultMessage="Select" />
        </PrimaryButton>
      </DialogFooter>
    </>
  ) : (
    <>Empty State here</>
  );
}

export function BrowseS3Dialog(props: BrowseS3DialogProps) {
  const { path, profileId, onClose, onSuccess, multiSelect, ...rest } = props;

  return (
    <EnhancedDialog
      title={<FormattedMessage defaultMessage="Select an item" />}
      onClose={onClose}
      maxWidth="lg"
      {...rest}
    >
      <BrowseS3DialogBody
        path={path}
        profileId={profileId}
        multiSelect={multiSelect}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </EnhancedDialog>
  );
}

export default BrowseS3Dialog;
