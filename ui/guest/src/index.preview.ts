/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import $ from 'jquery';
import { message$, post } from './communicator';
import { GUEST_CHECK_IN, GUEST_CHECK_OUT, NAVIGATION_REQUEST } from './constants';

message$.subscribe(function ({ type, payload }) {
  switch (type) {
    case NAVIGATION_REQUEST: {
      window.location.href = payload.url;
      break;
    }
  }
});

const location = window.location.href;
const origin = window.location.origin;
const url = location.replace(origin, '');

post(GUEST_CHECK_IN, { url, location, origin, site: null, __CRAFTERCMS_GUEST_LANDING__: true });

setTimeout(() => {
  $('img').fadeIn();
}, 700);

window.onbeforeunload = () => {
  post(GUEST_CHECK_OUT);
};
