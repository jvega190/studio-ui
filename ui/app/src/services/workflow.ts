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

import { Observable } from 'rxjs';
import { get, postJSON } from '../utils/ajax';
import { map } from 'rxjs/operators';
import { toQueryString } from '../utils/object';
import { SandboxItem } from '../models/Item';
import { PagedArray } from '../models/PagedArray';
import { createItemActionMap, createItemStateMap } from '../utils/content';
import PaginationOptions from '../models/PaginationOptions';
import { PublishingPackageApproveParams, PublishPackage } from '../models/Publishing';
import { ApiResponse } from '../models';

export function fetchItemStates(
	siteId: string,
	path?: string,
	states?: number,
	options?: PaginationOptions
): Observable<PagedArray<SandboxItem>> {
	const qs = toQueryString({ siteId, path, states, ...options });
	return get(`/studio/api/2/workflow/item_states${qs}`).pipe(
		map((response) => {
			const { items, total, offset, limit } = response?.response ?? {};
			return Object.assign(
				items?.map((item) => ({
					...item,
					stateMap: createItemStateMap(item.state),
					availableActionsMap: createItemActionMap(item.availableActions)
				})),
				{
					total,
					offset,
					limit: limit < options.limit ? options.limit : limit
				}
			);
		})
	);
}

export interface StatesToUpdate {
	clearSystemProcessing?: boolean;
	clearUserLocked?: boolean;
	live?: boolean;
	staged?: boolean;
}

export function setItemStates(siteId: string, items: string[], { ...rest }: StatesToUpdate): Observable<ApiResponse> {
	return postJSON('/studio/api/2/workflow/item_states', {
		siteId,
		items: items,
		...rest
	}).pipe(map(({ response }) => response));
}

export function setItemStatesByQuery(
	siteId: string,
	states: number,
	update: StatesToUpdate,
	path?: string
): Observable<ApiResponse> {
	return postJSON('/studio/api/2/workflow/update_item_states_by_query', {
		query: {
			siteId,
			...(path && { path }),
			states
		},
		update
	}).pipe(map(({ response }) => response));
}

export function approve(
	siteId: string,
	packageId: number,
	data: PublishingPackageApproveParams
): Observable<ApiResponse> {
	return postJSON(`/studio/api/2/workflow/${siteId}/package/${packageId}/approve`, data).pipe(
		map(({ response }) => response)
	);
}

export function reject(siteId: string, packageId: number, comment: string): Observable<ApiResponse> {
	return postJSON(`/studio/api/2/workflow/${siteId}/package/${packageId}/reject`, {
		comment
	}).pipe(map(({ response }) => response));
}

export function cancelPackages(
	siteId: string,
	data: {
		packageIds: number[];
		comment: string;
	}
): Observable<ApiResponse> {
	return postJSON(`/studio/api/2/workflow/${siteId}/cancel`, data).pipe(map(({ response }) => response));
}

export function fetchAffectedPackages(
	siteId: string,
	path: string,
	includeChildren?: boolean
): Observable<PublishPackage[]> {
	const qs = toQueryString({ path, includeChildren });
	return get(`/studio/api/2/workflow/${siteId}/affected_packages${qs}`).pipe(map(({ response }) => response.packages));
}
