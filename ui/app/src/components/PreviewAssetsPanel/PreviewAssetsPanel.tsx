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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { MediaItem } from '../../models/Search';
import { alpha } from '@mui/material';
import SearchBar from '../SearchBar/SearchBar';
import { useDispatch, useSelector } from 'react-redux';
import GlobalState from '../../models/GlobalState';
import { fromEvent, interval } from 'rxjs';
import { filter, map, share, switchMap, takeUntil, tap } from 'rxjs/operators';
import { getHostToGuestBus } from '../../utils/subjects';
import {
	assetDragEnded,
	assetDragStarted,
	fetchAssetsPanelItems,
	setPreviewEditMode
} from '../../state/actions/preview';
import MediaCard from '../MediaCard/MediaCard';
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded';
import EmptyState from '../EmptyState/EmptyState';
import UploadIcon from '@mui/icons-material/Publish';
import { pluckProps } from '../../utils/object';
import { uploadDataUrl } from '../../services/content';
import palette from '../../styles/palette';
import { useSelection } from '../../hooks/useSelection';
import { useActiveSiteId } from '../../hooks/useActiveSiteId';
import { useDebouncedInput } from '../../hooks/useDebouncedInput';
import Pagination from '../Pagination';
import { LoadingState } from '../LoadingState';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { showPreviewDialog } from '../../state/actions/dialogs';
import { ErrorBoundary } from '../ErrorBoundary';
import Box from '@mui/material/Box';

const translations = defineMessages({
	previewAssetsPanelTitle: {
		id: 'previewAssetsPanel.title',
		defaultMessage: 'Assets'
	},
	itemsPerPage: {
		id: 'previewAssetsPanel.itemsPerPage',
		defaultMessage: 'Items per page:'
	},
	noResults: {
		id: 'previewAssetsPanel.noResults',
		defaultMessage: ' No results found.'
	},
	previousPage: {
		id: 'pagination.previousPage',
		defaultMessage: 'Previous page'
	},
	nextPage: {
		id: 'pagination.nextPage',
		defaultMessage: 'Next page'
	},
	retrieveAssets: {
		id: 'previewAssetsPanel.retrieveAssets',
		defaultMessage: 'Retrieving Project Assets'
	}
});

