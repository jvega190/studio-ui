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

import { FormattedMessage } from 'react-intl';
import React, { useState } from 'react';
import DialogBody from '../DialogBody/DialogBody';
import SingleItemSelector from '../SingleItemSelector';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DependenciesList from './DependenciesList';
import Menu from '@mui/material/Menu';
import DialogFooter from '../DialogFooter/DialogFooter';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { assetsTypes, DependenciesDialogUIProps } from './utils';
import Radio from '@mui/material/Radio';
import { ApiResponseErrorState } from '../ApiResponseErrorState';
import { LoadingState } from '../LoadingState';
import { EmptyState } from '../EmptyState';
import { getRootPath } from '../../utils/path';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

export function DependenciesDialogUI(props: DependenciesDialogUIProps) {
	const {
		dependencies,
		item,
		rootPath,
		setItem,
		compactView,
		setCompactView,
		showTypes,
		setShowTypes,
		dependenciesShown,
		setDependenciesShown,
		isEditableItem,
		handleEditorDisplay,
		handleHistoryDisplay,
		contextMenu,
		handleContextMenuClick,
		handleContextMenuClose,
		error
	} = props;
	const [openSelector, setOpenSelector] = useState(false);

	return (
		<>
			<DialogBody sx={{ overflow: 'auto', minHeight: '50vh' }}>
				<Box sx={{ marginBottom: '15px', display: 'flex' }}>
					<SingleItemSelector
						label={<FormattedMessage id="words.item" defaultMessage="Item" />}
						open={openSelector}
						onClose={() => setOpenSelector(false)}
						onDropdownClick={() => setOpenSelector(!openSelector)}
						rootPath={rootPath}
						selectedItem={item}
						disabled={rootPath !== getRootPath(item.path)}
						onItemClicked={(item) => {
							setOpenSelector(false);
							setItem(item);
						}}
					/>
					<FormControl sx={{ minWidth: 120, marginLeft: 'auto' }}>
						<Select
							value={dependenciesShown ?? 'depends-on'}
							onChange={(event: SelectChangeEvent) => {
								setDependenciesShown(event.target.value);
							}}
							slotProps={{
								input: {
									sx: {
										fontSize: '16px',
										border: 'none',
										background: 'none'
									}
								}
							}}
						>
							<MenuItem value="depends-on-me">
								<FormattedMessage id="dependenciesDialog.dependsOnMe" defaultMessage="Dependencies of selected item" />
							</MenuItem>
							<MenuItem value="depends-on">
								<FormattedMessage
									id="dependenciesDialog.dependsOn"
									defaultMessage="Items that depend on selected item"
								/>
							</MenuItem>
						</Select>
					</FormControl>
				</Box>

				{error ? (
					<ApiResponseErrorState error={error} />
				) : !dependencies ? (
					<LoadingState sxs={{ root: { height: '100%', flexGrow: 1 } }} />
				) : dependencies?.length === 0 ? (
					<EmptyState
						sxs={{ root: { minHeight: 300, height: '100%' } }}
						title={
							dependenciesShown === 'depends-on-me' ? (
								<FormattedMessage
									id="dependenciesDialog.emptyDependantsMessage"
									defaultMessage={'"{itemName}" has no dependencies'}
									values={{ itemName: item?.label }}
								/>
							) : (
								<FormattedMessage
									id="dependenciesDialog.emptyDependenciesMessage"
									defaultMessage={'Nothing depends on "{itemName}"'}
									values={{ itemName: item?.label }}
								/>
							)
						}
					/>
				) : (
					<>
						<DependenciesList
							dependencies={dependencies}
							compactView={compactView}
							showTypes={showTypes}
							renderAction={(dependency) =>
								isEditableItem(dependency.path) ? (
									<IconButton
										aria-haspopup="true"
										onClick={(e) => {
											handleContextMenuClick(e, dependency);
										}}
										sx={{ p: 1 }}
										size="large"
									>
										<MoreVertIcon />
									</IconButton>
								) : null
							}
						/>
						<Menu anchorEl={contextMenu.el} keepMounted open={Boolean(contextMenu.el)} onClose={handleContextMenuClose}>
							{contextMenu.dependency && isEditableItem(contextMenu.dependency.path) && (
								<MenuItem
									onClick={() => {
										handleEditorDisplay(contextMenu.dependency);
										handleContextMenuClose();
									}}
								>
									<FormattedMessage id="dependenciesDialog.edit" defaultMessage="Edit" />
								</MenuItem>
							)}
							{contextMenu.dependency && (
								<MenuItem
									onClick={() => {
										setItem(contextMenu.dependency);
										handleContextMenuClose();
									}}
								>
									<FormattedMessage id="dependenciesDialog.dependencies" defaultMessage="Dependencies" />
								</MenuItem>
							)}
							<MenuItem
								onClick={() => {
									handleHistoryDisplay(contextMenu.dependency);
									handleContextMenuClose();
								}}
							>
								{' '}
								{/* TODO: pending, waiting for new history dialog */}
								<FormattedMessage id="dependenciesDialog.history" defaultMessage="History" />
							</MenuItem>
						</Menu>
					</>
				)}
			</DialogBody>
			<DialogFooter sx={(theme) => ({ paddingLeft: theme.spacing(2), paddingRight: theme.spacing(2) })}>
				<FormControlLabel
					sx={{ marginRight: 'auto' }}
					control={
						<Checkbox
							checked={compactView}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								setCompactView(event.target.checked);
							}}
							color="primary"
						/>
					}
					label="Compact"
				/>
				<FormControl sx={{ minWidth: 120, marginLeft: 'auto' }}>
					<Select
						value={showTypes}
						onChange={(event: SelectChangeEvent) => {
							setShowTypes(event.target.value);
						}}
						slotProps={{
							input: {
								sx: {
									fontSize: '16px',
									border: 'none',
									background: 'none',
									'& > .MuiRadio-root': {
										display: 'none'
									}
								}
							}
						}}
						MenuProps={{
							sx: {
								'& .MuiListItem-root': {
									padding: '0 10px',
									fontSize: '14px',
									'& > .MuiRadio-root': {
										padding: '6px',
										'& .MuiSvgIcon-root': {
											width: '16px',
											height: '16px'
										}
									}
								}
							},
							transformOrigin: {
								vertical: 'bottom',
								horizontal: 'left'
							}
						}}
					>
						{Object.keys(assetsTypes).map((typeId) => (
							<MenuItem value={typeId} key={typeId}>
								<Radio checked={showTypes === typeId} color="primary" />
								{assetsTypes[typeId].label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</DialogFooter>
		</>
	);
}

export default DependenciesDialogUI;
