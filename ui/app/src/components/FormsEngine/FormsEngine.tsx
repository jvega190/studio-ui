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

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import useActiveSite from '../../hooks/useActiveSite';
import useContentTypes from '../../hooks/useContentTypes';
import React, { ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ContentTypeField, PublishPackage } from '../../models';
import {
	FormsEngineAtoms,
	FormsEngineEditContextProps,
	FormsEngineFormApiContextProps,
	FormsEngineFormContextApi,
	FormsEngineGlobalApiContextProps,
	FormsEngineItemMetaContextProps,
	ItemContext,
	ItemMetaContext,
	StableFormContext,
	StableFormContextProps,
	StableGlobalContext,
	StableGlobalContextProps
} from './formsEngineContext';
import { fetchDetailedItemComplete, unlockItem } from '../../state/actions/content';
import { catchError, of, Subject } from 'rxjs';
import LoadingState from '../LoadingState';
import Paper, { paperClasses } from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Drawer, { drawerClasses, DrawerProps } from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MinimizeIconRounded from '@mui/icons-material/RemoveRounded';
import MaximiseIcon from '@mui/icons-material/OpenInFullRounded';
import CloseFullscreenOutlined from '@mui/icons-material/CloseFullscreenOutlined';
import Close from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import { createErrorStatePropsFromApiResponse } from '../ApiResponseErrorState';
import Button, { ButtonProps } from '@mui/material/Button';
import { StickyBox } from './common/StickyBox';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { EnhancedDialogProps } from '../EnhancedDialog';
import useEnhancedDialogContext from '../EnhancedDialog/useEnhancedDialogContext';
import { ArrowUpward, EditOffOutlined } from '@mui/icons-material';
import ContentType from '../../models/ContentType';
import { createCleanValuesObject } from './validateFieldValue';
import LookupTable from '../../models/LookupTable';
import { RepeatItem } from './controls/Repeat';
import SecondaryButton from '../SecondaryButton';
import Fab from '@mui/material/Fab';
import useUpdateRefs from '../../hooks/useUpdateRefs';
import { Fade } from '@mui/material';
import { displayWithPendingChangesConfirm } from '../GlobalDialogManager';
import AlertTitle from '@mui/material/AlertTitle';
import { pushDialog } from '../../state/actions/dialogStack';
import useFetchSandboxItems from '../../hooks/useFetchSandboxItems';
import ErrorBoundary from '../ErrorBoundary';
import { debounceTime } from 'rxjs/operators';
import { atom, createStore, Provider, useAtom, useAtomValue, useStore as useJotaiStore } from 'jotai';
import useActiveSiteId from '../../hooks/useActiveSiteId';
import useSelection from '../../hooks/useSelection';
import ApiResponse from '../../models/ApiResponse';
import { PrimitiveAtom } from 'jotai/index';
import usePreviousValue from '../../hooks/usePreviousValue';
import { areTuplesEqual } from '../../utils/array';
import { AjaxError } from 'rxjs/ajax';
import { ErrorState } from '../ErrorState';
import { ViewPackagesDialogProps } from '../ViewPackagesDialog';
import {
	buildSectionExpandedStateAtoms,
	createFieldAtoms,
	createFormsEngineAtoms,
	createFormStackData,
	createObjectWithSystemProps,
	createReadonlyAtom,
	displayFormBeingSavedSnack,
	fetchUpdateRequirements,
	getScrollContainer,
	getTargetHeight,
	internalLockContentService,
	internalUnlockContentService,
	produceChangedFieldsMessage,
	setFieldAtoms
} from './common/formUtils';
import { renderFieldControl } from './common/supportingControls';
import {
	ContentTypeNotFoundError,
	InvalidParamsError,
	ItemNotFoundError,
	NoSiteIdError,
	stackFormCountAtom,
	UnknownError,
	XmlKeys
} from './common/formConsts';
import FormLayout from './common/FormLayout';
import TableOfContents from './common/TableOfContents';
import CreateModeHeader from './common/CreateModeHeader';
import RepeatModeHeader from './common/RepeatModeHeader';
import EditModeHeader from './common/EditModeHeader';
import SaveCard from './common/SaveCard';
import SectionAccordion from './common/SectionAccordion';
import { useSaveForm } from './common/useSaveForm';

export interface FormSavePromiseResult {
	close: boolean;
}

export interface BaseProps extends Partial<UpdateModeProps & RepeatModeProps & CreateModeProps> {
	stackIndex?: number;
	stackTransitionEnded?: boolean;
	readonly?: boolean;
	/** Whether the form is rendered in a dialog. Causes various layout adjustments. **/
	isDialog?: boolean;
	onClose?: EnhancedDialogProps['onClose'];
	onMinimize?: EnhancedDialogProps['onMinimize'];
	onFullScreen?: EnhancedDialogProps['onFullScreen'];
	onCancelFullScreen?: EnhancedDialogProps['onCancelFullScreen'];
	/** The form will render only the specified fields from the main content type being worked with */
	fieldsToRender?: ContentTypeField[];
	// Controls like the Item Selector and Repeat use the onSave to update once the form they opened is "saved".
	// Executing the onClose without the "timeout", causes values set at the control prior to closing to get lost somehow.
	// The promise works as a timeout and allows the control to do async operations before the form acts on its result.
	onSave?(result: {
		// The `dom` and `xml` properties are not applicable for repeat forms
		dom?: Document | Element;
		xml?: string;
		values: LookupTable<unknown>;
		versionComment: string;
	}): Promise<FormSavePromiseResult> | undefined;
}

export interface UpdateModeProps {
	update: {
		path: string;
		modelId?: string;
		values?: LookupTable<unknown>;
	};
}

export interface RepeatModeProps {
	repeat: {
		fieldId: string;
		index?: number;
		values?: RepeatItem;
	};
}

