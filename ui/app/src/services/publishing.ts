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

import { get, post, postJSON } from '../utils/ajax';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LegacyItem } from '../models/Item';
import { pluckProps, toQueryString } from '../utils/object';
import { PublishPackage, PublishingStatus, PublishingTarget, PublishParams } from '../models/Publishing';
import { Api2BulkResponseFormat, Api2ResponseFormat } from '../models/ApiResponse';
import { PagedArray } from '../models/PagedArray';

export interface FetchPackagesResponse extends Omit<PublishPackage, 'items'> {}

export type PackageApprovalState = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export function fetchPackages(
  siteId: string,
  filters?: Partial<{
    target: string;
    states: number;
    approvalStates: Array<PackageApprovalState>;
    submitter: string;
    reviewer: string;
    isScheduled: boolean;
    sort: string;
    offset: number;
    limit: number;
  }>
): Observable<PagedArray<FetchPackagesResponse>> {
  const qs = toQueryString(filters);
  return get<Api2BulkResponseFormat<{ packages: FetchPackagesResponse[] }>>(
    `/studio/api/2/publish/${siteId}/packages${qs}`
  ).pipe(map(({ response }) => Object.assign(response.packages, pluckProps(response, 'limit', 'offset', 'total'))));
}

export function fetchPackage(
  siteId: string,
  packageId: number,
  data?: {
    path?: string;
    systemType?: string;
    internalName?: string;
  }
): Observable<PublishPackage> {
  const qs = toQueryString(data);
  return get<
    Api2ResponseFormat<{
      package: PublishPackage;
    }>
  >(`/studio/api/2/publish/${siteId}/package/${packageId}${qs}`).pipe(map((response) => response?.response?.package));
}

export function cancelPackage(siteId: string, packageIds: any) {
  return postJSON('/studio/api/2/publish/cancel', { siteId, packageIds });
}

export type FetchPublishingTargetsResponse = Api2ResponseFormat<{
  published: boolean;
  publishingTargets: Array<PublishingTarget>;
}>;

export function fetchPublishingTargets(site: string): Observable<FetchPublishingTargetsResponse> {
  return get<FetchPublishingTargetsResponse>(`/studio/api/2/publish/available_targets?siteId=${site}`).pipe(
    map((response) => response?.response)
  );
}

export interface GoLiveResponse {
  status: number;
  commitId: string;
  item: LegacyItem;
  invalidateCache: boolean;
  success: boolean;
  message: string;
}

export function fetchStatus(siteId: string): Observable<PublishingStatus> {
  return get<Api2ResponseFormat<{ publishingStatus: PublishingStatus }>>(`/studio/api/2/publish/${siteId}/status`).pipe(
    map((response) => response?.response?.publishingStatus),
    map((status) => {
      if (status.status) {
        return status;
      } else {
        console.error(`[/api/2/publish/status?siteId=${siteId}] Status property value was ${status.status}`);
        return {
          ...status,
          // Address backend sending status as null.
          status: status.status ?? ('' as PublishingStatus['status'])
        };
      }
    })
  );
}

export function start(siteId: string): Observable<true> {
  return postJSON('/studio/api/1/services/api/1/publish/start.json', { site_id: siteId }).pipe(map(() => true));
}

export function stop(siteId: string): Observable<true> {
  return postJSON('/studio/api/1/services/api/1/publish/stop.json', { site_id: siteId }).pipe(map(() => true));
}

export function bulkGoLive(siteId: string, path: string, environment: string, comment: string): Observable<true> {
  const qs = toQueryString({
    site_id: siteId,
    path,
    environment: encodeURIComponent(environment),
    comment
  });
  return post(`/studio/api/1/services/api/1/deployment/bulk-golive.json${qs}`).pipe(map(() => true));
}

export function publishByCommits(
  siteId: string,
  commitIds: string[],
  environment: string,
  comment: string
): Observable<true> {
  return postJSON('/studio/api/1/services/api/1/publish/commits.json', {
    site_id: siteId,
    commit_ids: commitIds,
    environment,
    comment
  }).pipe(map(() => true));
}

export function publishAll(siteId: string, publishingTarget: string, submissionComment: string): Observable<true> {
  return postJSON('/studio/api/2/publish/all', {
    siteId,
    publishingTarget,
    submissionComment
  }).pipe(map(() => true));
}

export function clearLock(siteId: string): Observable<boolean> {
  return postJSON('/studio/api/2/publish/clear_lock', { siteId }).pipe(map(() => true));
}

export function publish(siteId: string, data: PublishParams): Observable<string> {
  return postJSON(`/studio/api/2/publish/${siteId}`, data).pipe(map(({ response }) => response?.packageId));
}

export interface CalculatedPackageResponse {
  hardDependencies: string[];
  softDependencies: string[];
  deletedItems: string[];
  items: string[];
}

export function calculatePackage(
  siteId: string,
  data: {
    publishingTarget: string;
    paths?: PublishParams['paths'];
    commitIds?: PublishParams['commitIds'];
  }
): Observable<CalculatedPackageResponse> {
  return postJSON(`/studio/api/2/publish/${siteId}/calculate`, data).pipe(
    map((response) => response?.response?.package)
  );
}
