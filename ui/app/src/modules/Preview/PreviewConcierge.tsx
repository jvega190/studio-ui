/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CONTENT_TYPES_RESPONSE,
  GUEST_CHECK_IN,
  GUEST_CHECK_OUT,
  HOST_CHECK_IN,
  SORT_ITEM_OPERATION,
  ICE_ZONE_SELECTED,
  GUEST_MODELS_RECEIVED,
  INSERT_COMPONENT_OPERATION,
  UPDATE_FIELD_VALUE_OPERATION,
  DELETE_ITEM_OPERATION,
  MOVE_ITEM_OPERATION,
  INSERT_ITEM_OPERATION,
  INSTANCE_DRAG_BEGUN,
  INSTANCE_DRAG_ENDED
} from '../../state/actions/preview';
import { deleteItem, fetchContentTypes, insertComponent, sortItem } from '../../services/content';
import { delay, filter, map, take, takeUntil } from 'rxjs/operators';
import ContentType from '../../models/ContentType';
import { of, ReplaySubject } from 'rxjs';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import Cookies from 'js-cookie';
import {
  changeCurrentUrl,
  checkInGuest,
  checkOutGuest,
  fetchContentTypesComplete,
  guestModelsReceived, selectForEdit, setItemBeingDragged
} from '../../state/actions/preview';
import { getGuestToHostBus, getHostToGuestBus } from './previewContext';
import { useSelector, useDispatch } from 'react-redux';
import { changeSite } from '../../state/actions/sites';
import GlobalState from '../../models/GlobalState';

export function PreviewConcierge(props: any) {

  const [snack, setSnack] = useState<any>(null);

  const { queryString: qs, onUrlChange } = props;

  const dispatch = useDispatch();
  const {
    site,
    guest,
    currentUrl,
    contentTypes
  } = useSelector<GlobalState, any>(state => ({
    site: state.sites.active,
    guest: state.preview.guest,
    currentUrl: state.preview.currentUrl,
    contentTypes: state.preview.contentTypes
  }));

  // This subject helps keep the async nature of content type fetching and guest
  // check in events. The idea is that it keeps things in sync despite the timing of
  // content types getting fetch and guest checking in.
  const contentTypes$ = useMemo(() => new ReplaySubject<ContentType[]>(1), []);

  useEffect(() => {

    const hostToGuest$ = getHostToGuestBus();
    const guestToHost$ = getGuestToHostBus();

    const guestToHostSubscription = guestToHost$.subscribe((action) => {
      const { type, payload } = action;
      switch (type) {
        case GUEST_CHECK_IN: {

          hostToGuest$.next({ type: HOST_CHECK_IN, payload });

          dispatch(checkInGuest(payload));

          onUrlChange?.({ page: payload.url, site });

          // If the content types have already been loaded, contentTypes$ subject
          // will emit immediately. If not, it will emit when the content type fetch
          // payload does arrive.
          contentTypes$.pipe(take(1)).subscribe((payload) => {
            hostToGuest$.next({ type: CONTENT_TYPES_RESPONSE, payload });
          });

          break;
        }
        case GUEST_CHECK_OUT:
          dispatch(checkOutGuest());
          break;
        case SORT_ITEM_OPERATION: {
          const { modelId, fieldId, currentIndex, targetIndex } = payload;
          sortItem(site, guest.models[modelId].craftercms.path, fieldId, currentIndex, targetIndex).subscribe(
            (response) => {
              console.log('Operation completed.', response);
              setSnack({ message: 'Operation completed.' });
            },
            (error) => {
              console.log('Operation failed.', error);
              setSnack({ message: error.message });
            }
          );
          break;
        }
        case INSERT_COMPONENT_OPERATION: {
          const { modelId, fieldId, targetIndex, instance, shared } = payload;
          insertComponent(
            site,
            guest.models[modelId].craftercms.path,
            fieldId,
            targetIndex,
            contentTypes.find((o) => o.id === instance.craftercms.contentType),
            instance,
            shared
          ).subscribe(() => {
            console.log('Finished');
          }, (e) => {
            console.log(e);
          });
          break;
        }
        case INSERT_ITEM_OPERATION: {
          break;
        }
        case MOVE_ITEM_OPERATION: {
          break;
        }
        case DELETE_ITEM_OPERATION: {
          const { modelId, fieldId, index } = payload;
          deleteItem(
            site,
            guest.models[modelId].craftercms.path,
            fieldId,
            index
          ).subscribe(() => {
            console.log('Finished');
          }, (e) => {
            console.log(e);
          });
          break;
        }
        case UPDATE_FIELD_VALUE_OPERATION: {
          break;
        }
        case ICE_ZONE_SELECTED: {
          dispatch(selectForEdit(payload));
          break;
        }
        case GUEST_MODELS_RECEIVED: {
          dispatch(guestModelsReceived(payload));
          break;
        }
        case INSTANCE_DRAG_BEGUN:
        case INSTANCE_DRAG_ENDED: {
          dispatch(setItemBeingDragged(type === INSTANCE_DRAG_BEGUN));
          break;
        }
      }
    });

    // Retrieve all content types in the system
    const fetchSubscription = (!contentTypes) && fetchContentTypes(site).pipe(
      // Remove the "Component - " prefix that is so common...
      map(types => types.map((type) => ({ ...type, name: type.name.replace('Component - ', '') })))
    ).subscribe((contentTypes) => {
      dispatch(fetchContentTypesComplete(contentTypes));
      contentTypes$.next(contentTypes);
    });

    return () => {
      fetchSubscription && fetchSubscription.unsubscribe();
      guestToHostSubscription.unsubscribe();
    }

  }, [site, dispatch, contentTypes, contentTypes$, guest, onUrlChange]);

  useEffect(() => {
    if ((qs.site) && (qs.site !== site)) {
      setSiteCookie(qs.site);
      dispatch(changeSite(qs.site));
    }
    (qs.url) && (qs.url !== currentUrl) && dispatch(changeCurrentUrl(qs.url));
  }, [currentUrl, dispatch, qs.site, qs.url, site]);

  useEffect(() => {
    setSiteCookie(site);
    beginGuestDetection(setSnack);
  }, [site, currentUrl]);

  return (
    <>
      {
        (snack) && <Snackbar
          anchorOrigin={snack.position ?? { vertical: 'bottom', horizontal: 'left' }}
          open={true}
          autoHideDuration={snack.duration ?? 5000}
          onClose={() => setSnack(null)}
          message={snack.message}
          action={snack.action}
        />
      }
    </>
  );

}

function beginGuestDetection(setSnack) {
  const guestToHost$ = getGuestToHostBus();
  return of('').pipe(
    delay(1500),
    take(1),
    takeUntil(guestToHost$.pipe(
      filter(({ type }) => type === GUEST_CHECK_IN)
    ))
  ).subscribe(() => {
    setSnack({
      duration: 10000,
      message: (
        <FormattedMessage
          id="guestDetectionMessage"
          defaultMessage="Communication with guest site was not detected."
        />
      ),
      action: [
        <Button key="learnMore" color="secondary" size="small" onClick={() => setSnack(null)}>
          Learn More
        </Button>
      ],
      position: { vertical: 'top', horizontal: 'center' }
    })
  });
}

function setSiteCookie(site) {
  Cookies.set('crafterSite', site, {
    domain: window.location.hostname.includes('.') ? window.location.hostname : '',
    path: '/'
  });
}

try {
  // TODO: Temp. To be removed.
  document.domain = 'authoring.sample.com';
} catch (e) {
  console.log(e);
}
