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

CStudioAdminConsole.Tool.ContentTypes =
	CStudioAdminConsole.Tool.ContentTypes ||
	function (config, el) {
		return this;
	};

YAHOO.extend(CStudioAdminConsole.Tool.ContentTypes, CStudioAdminConsole.Tool, {
	renderWorkarea: function () {
		var a = "<div id='content-type-canvas'>" + '' + '</div>' + "<div id='content-type-tools'>" + '' + '</div>';

		var actions = [];
		CStudioAuthoring.ContextualNav.AdminConsoleNav.initActions(actions);
	}
});

CStudioAuthoring.Module.moduleLoaded('cstudio-console-tools-content-types', CStudioAdminConsole.Tool.ContentTypes);
