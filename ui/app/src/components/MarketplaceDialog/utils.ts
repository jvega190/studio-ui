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

import { PropsWithChildren } from 'react';
import { MarketplacePlugin } from '../../models/MarketplacePlugin';
import { PagedArray } from '../../models/PagedArray';
import LookupTable from '../../models/LookupTable';

export interface InstallPluginDialogBaseProps {
	open: boolean;
	installedPlugins: LookupTable<boolean>;
	installPermission?: boolean;
}

export type InstallPluginDialogProps = PropsWithChildren<
	InstallPluginDialogBaseProps & {
		onInstall(plugin: MarketplacePlugin): void;
		onClose(): void;
		onClosed?(): void;
	}
>;

export interface PluginListProps {
	plugins: PagedArray<MarketplacePlugin>;
	installPermission: boolean;
	installedPlugins: LookupTable<boolean>;
	installingLookup: LookupTable<boolean>;
	onPluginDetails(plugin: MarketplacePlugin): void;
	onPluginSelected(plugin: MarketplacePlugin): void;
}
