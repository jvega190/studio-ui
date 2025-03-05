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

import React, { useState } from 'react';
import { ContentItem } from '../../models';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ItemDisplay from '../ItemDisplay';
import Tooltip from '@mui/material/Tooltip';
import { FormattedMessage } from 'react-intl';
import IconButton from '@mui/material/IconButton';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList as List } from 'react-window';
import { PackageItem } from './PackageItems';
import AutoSizer from 'react-virtualized-auto-sizer';
import Box from '@mui/material/Box';

export interface PackageItemsListProps {
	items: PackageItem[];
	totalItems: number;
	hasNextPage: boolean;
	isNextPageLoading: boolean;
	loadNextPage(): void;
	onOpenMenu(e: React.MouseEvent<HTMLButtonElement>, item: PackageItem): void;
}

export function PackageItemsList(props: PackageItemsListProps) {
	const { items, hasNextPage, isNextPageLoading, loadNextPage, onOpenMenu } = props;
	const [over, setOver] = useState(null);
	// If there are more items to be loaded then add an extra row to hold a loading indicator.
	const currentItemsCount = hasNextPage ? items.length + 1 : items.length;

	// Only load 1 page of items at a time.
	// Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
	const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage;

	// Every row is loaded except for our loading indicator row.
	const isItemLoaded = (index) => !hasNextPage || index < items.length;

	return (
		<InfiniteLoader isItemLoaded={isItemLoaded} itemCount={currentItemsCount} loadMoreItems={loadMoreItems}>
			{({ onItemsRendered, ref }) => (
				<Box sx={{ flex: 1 }}>
					<AutoSizer>
						{({ height, width }) => (
							<List
								className="List"
								height={height}
								itemCount={currentItemsCount}
								itemSize={59}
								onItemsRendered={onItemsRendered}
								ref={ref}
								width={width}
							>
								{({ index, style }) => {
									let content;
									if (!isItemLoaded(index)) {
										content = <FormattedMessage defaultMessage="Loading..." />;
									} else {
										const item = items[index];
										content = (
											<ListItemButton
												onMouseOver={() => setOver(item.path)}
												onMouseOut={() => setOver(null)}
												sx={{
													cursor: 'default',
													justifyContent: 'space-between',
													py: 0
												}}
											>
												<ListItemText
													primary={
														<ItemDisplay
															item={item as unknown as ContentItem}
															titleDisplayProp="path"
															showWorkflowState={false}
															showPublishingTarget={false}
															showNavigableAsLinks={false}
														/>
													}
													secondary={item.path}
												/>

												{over === item.path && (
													<Tooltip title={<FormattedMessage defaultMessage="Options" />}>
														<IconButton
															size="small"
															onClick={(e) => {
																onOpenMenu(e, item);
															}}
															sx={{ padding: 0 }}
														>
															<MoreVertRoundedIcon />
														</IconButton>
													</Tooltip>
												)}
											</ListItemButton>
										);
									}
									return <div style={style}>{content}</div>;
								}}
							</List>
						)}
					</AutoSizer>
				</Box>
			)}
		</InfiniteLoader>
	);
}

export default PackageItemsList;
