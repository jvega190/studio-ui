/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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

import { LookupTable } from '../../models/LookupTable';
import { ContentTypeField } from '../../models/ContentType';

export const contentTypePropsMap = {
  fileName: 'file-name',
  internalName: 'internal-name',
  localeCode: 'locale-code'
};

export function getContentModelSnippets(
  contentModel: { label: string; value: string },
  fields: LookupTable<ContentTypeField>
): { label: string; value: string }[] {
  return Object.keys(fields).map((key) => ({
    label: fields[key].name,
    value: contentModel.value.replace(
      'VARIABLE_NAME',
      contentTypePropsMap[fields[key].id] ? `"${contentTypePropsMap[fields[key].id]}"` : fields[key].id
    )
  }));
}