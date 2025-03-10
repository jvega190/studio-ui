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

var YDom = YAHOO.util.Dom;
var YEvent = YAHOO.util.Event;

CStudioAuthoring.Dialogs = CStudioAuthoring.Dialogs || {};

/**
 * Submit to go live
 */
CStudioAuthoring.Dialogs.UploadWebDAVDialog = CStudioAuthoring.Dialogs.UploadWebDAVDialog || {
	formatMessage: CrafterCMSNext.i18n.intl.formatMessage,
	messages: CrafterCMSNext.i18n.messages.words,

	/**
	 * initialize module
	 */
	initialize: function (config) {},

	/**
	 * show dialog
	 */
	showDialog: function (site, path, profileId, serviceUri, callback, fileTypes) {
		this._self = this;

		this.site = site;
		this.path = path;
		this.profile = profileId;
		this.asPopup = true;
		this.serviceUri = serviceUri;
		this.callback = callback;
		this.fileTypes = fileTypes;
		this.uploadingFile = false;
		this.dialog = this.createDialog(path, site, profileId, serviceUri);
		this.dialog.show();
		document.getElementById('cstudio-wcm-popup-div_h').style.display = 'none';

		if (window.frameElement) {
			var id = window.frameElement.getAttribute('id').split('-editor-')[1];
			var getFormSizeVal = typeof getFormSize === 'function' ? getFormSize : parent.getFormSize;
			var setFormSizeVal = typeof setFormSize === 'function' ? setFormSize : parent.setFormSize;
			var formSize = getFormSizeVal(id);
			if (formSize < 320) {
				setFormSizeVal(320, id);
				$($('.studio-ice-container-' + id, parent.document)[0]).attr('data-decrease', true);
			}
		}
	},

	/**
	 * hide dialog
	 */
	closeDialog: function () {
		this.dialog.destroy();
	},

	/**
	 * create dialog
	 */
	createDialog: function (path, site, profileId, serviceUri) {
		var me = this;
		YDom.removeClass('cstudio-wcm-popup-div', 'yui-pe-content');

		var newdiv = YDom.get('cstudio-wcm-popup-div');
		if (newdiv == undefined) {
			newdiv = document.createElement('div');
			document.body.appendChild(newdiv);
		}

		var divIdName = 'cstudio-wcm-popup-div';
		newdiv.setAttribute('id', divIdName);
		newdiv.className = 'yui-pe-content';
		newdiv.innerHTML =
			'<div class="contentTypePopupInner" id="upload-popup-inner">' +
			'<div class="contentTypePopupContent" id="contentTypePopupContent"> ' +
			'<div class="contentTypePopupHeader">Upload</div> ' +
			'<div><form id="asset_upload_form">' +
			'<div class="contentTypeOuter">' +
			'<div><table><tr><td><input type="hidden" name="siteId" value="' +
			site +
			'"/></td>' +
			'<td><input type="hidden" name="path" value="' +
			path +
			'"/></td></tr>' +
			'<td><input type="hidden" name="profileId" value="' +
			profileId +
			'"/></td></tr>' +
			'</table></div>' +
			'<div id="uploadContainer"></div>' +
			'</div>' +
			'<div class="contentTypePopupBtn"> ' +
			'<input type="button" class="btn btn-default cstudio-xform-button" id="uploadCancelButton" value="Cancel"  /></div>' +
			'</form></div>' +
			'</div> ' +
			'</div>';

		document.getElementById('upload-popup-inner').style.width = '350px';
		document.getElementById('upload-popup-inner').style.height = '180px';

		// Instantiate the Dialog
		upload_dialog = new YAHOO.widget.Dialog('cstudio-wcm-popup-div', {
			width: '410px',
			'min-height': '255px',
			effect: {
				effect: YAHOO.widget.ContainerEffect.FADE,
				duration: 0.25
			},
			fixedcenter: true,
			visible: false,
			modal: true,
			close: false,
			constraintoviewport: true,
			underlay: 'none'
		});

		// Render the Dialog
		upload_dialog.render();

		var eventParams = {
			self: this
		};

		YAHOO.util.Event.addListener('uploadCancelButton', 'click', this.uploadPopupCancel);

		$('body').on('keyup', '#cstudio-wcm-popup-div', function (e) {
			if (e.keyCode === 27 && !me.uploadingFile) {
				// esc
				me.closeDialog();
				$('#cstudio-wcm-popup-div').off('keyup');
			}
		});

		var url = CStudioAuthoring.Service.createServiceUri(serviceUri);
		url += '&' + CStudioAuthoringContext.xsrfParameterName + '=' + CrafterCMSNext.util.auth.getRequestForgeryToken();

		CrafterCMSNext.render(document.getElementById('uploadContainer'), 'SingleFileUpload', {
			formTarget: '#asset_upload_form',
			site: site,
			path: path,
			url: url,
			fileTypes: me.fileTypes,
			onUploadStart: function () {
				me.uploadingFile = true;
				$('#uploadCancelButton').attr('disabled', true);
			},
			onComplete: function ({ successful }) {
				let uploaded = JSON.parse(successful[0].response.body.response).item;

				$('#uploadCancelButton').attr('disabled', false);
				me.uploadingFile = false;

				me.callback.success(uploaded);
				CStudioAuthoring.Dialogs.UploadWebDAVDialog.closeDialog();
			},
			onError: function () {
				me.uploadingFile = false;
				$('#uploadCancelButton').attr('disabled', false);
			}
		});

		return upload_dialog;
	},

	/**
	 * event fired when the ok is pressed
	 */
	uploadPopupCancel: function (event) {
		CStudioAuthoring.Dialogs.UploadWebDAVDialog.closeDialog();
		if (window.frameElement) {
			var id = window.frameElement.getAttribute('id').split('-editor-')[1];
			if (
				$('#ice-body').length > 0 &&
				$($('.studio-ice-container-' + id, parent.document)[0]).height() > 212 &&
				$($('.studio-ice-container-' + id, parent.document)[0]).attr('data-decrease')
			) {
				$($('.studio-ice-container-' + id, parent.document)[0]).height(212);
			}
		}
	}
};

CStudioAuthoring.Module.moduleLoaded('upload-webdav-dialog', CStudioAuthoring.Dialogs.UploadWebDAVDialog);