export interface CreateModeProps {
	create: {
		path: string;
		contentTypeId: string;
	};
}

export type FormsEngineProps = BaseProps & (UpdateModeProps | RepeatModeProps | CreateModeProps);

// Entry point for the form engine. It sets up the Jotai store and the global form context.
function Root(props: FormsEngineProps) {
	const store = useMemo(() => createStore(), []); // TODO: Use stable memo?
	const stableGlobalContextRef = useRef<StableGlobalContextProps>(undefined);
	if (!stableGlobalContextRef.current) {
		stableGlobalContextRef.current = {
			api: null,
			formsStackData: [createFormStackData({ props })]
		};
	}
	stableGlobalContextRef.current.api = useMemo<FormsEngineGlobalApiContextProps>(() => {
		const setCount = (factor: 1 | -1) => {
			const currentCount = store.get(stackFormCountAtom);
			store.set(stackFormCountAtom, currentCount + factor);
		};
		const api: FormsEngineGlobalApiContextProps = {
			pushForm(props) {
				stableGlobalContextRef.current.formsStackData.push(createFormStackData({ props }));
				setCount(1);
			},
			popForm() {
				stableGlobalContextRef.current.formsStackData.pop();
				setCount(-1);
			},
			updateProps(stackIndex, formProps) {
				stableGlobalContextRef.current.formsStackData[stackIndex].props = formProps;
			},
			setStateCache(stackIndex, state) {
				stableGlobalContextRef.current.formsStackData[stackIndex].state = state;
			}
		};
		return api;
	}, [store]);
	return (
		<ErrorBoundary>
			<StableGlobalContext.Provider value={stableGlobalContextRef.current}>
				<Provider store={store}>
					<Prepper {...props} />
				</Provider>
			</StableGlobalContext.Provider>
		</ErrorBoundary>
	);
}

