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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fromEvent, interval, zip } from 'rxjs';
import { filter, share, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import iceRegistry from '../classes/ICERegistry';
import contentController from '../classes/ContentController';
import { ElementRegistry } from '../classes/ElementRegistry';
import $ from 'jquery';
import { GuestContextProvider } from './GuestContext';
import CrafterCMSPortal from './CrafterCMSPortal';
import ZoneMarker from './ZoneMarker';
import DropMarker from './DropMarker';
import { appendStyleSheet } from '../styles';
import { fromTopic, message$, post } from '../communicator';
import Cookies from 'js-cookie';
import { ContentInstance } from '@craftercms/studio-ui/models/ContentInstance';
import { HoverData } from '../models/InContextEditing';
import { LookupTable } from '@craftercms/studio-ui/models/LookupTable';
import AssetUploaderMask from './AssetUploaderMask';
import {
  ASSET_DRAG_ENDED,
  ASSET_DRAG_STARTED,
  CLEAR_HIGHLIGHTED_RECEPTACLES,
  CLEAR_SELECTED_ZONES,
  COMPONENT_DRAG_ENDED,
  COMPONENT_DRAG_STARTED,
  COMPONENT_INSTANCE_DRAG_ENDED,
  COMPONENT_INSTANCE_DRAG_STARTED,
  CONTENT_TREE_FIELD_SELECTED,
  CONTENT_TYPE_RECEPTACLES_REQUEST,
  CONTENT_TYPE_RECEPTACLES_RESPONSE,
  DESKTOP_ASSET_UPLOAD_COMPLETE,
  DESKTOP_ASSET_UPLOAD_PROGRESS,
  EDIT_MODE_CHANGED,
  GUEST_CHECK_IN,
  GUEST_CHECK_OUT,
  HOST_CHECK_IN,
  NAVIGATION_REQUEST,
  RELOAD_REQUEST,
  SCROLL_TO_RECEPTACLE,
  TRASHED
} from '../constants';
import { createGuestStore } from '../store/store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { clearAndListen$ } from '../store/subjects';
import { GuestState } from '../store/models/GuestStore';
import { EditingStatus } from '../models/ICEStatus';
import { isNullOrUndefined } from '../utils/object';
import { getHighlighted, scrollToNode, scrollToReceptacle } from '../utils/dom';
import { dragOk } from '../store/util';
import { Asset } from '../models/Asset';
// TinyMCE makes the build quite large. Temporarily, importing this externally via
// the site's ftl. Need to evaluate whether to include the core as part of guest build or not
// import tinymce from 'tinymce';

const initialDocumentDomain = document.domain;

interface GuestProps {
  modelId: string;
  documentDomain?: string;
  path?: string;
  styles?: any;
  children?: any;
  isAuthoring?: boolean;
  scrollElement?: string;
  editModeOnIndicatorClass?: string;
}

function Guest(props: GuestProps) {
  // TODO: support path driven Guest.
  // TODO: consider supporting developer to provide the data source (promise/observable?)
  const {
    path,
    styles,
    modelId,
    children,
    documentDomain,
    scrollElement = 'html, body',
    editModeOnIndicatorClass = 'craftercms-ice-on'
  } = props;

  const dispatch = useDispatch();
  const state = useSelector<GuestState, GuestState>((state) => state);
  const status = state.status;
  const context = useMemo(
    () => ({
      onEvent(event: Event, dispatcherElementRecordId: number) {
        if (persistenceRef.current.contentReady && state.inEditMode) {
          const { type } = event;

          const record = ElementRegistry.get(dispatcherElementRecordId);
          if (isNullOrUndefined(record)) {
            throw new Error('No record found for dispatcher element');
          }

          dispatch({ type: type, payload: { event, record } });
        }
      }
    }),
    [dispatch, state.inEditMode]
  );

  // region Stuff to remove
  const fnRef = useRef<any>();
  const highlightedInitialData: LookupTable<HoverData> = {};
  const persistenceRef = useRef({
    contentReady: false,
    mouseOverTimeout: null,
    dragover$: null,
    scrolling$: null,
    onScroll: null
  });
  const [, forceUpdate] = useState({});
  const stateRef = useRef({
    dragContext: null,
    common: {
      ICE_GUEST_INIT: true,
      status: EditingStatus.LISTENING,
      inEditMode: true,
      editable: {},
      draggable: {},
      highlighted: highlightedInitialData,
      uploading: highlightedInitialData
    }
  });
  const toBeRemoved_setState = (nextState) => {
    stateRef.current = nextState;
    forceUpdate({});
  };
  const fn = {
    onEditModeChanged(inEditMode): void {
      const status = inEditMode ? EditingStatus.LISTENING : EditingStatus.OFF;

      $('html')[inEditMode ? 'addClass' : 'removeClass'](editModeOnIndicatorClass);

      toBeRemoved_setState({
        ...stateRef.current,
        common: {
          ...stateRef.current.common,
          status,
          inEditMode
        }
      });
    },

    onHostInstanceDragStarted(instance: ContentInstance): void {
      let players = [];
      let siblings = [];
      let containers = [];
      let dropZones = [];

      const receptacles = iceRegistry.getContentTypeReceptacles(instance.craftercms.contentTypeId);

      if (receptacles.length === 0) {
        // TODO: If there are no receptacles, the component should it even be listed as an option (?)
        return;
      }

      const validatedReceptacles = receptacles.filter((id) => {
        // TODO: min/max count validations
        return true;
      });

      //scrollToReceptacle(validatedReceptacles);

      validatedReceptacles.forEach(({ id }) => {
        const dropZone = ElementRegistry.compileDropZone(id);
        dropZone.origin = null;
        dropZones.push(dropZone);

        siblings = siblings.concat(dropZone.children);
        players = players.concat(dropZone.children).concat(dropZone.element);
        containers.push(dropZone.element);
      });

      const highlighted = getHighlighted(dropZones);

      // initializeDragSubjects();

      toBeRemoved_setState({
        dragContext: {
          players,
          siblings,
          dropZones,
          containers,
          instance,
          inZone: false,
          dragged: null,
          targetIndex: null
        },
        common: {
          ...stateRef.current.common,
          status: EditingStatus.PLACING_DETACHED_COMPONENT,
          highlighted
        }
      });
    },

    onHostInstanceDragEnd(): void {
      //dragOk() && dispatch({ type: 'computed_dragend' });
    },

    insertInstance(): void {
      const { targetIndex, instance, dropZone } = stateRef.current.dragContext;
      const record = iceRegistry.recordOf(dropZone.iceId);

      setTimeout(() => {
        contentController.insertInstance(
          record.modelId,
          record.fieldId,
          record.fieldId.includes('.') ? `${record.index}.${targetIndex}` : targetIndex,
          instance
        );
      });
    },

    onScroll(): void {
      toBeRemoved_setState({
        dragContext: {
          ...stateRef.current.dragContext,
          over: null,
          inZone: false,
          targetIndex: null,
          scrolling: true
        },
        common: {
          ...stateRef.current.common
        }
      });
    },

    onScrollStopped(): void {
      const dragContext = stateRef.current.dragContext;
      toBeRemoved_setState({
        dragContext: {
          ...stateRef.current.dragContext,
          scrolling: false,
          dropZones: dragContext?.dropZones?.map((dropZone) => ({
            ...dropZone,
            rect: dropZone.element.getBoundingClientRect(),
            childrenRects: dropZone.children.map((child) => child.getBoundingClientRect())
          }))
        },
        common: {
          ...stateRef.current.common
        }
      });
    },

    onAssetDragStarted(asset: Asset): void {
      let players = [],
        siblings = [],
        containers = [],
        dropZones = [],
        type;

      if (asset.mimeType.includes('image/')) {
        type = 'image';
      } else if (asset.mimeType.includes('video/')) {
        type = 'video-picker';
      }
      const validatedReceptacles = iceRegistry.getMediaReceptacles(type);

      validatedReceptacles.forEach(({ id }) => {
        const dropZone = ElementRegistry.compileDropZone(id);
        dropZone.origin = false;
        dropZones.push(dropZone);

        players = [...players, dropZone.element];
        containers.push(dropZone.element);
      });

      const highlighted = getHighlighted(dropZones);

      // initializeDragSubjects();

      toBeRemoved_setState({
        dragContext: {
          players,
          siblings,
          dropZones,
          containers,
          inZone: false,
          targetIndex: null,
          dragged: asset
        },
        common: {
          ...stateRef.current.common,
          status: EditingStatus.PLACING_DETACHED_ASSET,
          highlighted
        }
      });
    },

    onAssetDragEnded(): void {
      dispatch({ type: 'computed_dragend' });
    },

    // onDrop doesn't execute when trashing on host side
    // Consider behaviour when running Host Guest-side
    onTrashDrop(iceId: number): void {
      let { modelId, fieldId, index } = iceRegistry.recordOf(iceId);
      contentController.deleteItem(modelId, fieldId, index);
    },

    onDesktopAssetDragStarted(asset: DataTransferItem): void {
      let players = [],
        siblings = [],
        containers = [],
        dropZones = [],
        type;

      if (asset.type.includes('image/')) {
        type = 'image';
      } else if (asset.type.includes('video/')) {
        type = 'video-picker';
      }
      const validatedReceptacles = iceRegistry.getMediaReceptacles(type);
      // scrollToReceptacle(validatedReceptacles);

      validatedReceptacles.forEach(({ id }) => {
        const dropZone = ElementRegistry.compileDropZone(id);
        dropZone.origin = false;
        dropZones.push(dropZone);

        players = [...players, dropZone.element];
        containers.push(dropZone.element);
      });

      const highlighted = getHighlighted(dropZones);

      // initializeDragSubjects();

      toBeRemoved_setState({
        dragContext: {
          players,
          siblings,
          dropZones,
          containers,
          inZone: false,
          targetIndex: null,
          dragged: asset
        },
        common: {
          ...stateRef.current.common,
          status: EditingStatus.UPLOAD_ASSET_FROM_DESKTOP,
          highlighted
        }
      });
    }
  };
  fnRef.current = fn;
  // endregion

  // Sets document domain
  useEffect(() => {
    if (documentDomain) {
      try {
        document.domain = documentDomain;
      } catch (e) {
        console.error(e);
      }
    } else {
      document.domain = initialDocumentDomain;
    }
  }, [documentDomain]);

  // Appends the Guest stylesheet
  useEffect(() => {
    const stylesheet = appendStyleSheet(styles);
    return () => {
      stylesheet.detach();
    };
  }, [styles]);

  // Subscribes to accommodation messages and routes them.
  useEffect(() => {
    const fn = fnRef.current;
    const sub = message$.subscribe(function({ type, payload }) {
      switch (type) {
        case EDIT_MODE_CHANGED:
          return fn.onEditModeChanged(payload.inEditMode);
        case ASSET_DRAG_STARTED:
          return fn.onAssetDragStarted(payload);
        case ASSET_DRAG_ENDED:
          return fn.onAssetDragEnded();
        case COMPONENT_DRAG_STARTED:
          dispatch({ type: 'host_component_drag_started', payload: { contentType: payload } });
          break;
        case COMPONENT_DRAG_ENDED:
          dragOk(status) && dispatch({ type: 'computed_dragend' });
          break;
        case COMPONENT_INSTANCE_DRAG_STARTED:
          return fn.onHostInstanceDragStarted(payload);
        case COMPONENT_INSTANCE_DRAG_ENDED:
          return fn.onHostInstanceDragEnd();
        case TRASHED:
          return fn.onTrashDrop(payload);
        case CLEAR_SELECTED_ZONES:
          clearAndListen$.next();
          dispatch({ type: 'start_listening' });
          break;
        case RELOAD_REQUEST: {
          post({ type: GUEST_CHECK_OUT });
          return window.location.reload();
        }
        case NAVIGATION_REQUEST: {
          post({ type: GUEST_CHECK_OUT });
          return (window.location.href = payload.url);
        }
        case CONTENT_TYPE_RECEPTACLES_REQUEST: {
          const highlighted = {};
          let receptacles = iceRegistry.getContentTypeReceptacles(payload).map((item) => {
            let { physicalRecordId } = ElementRegistry.compileDropZone(item.id);
            let highlight = ElementRegistry.getHoverData(physicalRecordId);
            highlighted[physicalRecordId] = highlight;
            return {
              modelId: item.modelId,
              fieldId: item.fieldId,
              label: highlight.label,
              id: item.id,
              contentTypeId: payload
            };
          });
          toBeRemoved_setState({
            dragContext: {
              ...stateRef.current.dragContext,
              inZone: false
            },
            common: {
              ...stateRef.current.common,
              status: EditingStatus.SHOW_RECEPTACLES,
              highlighted
            }
          });
          post({
            type: CONTENT_TYPE_RECEPTACLES_RESPONSE,
            payload: { contentTypeId: payload, receptacles }
          });
          break;
        }
        case SCROLL_TO_RECEPTACLE:
          scrollToReceptacle([payload], scrollElement, (id: number) => ElementRegistry.fromICEId(id).element);
          break;
        case CLEAR_HIGHLIGHTED_RECEPTACLES:
          // TODO: Use new mechanics, remove the toBeRemoved_setState
          toBeRemoved_setState({
            ...stateRef.current,
            common: {
              ...stateRef.current.common,
              status: EditingStatus.LISTENING,
              highlighted: {}
            }
          });
          break;
        case CONTENT_TREE_FIELD_SELECTED: {
          scrollToNode(payload, scrollElement);
          break;
        }
        case DESKTOP_ASSET_UPLOAD_PROGRESS:
        case DESKTOP_ASSET_UPLOAD_COMPLETE:
          // dispatch(type.toLowerCase())
          break;
      }
    });
    return () => {
      sub.unsubscribe();
    };
  }, [dispatch, scrollElement, status]);

  // Check in & host detection
  useEffect(() => {
    const location = window.location.href;
    const origin = window.location.origin;
    const url = location.replace(origin, '');
    const site = Cookies.get('crafterSite');
    interval(1000)
      .pipe(takeUntil(fromTopic(HOST_CHECK_IN).pipe(take(1))), take(1))
      .subscribe(() => {
        console.log('No Host was detected. In-Context Editing is off.');
      });
    post(GUEST_CHECK_IN, { url, location, origin, modelId, path, site });
  }, [modelId, path]);

  // Registers parent zone
  useEffect(() => {
    const iceId = iceRegistry.register({ modelId });
    zip(contentController.models$(modelId), contentController.contentTypes$())
      .pipe(take(1))
      .subscribe(() => {
        persistenceRef.current.contentReady = true;
      });
    return () => {
      iceRegistry.deregister(iceId);
    };
  }, [modelId, path]);

  // Listen for desktop asset drag & drop
  useEffect(() => {
    const subscription = fromEvent<DragEvent>(document, 'dragenter')
      .pipe(filter((e) => e.dataTransfer?.types.includes('Files')))
      .subscribe((e) => {
        e.preventDefault();
        e.stopPropagation();
        fnRef.current.onDesktopAssetDragStarted(e.dataTransfer.items[0]);
      });
    return () => subscription.unsubscribe();
  }, []);

  // Listen for drag events for desktop asset drag & drop
  useEffect(() => {
    const fn = fnRef.current;
    if (EditingStatus.UPLOAD_ASSET_FROM_DESKTOP === status) {
      const dropSubscription = fromEvent(document, 'drop').subscribe((e) => {
        e.preventDefault();
        e.stopPropagation();
        fn.dragend(e);
      });
      const dragover$ = fromEvent(document, 'dragover').pipe(
        tap((e) => {
          e.preventDefault();
          e.stopPropagation();
        }),
        share()
      );
      const dragoverSubscription = dragover$.subscribe();
      const dragleaveSubscription = fromEvent(document, 'dragleave')
        .pipe(switchMap(() => interval(100).pipe(takeUntil(dragover$))))
        .subscribe(fn.onDragEnd);
      return () => {
        dropSubscription.unsubscribe();
        dragoverSubscription.unsubscribe();
        dragleaveSubscription.unsubscribe();
      };
    }
  }, [status]);

  return (
    <GuestContextProvider value={context}>
      {children}
      {status !== EditingStatus.OFF && (
        <CrafterCMSPortal>
          {Object.values(state.uploading).map((highlight: HoverData) => (
            <AssetUploaderMask key={highlight.id} {...highlight} />
          ))}
          {Object.values(state.highlighted).map((highlight: HoverData) => (
            <ZoneMarker
              key={highlight.id}
              {...highlight}
              classes={{
                marker: Object.values(highlight.validations).length
                  ? Object.values(highlight.validations).some(({ level }) => level === 'required')
                    ? 'craftercms-required-validation'
                    : 'craftercms-suggestion-validation'
                  : null
              }}
            />
          ))}
          {[
            EditingStatus.SORTING_COMPONENT,
            EditingStatus.PLACING_NEW_COMPONENT,
            EditingStatus.PLACING_DETACHED_COMPONENT
          ].includes(status) &&
            state.dragContext.inZone && (
              <DropMarker
                onDropPosition={(payload) => dispatch({ type: 'set_drop_position', payload })}
                dropZone={state.dragContext.dropZone}
                over={state.dragContext.over}
                prev={state.dragContext.prev}
                next={state.dragContext.next}
                coordinates={state.dragContext.coordinates}
              />
            )}
        </CrafterCMSPortal>
      )}
    </GuestContextProvider>
  );
}

export default function(props: GuestProps) {
  const { isAuthoring = true, children } = props;
  const store = useMemo(() => createGuestStore(), []);
  return isAuthoring ? (
    <Provider store={store}>
      <Guest {...props}>{children}</Guest>
    </Provider>
  ) : (
    children
  );
}

// Notice this is not executed when the iFrame url is changed abruptly.
// This only triggers when navigation occurs from within the guest page.
window.addEventListener(
  'beforeunload',
  () => {
    post({ type: GUEST_CHECK_OUT });
  },
  false
);
