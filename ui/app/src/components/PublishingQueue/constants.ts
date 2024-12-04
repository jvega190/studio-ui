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

export const READY_FOR_LIVE = 'READY_FOR_LIVE';
export const PROCESSING = 'PROCESSING';
export const COMPLETED = 'COMPLETED';
export const CANCELLED = 'CANCELLED';
export const BLOCKED = 'BLOCKED';

//                                                        6 |    5    |    4    |    3    |    2    |    1    |     0
//                                                        321|987654321|987654321|987654321|987654321|987654321|9876543210

export const READY_MASK = /*                         */ 0b0000000000000000000000000000000000000000000000000000000000000001;
export const PROCESSING_MASK = /*                    */ 0b0000000000000000000000000000000000000000000000000000000000000010;
export const LIVE_SUCCESS_MASK = /*                  */ 0b0000000000000000000000000000000000000000000000000000000000000100;
export const LIVE_COMPLETED_WITH_ERRORS_MASK = /*    */ 0b0000000000000000000000000000000000000000000000000000000000001000;
export const LIVE_FAILED_MASK = /*                   */ 0b0000000000000000000000000000000000000000000000000000000000010000;
export const STAGING_SUCCESS_MASK = /*               */ 0b0000000000000000000000000000000000000000000000000000000000100000;
export const STAGING_COMPLETED_WITH_ERRORS_MASK = /* */ 0b0000000000000000000000000000000000000000000000000000000001000000;
export const STAGING_FAILED_MASK = /*                */ 0b0000000000000000000000000000000000000000000000000000000010000000;
export const COMPLETED_MASK = /*                     */ 0b0000000000000000000000000000000000000000000000000000000100000000;
export const CANCELLED_MASK = /*                     */ 0b0000000000000000000000000000000000000000000000000000001000000000;