// Collects the requirements for the form and sets up various contexts.
function Prepper(props: FormsEngineProps) {
	const { create, update, repeat, fieldsToRender, readonly: readonlyProp, stackIndex = 0, isDialog } = props;
	const siteId = useActiveSiteId();
	const dispatch = useDispatch();
	const contentTypesById = useContentTypes();
	const [contentTypesLoaded, setContentTypesLoaded] = useState(Boolean(contentTypesById));
	const { formsStackData, api } = useContext(StableGlobalContext);
	const [itemMeta, setItemMeta] = useState<FormsEngineItemMetaContextProps>(formsStackData[stackIndex].itemMeta);
	const [ready, setReady] = useState(false);
	const [prepError, setPrepError] = useState<symbol>();
	const store = useJotaiStore();
	const theme = useTheme();
	const { isFullScreen = false } = useEnhancedDialogContext() ?? {};
	const previousProps = usePreviousValue(props);
	const effectRefs = useUpdateRefs({ contentTypesById, previousProps });
	const stableFormContextRef = useRef<StableFormContextProps>(formsStackData[stackIndex]);

	const contextApi = useMemo<FormsEngineFormApiContextProps>(() => {
		const getInitialValues = () => stableFormContextRef.current.originalValues;
		const rollbackAtom = (atom: PrimitiveAtom<unknown>, value: unknown) => store.set(atom, value);
		const internalRollbackValue = (initialValues: LookupTable<unknown>, fieldId: string) => {
			const value = initialValues[fieldId];
			const atom = stableFormContextRef.current.atoms.valueByFieldId[fieldId];
			rollbackAtom(atom, value);
		};
		const api: FormsEngineFormApiContextProps = {
			rollback() {
				const initialValues = getInitialValues();
				Object.keys(initialValues).forEach((fieldId) => {
					internalRollbackValue(initialValues, fieldId);
				});
			},
			rollbackField(fieldId: string) {
				internalRollbackValue(getInitialValues(), fieldId);
			},
			setValuesCheckpoint(values: LookupTable<unknown>) {
				stableFormContextRef.current.originalValues = values;
				stableFormContextRef.current.changedFieldIds.clear();
			}
		};
		return api;
	}, [store]);

	const liveUpdatedItem = useSelection((state) =>
		// If we're in create mode, there's no item yet. If updating, we can get the path from props or parent props in the case of repeat mode.
		create
			? null
			: state.content.itemsByPath[props?.update?.path ?? formsStackData[stackIndex - 1]?.props?.update?.path]
	);

	api.updateProps(stackIndex, props);

	useEffect(() => {
		if (!liveUpdatedItem) {
			setReady(false);
		}
	}, [liveUpdatedItem]);

	useEffect(() => {
		contentTypesById && setContentTypesLoaded(true);
	}, [contentTypesById]);

	// Fetch/prepare requirements
	useEffect(() => {
		// TODO:
		//  - Content type not found
		//  - Item/Content not found
		//  - Invalid params (e.g. create mode without a content type id)
		// TODO: Consider backend that provides all form requirements: form def xml, context xml, sandbox/detailed item, affected workflow, lock(?)
		const previousProps = effectRefs.current.previousProps;
		if (!siteId) {
			setPrepError(NoSiteIdError);
		} else if (
			// Missing or bad combination of props
			[create, update, repeat].filter(Boolean).length !== 1 ||
			// Update prop but no path
			(update && !update.path?.trim()) ||
			// Create prop but no path or content type id
			(create && (!create.path?.trim() || !create.contentTypeId?.trim())) ||
			// Repeat prop but no field id
			(repeat && !repeat.fieldId?.trim())
		) {
			setPrepError(InvalidParamsError);
		} else if (
			stableFormContextRef.current.initialized &&
			(!previousProps ||
				// Note: Make sure to include all relevant props here
				areTuplesEqual([
					[create, previousProps.create],
					[fieldsToRender, previousProps.fieldsToRender],
					[readonlyProp, previousProps.readonly],
					[repeat?.fieldId, previousProps.repeat?.fieldId],
					[repeat?.values, previousProps.repeat?.values],
					[stackIndex, previousProps.stackIndex ?? 0],
					[update?.modelId, previousProps.update?.modelId],
					[update?.path, previousProps.update?.path],
					[update?.values, previousProps.update?.values]
				]))
		) {
			setReady(true);
		} else if (contentTypesLoaded) {
			// TODO: If props are changed, things can be left off... previous item locked, edits get lost, etc.
			//  Not sure how much support for prop changes we should implement.
			if (stableFormContextRef.current.initialized) {
				console.error('Changing props for the FormsEngine component is not fully supported.');
			}
			const isChildForm = stackIndex > 0;
			// In the form stack, the present form being opened would be in the last position [length-1], the parent form
			// state would be on [length-2] if it is nested (e.g. Root => Component(L1) => Repeat(L2)|Component(L2)). Otherwise,
			// the parent should be the root.
			const parentStackData = isChildForm ? formsStackData[stackIndex - 1] : null;
			const parentAtoms = isChildForm ? parentStackData.atoms : null;
			const {
				id: parentId,
				contentType: parentContentType,
				pathInSite: parentPathInSite,
				path: parentPath
			} = parentStackData?.itemMeta ?? {};
			const initializeState = (
				atoms: FormsEngineAtoms,
				values: LookupTable<unknown>,
				itemMeta: FormsEngineItemMetaContextProps
			) => {
				stableFormContextRef.current.atoms = atoms;
				stableFormContextRef.current.initialized = true;
				stableFormContextRef.current.originalValues = values;
				stableFormContextRef.current.itemMeta = itemMeta;
				setItemMeta(stableFormContextRef.current.itemMeta);
				setReady(true);
			};
			if (
				// A repeat group is being opened as a stacked form.
				isChildForm &&
				repeat?.fieldId
			) {
				const contentType: ContentType = effectRefs.current.contentTypesById[parentContentType.id];
				if (!contentType) {
					return setPrepError(ContentTypeNotFoundError);
				}
				const parentLockResult = store.get(parentAtoms.lockResult);
				const isParentLocked = parentLockResult.locked;
				const lockResultAtom = atom<FormsEngineEditContextProps>({
					locked: isParentLocked,
					lockError: parentLockResult.lockError,
					affectedPackages: parentLockResult.affectedPackages
				});
				const atoms = createFormsEngineAtoms({
					lockResult: lockResultAtom,
					readonly: createReadonlyAtom(lockResultAtom),
					expandedStateBySectionId: buildSectionExpandedStateAtoms(contentType.sections)
				});
				const atomValueCreator: Parameters<typeof createCleanValuesObject>[3] = (fieldId, value) => {
					setFieldAtoms(
						stableFormContextRef,
						contentType,
						contentType.fields[repeat.fieldId].fields,
						fieldId,
						atoms,
						value
					);
				};
				const values =
					repeat.values ??
					createCleanValuesObject(fieldsToRender, {}, effectRefs.current.contentTypesById, atomValueCreator);

				// If repeat.values was provided, `createCleanValuesObject` didn't run; hence, atomValueCreator needs to be run manually.
				repeat.values && Object.keys(values).forEach((fieldId) => atomValueCreator(fieldId, values[fieldId]));

				initializeState(atoms, values, {
					id: parentId,
					path: parentPath,
					sourceMap: null,
					pathInSite: parentPathInSite,
					contentType: parentContentType,
					// TODO: is this the right contentObject?
					contentObject: null
				});
			} else if (
				// An embedded component is being opened as a stacked form.
				isChildForm &&
				update?.modelId
			) {
				const contentType: ContentType =
					effectRefs.current.contentTypesById[update.values[XmlKeys.contentTypeId] as string];
				if (!contentType) {
					return setPrepError(ContentTypeNotFoundError);
				}
				const parentLockResult = store.get(parentAtoms.lockResult);
				const isParentLocked = parentLockResult.locked;
				const isParentReadonly = store.get(parentAtoms.readonly);
				const readonly = readonlyProp ?? isParentReadonly;
				const atoms = createFormsEngineAtoms({
					expandedStateBySectionId: buildSectionExpandedStateAtoms(contentType.sections)
				});
				const values = update.values;
				Object.entries(values).forEach(([fieldId, value]) => {
					if (!contentType.fields[fieldId]) {
						// System fields (e.g. content-type, display-template, etc) are not part of the content type, but are part
						// of the content object. We don't need atoms or validity checks for these.
						return;
					}
					const [valueAtom, validityAtom] = createFieldAtoms(contentType.fields[fieldId], value, stableFormContextRef);
					atoms.valueByFieldId[fieldId] = valueAtom;
					atoms.validationByFieldId[fieldId] = validityAtom;
				});
				const setStateValues = (locked: boolean, lockError: ApiResponse, affectedPackages: PublishPackage[]) => {
					const lockResultAtom = atom<FormsEngineEditContextProps>({
						locked,
						lockError,
						affectedPackages
					});
					atoms.lockResult = lockResultAtom;
					atoms.readonly = createReadonlyAtom(lockResultAtom);
					initializeState(atoms, values, {
						id: values[XmlKeys.modelId] as string,
						path: update.path,
						sourceMap: null,
						pathInSite: parentPathInSite,
						contentType: contentType,
						// TODO: source contentObject (from parent?)
						contentObject: {}
					});
				};
				if (readonly === isParentReadonly) {
					setStateValues(isParentLocked, parentLockResult.lockError, parentLockResult.affectedPackages);
				} else {
					const sub = internalLockContentService(siteId, update.path).subscribe((result) => {
						setStateValues(result.locked, result.lockError, result.affectedPackages);
					});
					return () => sub.unsubscribe();
				}
			} else if (
				// Create mode (stacked or not)
				create
			) {
				// Create mode
				const contentType = effectRefs.current.contentTypesById[create.contentTypeId];
				if (!contentType) {
					return setPrepError(ContentTypeNotFoundError);
				}
				const lockResultAtom = atom<FormsEngineEditContextProps>({
					locked: false,
					lockError: null,
					affectedPackages: null
				});
				const atoms: FormsEngineAtoms = createFormsEngineAtoms({
					lockResult: lockResultAtom,
					expandedStateBySectionId: buildSectionExpandedStateAtoms(contentType.sections)
				});
				const contentObject = createObjectWithSystemProps(contentType);
				const values = createCleanValuesObject(
					contentType.fields,
					contentObject,
					contentTypesById,
					(fieldId, value) => {
						setFieldAtoms(stableFormContextRef, contentType, contentType.fields, fieldId, atoms, value);
					}
				);
				initializeState(atoms, values, {
					id: contentObject[XmlKeys.modelId] as string,
					// TODO: Should/could we somehow deduce the target path?
					path: null,
					// TODO: Sourcemap? How can we determine what would be inherited by this content? New API?
					sourceMap: null,
					pathInSite: create.path,
					contentType,
					contentObject
				});
			} /* if (isUpdateMode) */ else {
				const subscription = fetchUpdateRequirements({
					siteId,
					path: update.path,
					modelId: update.modelId,
					readonly: readonlyProp,
					contentTypesById
				})
					.pipe(
						catchError((error: AjaxError | symbol) => {
							if (typeof error === 'symbol') {
								return of(error);
							}
							switch (error.status) {
								case 404:
									return of(ItemNotFoundError);
								default:
									console.error(error);
									return of(UnknownError);
							}
						})
					)
					.subscribe((requirements) => {
						if (typeof requirements === 'symbol') {
							return setPrepError(requirements);
						}
						dispatch(fetchDetailedItemComplete(requirements.item));
						const lockResultAtom = atom<FormsEngineEditContextProps>({
							locked: requirements.locked,
							lockError: requirements.lockError,
							affectedPackages: requirements.affectedPackages
						});
						const atoms = createFormsEngineAtoms({
							lockResult: lockResultAtom,
							readonly: createReadonlyAtom(lockResultAtom),
							expandedStateBySectionId: buildSectionExpandedStateAtoms(requirements.contentType.sections)
						});
						const values = createCleanValuesObject(
							requirements.contentType.fields,
							requirements.contentObject,
							contentTypesById,
							(fieldId, value) => {
								setFieldAtoms(
									stableFormContextRef,
									requirements.contentType,
									requirements.contentType.fields,
									fieldId,
									atoms,
									value
								);
							}
						);
						initializeState(atoms, values, {
							id: values[XmlKeys.modelId] as string,
							path: requirements.item.path,
							// TODO: Sourcemap? How can we determine what would be inherited by this content? New API?
							sourceMap: requirements.sourceMap,
							pathInSite: requirements.pathInSite,
							contentType: requirements.contentType,
							contentObject: requirements.contentObject
						});
					});
				return () => subscription.unsubscribe();
			}
		}
	}, [
		contentTypesById,
		contentTypesLoaded,
		create,
		dispatch,
		effectRefs,
		fieldsToRender,
		formsStackData,
		readonlyProp,
		repeat,
		siteId,
		stackIndex,
		store,
		update
	]);

	if (prepError) {
		let error: ReactNode;
		// TODO: Improve errors
		switch (prepError) {
			case ItemNotFoundError:
				error = <FormattedMessage defaultMessage="The item was not found" />;
				break;
			case ContentTypeNotFoundError:
				error = <FormattedMessage defaultMessage="The content type was not found" />;
				break;
			case InvalidParamsError:
				error = <FormattedMessage defaultMessage="The form was opened with an incorrect set of arguments" />;
				break;
			case NoSiteIdError:
				error = <FormattedMessage defaultMessage="No CrafterCMS project was specified." />;
				break;
			case UnknownError:
			default:
				error = <FormattedMessage defaultMessage="An error occurred preparing the form" />;
				break;
		}
		return <ErrorState title="Error" message={error} />;
	} else if (
		ready &&
		// Create doesn't need the liveUpdateItem, but otherwise, it should be preset before proceeding to rendering a form
		(create || liveUpdatedItem)
	) {
		return (
			<FormsEngineFormContextApi.Provider value={contextApi}>
				<StableFormContext.Provider value={stableFormContextRef.current}>
					<ItemContext.Provider value={liveUpdatedItem}>
						<ItemMetaContext.Provider value={itemMeta}>
							<Form {...props} />
						</ItemMetaContext.Provider>
					</ItemContext.Provider>
				</StableFormContext.Provider>
			</FormsEngineFormContextApi.Provider>
		);
	} else {
		return (
			<LoadingState
				sx={{ height: getTargetHeight(isDialog, isFullScreen, theme) }}
				title={<FormattedMessage defaultMessage="Please wait" />}
				subtitle={<FormattedMessage defaultMessage="Gathering content information" />}
			/>
		);
	}
}

