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

import {
  CANCELLED_MASK,
  COMPLETED_MASK,
  LIVE_COMPLETED_WITH_ERRORS_MASK,
  LIVE_FAILED_MASK,
  LIVE_SUCCESS_MASK,
  PROCESSING_MASK,
  READY_MASK,
  STAGING_COMPLETED_WITH_ERRORS_MASK,
  STAGING_FAILED_MASK,
  STAGING_SUCCESS_MASK
} from '../../utils/constants';

export const isReady = (state: number) => Boolean(state & READY_MASK);
export const isProcessing = (state: number) => Boolean(state & PROCESSING_MASK);
export const isLiveSuccess = (state: number) => Boolean(state & LIVE_SUCCESS_MASK);
export const isLiveCompletedWithErrors = (state: number) => Boolean(state & LIVE_COMPLETED_WITH_ERRORS_MASK);
export const isLiveFailed = (state: number) => Boolean(state & LIVE_FAILED_MASK);
export const isStagingSuccess = (state: number) => Boolean(state & STAGING_SUCCESS_MASK);
export const isStagingCompletedWithErrors = (state) => Boolean(state & STAGING_COMPLETED_WITH_ERRORS_MASK);
export const isStagingFailed = (state: number) => Boolean(state & STAGING_FAILED_MASK);
export const isCompleted = (state: number) => Boolean(state & COMPLETED_MASK);
export const isCancelled = (state: number) => Boolean(state & CANCELLED_MASK);
