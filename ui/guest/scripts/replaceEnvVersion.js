/*
 * Copyright (C) 2007-2023 Crafter Software Corporation. All Rights Reserved.
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

const pkg = require('../package.json');
const path = require('path');
const packagePath = process.cwd();
const buildPath = path.join(packagePath, './build_tsc');

const replace = require('replace-in-file');
const options = {
	files: `${buildPath}/**/*.js`,
	from: 'process.env.VERSION',
	to: `'${pkg.version}'`
};

replace(options).then(() => {});