function Form(props: FormsEngineProps) {
	// region const {...} = props
	const {
		create,
		update,
		repeat,
		stackIndex = 0,
		stackTransitionEnded,
		fieldsToRender,
		isDialog = false,
		onSave,
		onClose: onCloseProp
	} = props;
	// endregion
	const theme = useTheme();
	const { formatMessage } = useIntl();
	const dispatch = useDispatch();
	const activeSite = useActiveSite();
	const siteId = activeSite.id;
	const containerRef = useRef<HTMLDivElement>(undefined);
	const [containerStats, setContainerStats] = useState<{
		// TODO: Not using all of this. Clean up.
		x: number;
		y: number;
		width: number;
		height: number;
		top: number;
		right: number;
		bottom: number;
		left: number;
		isLargeContainer: boolean;
	}>(null);
	const {
		isFullScreen = false,
		updateSubmittingOrHasPendingChanges,
		onClose: enhancedDialogOnClose
	} = useEnhancedDialogContext() ?? {};
	const [disableStackedFormDrawerAutoFocus, setDisableStackedFormDrawerAutoFocus] = useState(true);
	const [enablingEditInProgress, setEnablingEditInProgress] = useState(false);
	const [collapsedToC, setCollapsedToC] = useState(false); // Controls the Table of Contents being collapsed under a drawer or visible
	const store = useJotaiStore();
	const { api: contextApi, formsStackData } = useContext(StableGlobalContext);
	const stableFormContext = useContext(StableFormContext);
	const formContextApi = useContext(FormsEngineFormContextApi);
	const { fieldUpdates$, changedFieldIds } = stableFormContext;
	const item = useContext(ItemContext);
	const { contentType, sourceMap } = useContext(ItemMetaContext);
	const [openDrawerSidebar, setOpenDrawerSidebar] = useAtom(stableFormContext.atoms.tableOfContentsDrawerOpen);
	const isSubmitting = useAtomValue(stableFormContext.atoms.isSubmitting);
	const [hasPendingChanges, setHasPendingChanges] = useAtom(stableFormContext.atoms.hasPendingChanges);
	const readonly = useAtomValue(stableFormContext.atoms.readonly);
	const [lockStatus, setLockStatus] = useAtom(stableFormContext.atoms.lockResult);
	const stackFormCount = useAtomValue(stackFormCountAtom);
	const isStackedForm = stackIndex > 0;
	const hasStackedForms = !isStackedForm && stackFormCount > 0;
	const isEmbedded = Boolean(update?.modelId);
	const isCreateMode = Boolean(create?.path);
	const isRepeatMode = Boolean(repeat?.fieldId);
	const affectedPackages = lockStatus.affectedPackages?.length > 0;
	const isLargeContainer = containerStats?.isLargeContainer;
	const contentTypeFields = contentType.fields;
	const contentTypeSections = contentType.sections;
	const useCollapsedToC = isLargeContainer ? collapsedToC : true;
	const tableOfContents = <TableOfContents fieldsToRender={fieldsToRender} containerRef={containerRef} />;
	const effectRefs = useUpdateRefs({
		store,
		fieldsToRender,
		versionCommentAtom: stableFormContext.atoms.versionComment
	});

	// Version comment generator & change detection/tracking
	useEffect(() => {
		const sub = fieldUpdates$.pipe(debounceTime(300)).subscribe(() => {
			// String-type fields have auto-rollback detection; the fieldUpdates$ will emit anyway. Checking if the fieldId
			// emitted is in changedFieldIds should tell if the field was rolled back.
			setHasPendingChanges(changedFieldIds.size > 0);
			// No comment generation for content creation.
			if (isCreateMode) return;
			let fieldsToRender = contentType.fields;
			if (effectRefs.current.fieldsToRender) {
				fieldsToRender = {};
				effectRefs.current.fieldsToRender.forEach((field) => {
					fieldsToRender[field.id] = field;
				});
			}
			const fieldsChanged = Array.from(changedFieldIds).flatMap(
				(fieldId) => fieldsToRender[fieldId === XmlKeys.folderName ? XmlKeys.fileName : fieldId]?.name ?? []
			);
			const versionCommentAtom = effectRefs.current.versionCommentAtom;
			const currentMessage = store.get(versionCommentAtom).trim();
			const newMessage = produceChangedFieldsMessage(fieldsChanged);
			if (
				// If message is blank, no point in checking if the user has altered the message.
				currentMessage !== '' &&
				// A repeated field is reporting changes, no need to set
				(currentMessage === newMessage ||
					// The version comment hasn't been manually altered by the user (i.e. if the current message is the same
					// as the message generated without the last field added to changedFieldIds, we can assume the message
					// has not been altered by user input)
					currentMessage !== produceChangedFieldsMessage(fieldsChanged.slice(0, -1)))
			) {
				// Do not set a new message
				return;
			}
			store.set(versionCommentAtom, newMessage);
		});
		return () => {
			sub.unsubscribe();
		};
	}, [changedFieldIds, contentType.fields, effectRefs, setHasPendingChanges, fieldUpdates$, store, isCreateMode]);

	const sourceMapPaths = useMemo(() => Object.values(sourceMap ?? []).sort(), [sourceMap]);
	useFetchSandboxItems(sourceMapPaths);

	// Resize observer attached to the [scroll] container
	useLayoutEffect(() => {
		if (containerRef.current) {
			const resize$ = new Subject<void>();
			const container: HTMLElement = getScrollContainer(containerRef.current);
			const setValues = (rect: DOMRect) => {
				const width = rect.width;
				container.style.setProperty('--container-width', `${width}px`);
				container.style.setProperty('--container-height', `${rect.height}px`);
				setContainerStats({
					x: rect.x,
					y: rect.y,
					top: rect.top,
					right: rect.right,
					left: rect.left,
					bottom: rect.bottom,
					width: rect.width,
					height: rect.height,
					isLargeContainer: width >= theme.breakpoints.values.lg
				});
			};
			const resizeObserver = new ResizeObserver(() => {
				resize$.next();
			});
			const subscription = resize$.pipe(debounceTime(300)).subscribe(() => {
				setValues(container.getBoundingClientRect());
			});
			resizeObserver.observe(document.documentElement);
			return () => {
				resizeObserver.disconnect();
				subscription.unsubscribe();
			};
		}
	}, [
		theme.breakpoints.values.lg,
		// `isFullScreen` isn't used inside the effect but want to trigger the calculations when changed.
		isFullScreen
	]);

	// If rendered in a dialog, update the dialog's isSubmitting and hasPendingChanges. Only the root form.
	// Stacked forms have their own changes and submit state management.
	useEffect(() => {
		if (!isStackedForm) {
			updateSubmittingOrHasPendingChanges?.({ isSubmitting, hasPendingChanges });
		}
	}, [isSubmitting, hasPendingChanges, isStackedForm, updateSubmittingOrHasPendingChanges]);

	// Unlock content when the form is closed.
	useEffect(() => {
		return () => {
			if (
				!isRepeatMode &&
				!isCreateMode &&
				!readonly &&
				// Note these "Or" statements below build on top of the previous one (i.e. it only gets to the next if the previous is false).
				// If it's not embedded, unlock the item.
				(!isEmbedded ||
					// If is embedded but not stacked, unlock as the embedded is the root form.
					!isStackedForm ||
					// If the parent form is readonly, release the lock to put the parent back in sync with its readonly mode.
					store.get(formsStackData[stackIndex - 1].atoms.readonly))
			) {
				dispatch(unlockItem({ path: item['path'] }));
			}
		};
	}, [
		dispatch,
		formsStackData,
		isRepeatMode,
		isCreateMode,
		isEmbedded,
		isStackedForm,
		item,
		readonly,
		stackIndex,
		store
	]);

	const handleOpenDrawerSidebar = () => {
		const scroller = getScrollContainer(containerRef.current);
		scroller.style.setProperty('--scroll-top', `${containerRef.current.scrollTop}px`);
		scroller.style.overflowY = 'hidden';
		setOpenDrawerSidebar(true);
	};
	const handleCloseDrawerSidebar: DrawerProps['onClose'] = () => {
		containerRef.current.style.overflowY = '';
		setOpenDrawerSidebar(false);
	};
	const handleCloseDrawerForm: DrawerProps['onClose'] = () => {
		if (!hasStackedForms) return;
		const childState = {
			isSubmitting: store.get(formsStackData[formsStackData.length - 1].atoms.isSubmitting),
			hasPendingChanges: store.get(formsStackData[formsStackData.length - 1].atoms.hasPendingChanges),
			readonly: store.get(formsStackData[formsStackData.length - 1].atoms.readonly)
		};
		// Note: This is executed in the context of the parent form.
		// Executed in the case of escape, backdrop click or form close button click.
		const doClose = () => {
			// Unlock item if necessary
			const childProps = formsStackData[formsStackData.length - 1].props;
			// If it is not an "update" (e.g. repeat, create), should not unlock.
			if (!childState.readonly && childProps.update) {
				// No model id means it is a shared component and should be unlocked.
				let shouldUnlock = !childProps.update.modelId;
				if (!shouldUnlock) {
					// This is an embedded component...
					// Unlock only if the parent form is readonly since, unlocking the embedded means unlocking the parent
					// document hence, if parent form is not readonly, it is being edited and shouldn't be unlocked.
					// This logic assumes the form stack is sequential so the parent component would be right before in the state stack.
					shouldUnlock = store.get(formsStackData[formsStackData.length - 2].atoms.readonly);
				}
				shouldUnlock && internalUnlockContentService(siteId, childProps.update?.path).subscribe();
			}
			// Only unlock scroll if this is the last item in the forms stack
			childProps.stackIndex === 0 && (containerRef.current.style.overflowY = '');
			contextApi.popForm();
		};
		if (childState.isSubmitting) {
			displayFormBeingSavedSnack(dispatch, formatMessage);
		} else if (childState.hasPendingChanges) {
			displayWithPendingChangesConfirm(dispatch, doClose);
		} else {
			doClose();
		}
	};

	const currentStackedFormProps = hasStackedForms ? formsStackData[formsStackData.length - 1].props : null;
	let stackedFormKey = undefined;
	if (hasStackedForms) {
		if (currentStackedFormProps.update) {
			stackedFormKey = `${currentStackedFormProps.update.path}_${currentStackedFormProps.update.modelId ?? ''}_${stackFormCount}`;
		} else if (currentStackedFormProps.create) {
			stackedFormKey = `${currentStackedFormProps.create.path}_${currentStackedFormProps.create.contentTypeId}_${stackFormCount}`;
		} else if (currentStackedFormProps.repeat) {
			stackedFormKey = `${currentStackedFormProps.repeat.fieldId}_${stackFormCount}`;
		}
	}

	const updateEditEnablement = (enableEdit: boolean, callback?: (lockResult: FormsEngineEditContextProps) => void) => {
		if (enablingEditInProgress || isCreateMode) return;
		const doEditEnablement = (restoreValues: boolean = false) => {
			// TODO: Re-fetch content when enabling edit? Or monitor changes and auto-reload?
			setEnablingEditInProgress(true);
			const service = enableEdit ? internalLockContentService : internalUnlockContentService;
			service(siteId, item.path).subscribe((lockResult) => {
				setEnablingEditInProgress(false);
				setHasPendingChanges(false);
				if (restoreValues) {
					formContextApi.rollback();
				}
				setLockStatus({
					locked: lockResult.locked,
					lockError: lockResult.lockError,
					affectedPackages: lockResult?.affectedPackages ?? null
				});
				callback?.(lockResult);
			});
		};
		// If hasPendingChanges, should prompt user to save before enabling edit.
		if (!enableEdit && hasPendingChanges) {
			return displayWithPendingChangesConfirm(
				dispatch,
				() => doEditEnablement(true),
				<FormattedMessage defaultMessage="Discard unsaved changes?" />
			);
		}
		doEditEnablement();
	};

	const onCloseHandler = isStackedForm ? onCloseProp : enhancedDialogOnClose;

	const saveFn = useSaveForm({
		onSave,
		isEmbedded,
		isCreateMode,
		isRepeatMode,
		createPath: create?.path,
		onClose: () => onCloseHandler(null, null)
	});

	// If not on a dialog or the prop is not provided, there's no need to handle the close. The form is running in a standalone mode.
	const handleClose: ButtonProps['onClick'] = (e) => {
		if (isSubmitting) {
			displayFormBeingSavedSnack(dispatch, formatMessage);
		} else {
			// If `hasPendingChanges`, we're still calling close assuming the EnhancedDialog will handle showing the close without saving confirm.
			onCloseHandler?.(e, null);
		}
	};

	const bodyFragment = (
		<FormLayout
			stackIndex={stackIndex}
			containerRef={containerRef}
			hasStackedForms={hasStackedForms}
			isLargeContainer={isLargeContainer}
			// If the form is rendered in/as a dialog, take up the whole screen minus
			// top/bottom margins (2 top, 2 bottom). If not a dialog, take up the whole screen.
			targetHeight={getTargetHeight(isDialog, isFullScreen, theme)}
			headerFragment={
				<>
					<Box component={Container} display="flex" alignItems="center" justifyContent="space-between" pt={2}>
						<Typography variant="body2" color="textSecondary">
							<span title={siteId}>{activeSite.name}</span> / <span title={contentType.id}>{contentType.name}</span>
						</Typography>
						<Box sx={[isDialog && { position: 'absolute', top: theme.spacing(1), right: theme.spacing(1) }]}>
							{props.onMinimize && (
								<Tooltip title={<FormattedMessage defaultMessage="Miminize" />}>
									<IconButton size="small" onClick={props.onMinimize}>
										<MinimizeIconRounded />
									</IconButton>
								</Tooltip>
							)}
							{(props.onCancelFullScreen || props.onFullScreen) && (
								<Tooltip title={<FormattedMessage defaultMessage="Maximize" />}>
									<IconButton size="small" onClick={isFullScreen ? props.onCancelFullScreen : props.onFullScreen}>
										{isFullScreen ? <CloseFullscreenOutlined /> : <MaximiseIcon fontSize="small" />}
									</IconButton>
								</Tooltip>
							)}
							{handleClose && (
								<Tooltip title={<FormattedMessage defaultMessage="Close" />}>
									<IconButton size="small" onClick={handleClose}>
										<Close />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					</Box>
					{isRepeatMode ? (
						<RepeatModeHeader repeat={repeat} />
					) : isCreateMode ? (
						<CreateModeHeader path={create?.path} />
					) : (
						<EditModeHeader
							isLargeContainer={isLargeContainer}
							useCollapsedToC={useCollapsedToC}
							setCollapsedToC={setCollapsedToC}
							isEmbedded={isEmbedded}
						/>
					)}
				</>
			}
			mainContentGrid={
				<>
					<Grid size={useCollapsedToC ? 'auto' : 'grow'}>
						<StickyBox data-area-id="stickySidebar">
							{useCollapsedToC ? (
								<IconButton size="small" onClick={handleOpenDrawerSidebar}>
									<MenuRounded />
								</IconButton>
							) : (
								tableOfContents
							)}
						</StickyBox>
					</Grid>
					<Grid size={useCollapsedToC ? 8.3 : 7} className="space-y" data-area-id="formBody">
						{affectedPackages && (
							<Alert
								severity="warning"
								variant="outlined"
								action={
									<Button
										color="inherit"
										size="small"
										onClick={() => {
											dispatch(
												pushDialog({
													component: 'craftercms.components.WorkflowCancellationDialog',
													props: { item } as ViewPackagesDialogProps
												})
											);
										}}
									>
										Review
									</Button>
								}
							>
								<AlertTitle>
									<FormattedMessage defaultMessage="Publish Cancellation Warning" />
								</AlertTitle>
								<FormattedMessage defaultMessage="The item is part of a publishing package. Editing it will cancel the entire package." />
							</Alert>
						)}
						{lockStatus.lockError && (
							<Alert severity="error">
								{createErrorStatePropsFromApiResponse(lockStatus.lockError, formatMessage).message}
							</Alert>
						)}
						{fieldsToRender ? (
							// Renders the specified set of fields only
							<Paper sx={{ p: 2 }}>
								{fieldsToRender.map((field, index) =>
									renderFieldControl(field, stableFormContext.atoms.valueByFieldId, index === 0, readonly, contentType)
								)}
							</Paper>
						) : (
							// Renders the full form, all sections
							contentTypeSections.map((section, sectionIndex) => (
								<SectionAccordion
									key={sectionIndex}
									section={section}
									renderControl={(fieldId, fieldIndex) =>
										renderFieldControl(
											contentTypeFields[fieldId],
											stableFormContext.atoms.valueByFieldId,
											sectionIndex === 0 && fieldIndex === 0,
											readonly,
											contentType
										)
									}
								/>
							))
						)}
						{/* Spacer & back to top */}
						<Box minHeight={100} justifyContent="center" alignItems="center" display="flex">
							<Tooltip title={<FormattedMessage defaultMessage="Back to top" />}>
								<Fab onClick={() => containerRef.current.scroll({ top: 0, behavior: 'smooth' })}>
									<ArrowUpward />
								</Fab>
							</Tooltip>
						</Box>
					</Grid>
					<Grid size="grow">
						<StickyBox className="space-y">
							{readonly ? (
								<>
									<Alert severity="info" variant="outlined" icon={<EditOffOutlined />}>
										<FormattedMessage defaultMessage="Readonly mode" />
									</Alert>
									<SecondaryButton
										fullWidth
										variant="outlined"
										onClick={() => updateEditEnablement(true)}
										loading={enablingEditInProgress}
									>
										<FormattedMessage defaultMessage="Edit" />
									</SecondaryButton>
								</>
							) : (
								<>
									<SaveCard
										isEmbedded={isEmbedded}
										isStackedForm={isStackedForm}
										isRepeatMode={isRepeatMode}
										onSave={() => saveFn()}
									/>
									{!isCreateMode && // There's no locking on create mode
										(!isRepeatMode || (isRepeatMode && repeat.values)) && // No point in the "unlock" button for new repeat items
										!(isEmbedded && isStackedForm) && ( // For embedded components, only allow releasing the lock if it's the top form.
											<SecondaryButton
												fullWidth
												variant="outlined"
												onClick={() => updateEditEnablement(false)}
												loading={enablingEditInProgress}
											>
												<FormattedMessage defaultMessage="Release Lock" />
											</SecondaryButton>
										)}
								</>
							)}
							{handleClose && (
								<Button fullWidth variant="outlined" disabled={enablingEditInProgress} onClick={handleClose}>
									<FormattedMessage defaultMessage="Close" />
								</Button>
							)}
						</StickyBox>
					</Grid>
				</>
			}
		>
			{/* region Stacked Form Drawer */}
			{stackIndex === 0 && (
				<Drawer
					open={hasStackedForms}
					anchor="right"
					variant="temporary"
					disablePortal
					data-area-id="stackedFormDrawer"
					onClose={handleCloseDrawerForm}
					// Autofocus combined with absolute positioning (as opposed to the default fixed) causes the
					// scroll position to jump off the page (where the drawer panel is shown at) and looks like it
					// is the background element the one that's moving/animating in a jittery fashion.
					disableAutoFocus={disableStackedFormDrawerAutoFocus}
					onTransitionExited={() => {
						setDisableStackedFormDrawerAutoFocus(true);
					}}
					onTransitionEnd={
						// onTransitionEnd keeps triggering after the Drawer transition has finished on certain interactions (e.g. when hovering buttons)
						// This callback is also invoked during other transitions other than the Drawer's open transition.
						disableStackedFormDrawerAutoFocus
							? (e) => {
									// Make sure it is the drawer paper that finished transitioning before considering the transition complete.
									if ((e.target as HTMLElement).getAttribute('data-area-id') !== 'stackedFormDrawerPaper') return;
									const paper = containerRef.current.querySelector(
										`[data-area-id="stackedFormDrawer"] .${drawerClasses.paper}`
									) as HTMLDivElement;
									// TODO: Could paper ever be null here?
									// Check that the focus was moved inside the paper by the autoFocus prop in the control.
									// If focus is not on the paper, move it to it.
									if (!paper.contains(document.activeElement)) {
										paper.focus();
									}
									setDisableStackedFormDrawerAutoFocus(false);
								}
							: undefined
					}
					sx={{
						top: 'var(--scroll-top)',
						position: 'absolute',
						[`& > .${paperClasses.root}`]: {
							top: 0,
							width: 'calc(var(--container-width) - 100px)',
							height: isDialog ? `var(--container-height)` : '100vh',
							position: 'absolute'
						}
					}}
					PaperProps={{ 'data-area-id': 'stackedFormDrawerPaper' }}
				>
					{hasStackedForms && (
						<Prepper
							key={stackedFormKey}
							stackIndex={formsStackData.length - 1}
							{...currentStackedFormProps}
							stackTransitionEnded={!disableStackedFormDrawerAutoFocus}
							isDialog={isDialog}
							onClose={handleCloseDrawerForm}
						/>
					)}
				</Drawer>
			)}
			{/* endregion */}
			{/* region ToC Drawer */}
			<Drawer
				open={openDrawerSidebar}
				variant="temporary"
				disablePortal
				// The transitionDuration is set to 0 for when closing so it doesn't impede the scrollIntoView
				// in case a section/field was clicked. Ideally, the transition would still occur in the case of
				// closing the drawer without a section/field clicked (i.e. escape key or backdrop click), but
				// that would require an additional piece of state, so leaving like this for now.
				transitionDuration={openDrawerSidebar ? undefined : 0}
				onClose={handleCloseDrawerSidebar}
				sx={{
					position: 'absolute',
					[`& > .${paperClasses.root}`]: {
						p: 2,
						top: 'var(--scroll-top)',
						width: 300,
						height: isDialog ? `var(--container-height)` : '100vh',
						position: 'absolute'
					}
				}}
			>
				{tableOfContents}
			</Drawer>
			{/* endregion */}
		</FormLayout>
	);

	return (
		// The Fade provides some transitioning for the stacked forms that show without the Slide
		// transition since the Drawer is already open and there's only one.
		isStackedForm ? <Fade in={stackTransitionEnded} mountOnEnter children={bodyFragment} /> : bodyFragment
	);
}

export default Root;

// TODO:
//  - Russ: "Some people push the save button just to have the modified date changed"
//  - Implement the various constraints/validation checks
//  - PathNav and other ares to open new edit form
//  - Edit template & controller
//  - Update Audience Targeting panel to use new form engine controls
//  - Store collapsed ToC state & add to preference manager
//  - AI
//  - Field diff & rollback
//  - Edit template on form
//  - View/edit content type?
//  - Enabling editing (from read only to edit mode) for embedded components considering deeper nesting that 1 too
//  - AI to summarise changes for the save comment
//  - Control guidelines: autoFocus
//  - API to retrieve inherited props from an item that doesn't yet exist (is being created)
//  - Rollback confirm with diff
//  - Docs notes:
//    - Controls should manage autoFocus; make sure their internal controls reacts to changes in autoFocus or use effect to focus programmatically
//    - Should test controls in a root form and in a nested form
//  - Settings:
//     - Enable tabbing through control menu button
//     - Permanently hide ToC (though also controlled by the tab bar button)
//     - Colour blind mode:
//        - required field indicators to show check instead of asterisk when valid
//     - Flush control cache?
//     - Close after saving & options
//     - Whether to open node selector items in edit if the main item area (instead of edit button) is clicked