export function PreviewAssetsPanel() {
	const initialKeyword = useSelection((state) => state.preview.assets.query.keywords);
	const [keyword, setKeyword] = useState(initialKeyword);
	const [dragInProgress, setDragInProgress] = useState(false);
	const site = useActiveSiteId();
	const hostToGuest$ = getHostToGuestBus();
	const dispatch = useDispatch();
	const editMode = useSelection((state) => state.preview.editMode);
	const assets = useSelection((state) => state.preview.assets);

	useEffect(() => {
		if (site && assets.isFetching === null) {
			dispatch(fetchAssetsPanelItems({}));
		}
	}, [assets, dispatch, site]);

	const { guestBase, xsrfArgument } = useSelector<GlobalState, GlobalState['env']>((state) => state.env);
	const { formatMessage } = useIntl();
	const elementRef = useRef(undefined);

	const onDragStart = (mediaItem: MediaItem) => {
		if (!editMode) {
			dispatch(setPreviewEditMode({ editMode: true }));
		}
		hostToGuest$.next(assetDragStarted({ asset: mediaItem }));
	};

	const onDragEnd = () => hostToGuest$.next(assetDragEnded());

	const onDragDrop = useCallback(
		(e) => {
			const file = e.dataTransfer.files[0];
			if (!file) {
				return;
			}

			const reader = new FileReader();
			reader.onloadend = function () {
				uploadDataUrl(
					site,
					{
						...pluckProps(file, 'name', 'type'),
						dataUrl: reader.result
					},
					'/static-assets/images/',
					xsrfArgument
				).subscribe({
					complete() {
						dispatch(fetchAssetsPanelItems({}));
					}
				});
			};
			reader.readAsDataURL(file);
			setDragInProgress(false);
		},
		[xsrfArgument, dispatch, site]
	);

	useEffect(() => {
		const subscription = fromEvent(elementRef.current, 'dragenter')
			.pipe(filter((e: any) => e.dataTransfer?.types.includes('Files')))
			.subscribe((e) => {
				e.preventDefault();
				e.stopPropagation();
				setDragInProgress(true);
			});
		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		if (dragInProgress) {
			const dragover$ = fromEvent(elementRef.current, 'dragover').pipe(
				tap((e: any) => {
					e.preventDefault();
					e.stopPropagation();
				}),
				share()
			);
			const dragoverSubscription = dragover$.subscribe();
			const dragleaveSubscription = fromEvent(elementRef.current, 'dragleave')
				.pipe(
					switchMap(() => interval(100).pipe(takeUntil(dragover$))),
					map(() => false)
				)
				.subscribe(setDragInProgress);
			const dropSubscription = fromEvent(elementRef.current, 'drop')
				.pipe(filter((e: any) => e.dataTransfer?.types.includes('Files')))
				.subscribe((e) => {
					e.preventDefault();
					e.stopPropagation();
					onDragDrop(e);
				});
			return () => {
				dragoverSubscription.unsubscribe();
				dragleaveSubscription.unsubscribe();
				dropSubscription.unsubscribe();
			};
		}
	}, [dragInProgress, onDragDrop]);

	const onSearch = useCallback(
		(keywords: string) => dispatch(fetchAssetsPanelItems({ keywords, offset: 0 })),
		[dispatch]
	);

	const onSearch$ = useDebouncedInput(onSearch, 400);

	function onPageChanged(newPage: number) {
		dispatch(fetchAssetsPanelItems({ offset: newPage }));
	}

	function onRowsPerPageChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
		dispatch(fetchAssetsPanelItems({ offset: 0, limit: e.target.value }));
	}

	function handleSearchKeyword(keyword: string) {
		setKeyword(keyword);
		onSearch$.next(keyword);
	}

	return (
		<Box sx={dragInProgress ? { overflow: 'hidden' } : null}>
			<div ref={elementRef}>
				<Box sx={{ padding: '15px 15px 0 15px' }}>
					<SearchBar showActionButton={Boolean(keyword)} onChange={handleSearchKeyword} keyword={keyword} />
				</Box>
				<ErrorBoundary>
					{assets.error ? (
						<ApiResponseErrorState error={assets.error} />
					) : assets.isFetching ? (
						<LoadingState title={formatMessage(translations.retrieveAssets)} />
					) : assets.page[assets.pageNumber] ? (
						<>
							{dragInProgress && (
								<Box
									sx={{
										position: 'absolute',
										background: alpha(palette.black, 0.9),
										top: 0,
										bottom: 0,
										left: 0,
										right: 0,
										display: 'flex',
										justifyContent: 'center',
										alignContent: 'center',
										zIndex: 2
									}}
								>
									<UploadIcon
										style={{ pointerEvents: 'none' }}
										sx={{ fontSize: '8em', color: palette.gray.light5, margin: 'auto' }}
									/>
								</Box>
							)}
							<Pagination
								count={assets.count}
								rowsPerPage={assets.query.limit}
								page={assets.pageNumber}
								onPageChange={(e, page: number) => onPageChanged(page * assets.query.limit)}
								onRowsPerPageChange={onRowsPerPageChange}
							/>
							<Box sx={{ p: 2 }}>
								{assets.page[assets.pageNumber]?.map((id) => {
									const item = assets.byId[id];
									return (
										<MediaCard
											key={item.path}
											item={item}
											previewAppBaseUri={guestBase}
											avatar={<DragIndicatorRounded />}
											sxs={{
												root: { cursor: 'move', marginBottom: '16px' }
											}}
											onDragStart={() => onDragStart(item)}
											onDragEnd={() => onDragEnd()}
											onPreview={() =>
												dispatch(
													showPreviewDialog({
														// TODO: check if it's image or video
														type: 'image',
														title: item.name,
														url: item.path
													})
												)
											}
										/>
									);
								})}
								{assets.count === 0 && (
									<EmptyState
										title={formatMessage(translations.noResults)}
										sxs={{
											image: { width: '150px' },
											title: { fontSize: 'inherit', marginTop: '10px' }
										}}
									/>
								)}
							</Box>
						</>
					) : (
						<></>
					)}
				</ErrorBoundary>
			</div>
		</Box>
	);
}

export default PreviewAssetsPanel;
