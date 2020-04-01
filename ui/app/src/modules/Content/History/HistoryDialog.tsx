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

import React, { useCallback, useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogHeader from '../../../components/DialogHeader';
import { defineMessages, FormattedDateParts, FormattedMessage, FormattedTime, useIntl } from 'react-intl';
import DialogBody from '../../../components/DialogBody';
import { getItemVersions } from '../../../services/content';
import { LegacyItem } from '../../../../../guest/src/models/Item';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import Chip from '@material-ui/core/Chip';
import { LegacyVersion } from '../../../../../guest/src/models/version';
import makeStyles from '@material-ui/styles/makeStyles';
import { Theme } from '@material-ui/core';
import createStyles from '@material-ui/styles/createStyles';
import { palette } from '../../../styles/theme';
import MoreVertIcon from '@material-ui/icons/MoreVertRounded';
import { useSpreadState, useStateResource } from '../../../utils/hooks';
import ContextMenu, { SectionItem } from '../../../components/ContextMenu';
import DialogFooter from '../../../components/DialogFooter';
import TablePagination from '@material-ui/core/TablePagination';
import { APIError } from '../../../models/GlobalState';
import { Resource } from '../../../models/Resource';
import { Suspencified } from '../../../components/SystemStatus/Suspencified';


const translations = defineMessages({
  headerTitle: {
    id: 'historyDialog.headerTitle',
    defaultMessage: 'Content Item History'
  },
  current: {
    id: 'historyDialog.current',
    defaultMessage: 'current'
  },
  test: {
    id: 'historyDialog.test',
    defaultMessage: 'test'
  },
  previousPage: {
    id: 'pagination.previousPage',
    defaultMessage: 'previous page'
  },
  nextPage: {
    id: 'pagination.nextPage',
    defaultMessage: 'next page'
  }
});

const versionListStyles = makeStyles((theme: Theme) => createStyles({
  list: {
    backgroundColor: palette.white,
    padding: 0,
    borderRadius: '5px 5px 0 0',
    overflowY: 'auto'
  },
  listItem: {
    padding: ' 15px 20px'
  },
  listItemTextMultiline: {
    margin: 0
  },
  listItemTextPrimary: {
    display: 'flex',
    alignItems: 'center'
  },
  chip: {
    padding: '1px',
    backgroundColor: palette.green.main,
    height: 'auto',
    color: palette.white,
    marginLeft: '10px'
  },
  pagination: {
    marginLeft: 'auto',
    position: 'fixed',
    zIndex: 1,
    bottom: 0,
    background: 'white',
    color: 'black',
    //width: `calc(${DRAWER_WIDTH}px - 1px)`,
    left: 0,
    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
    '& p': {
      padding: 0
    },
    '& svg': {
      top: 'inherit'
    },
    '& .hidden': {
      display: 'none'
    }
  },
  toolbar: {
    padding: 0,
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: '20px',
    '& .MuiTablePagination-spacer': {
      display: 'none'
    },
    '& .MuiTablePagination-spacer + p': {
      display: 'none'
    }
  }
}));

const historyStyles = makeStyles((theme: Theme) => createStyles({
  dialogFooter: {
    padding: 0
  },
  pagination: {
    marginLeft: 'auto',
    background: 'white',
    color: 'black',
    '& p': {
      padding: 0
    },
    '& svg': {
      top: 'inherit'
    },
    '& .hidden': {
      display: 'none'
    }
  },
  toolbar: {
    padding: 0,
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: '20px',
    '& .MuiTablePagination-spacer': {
      display: 'none'
    },
    '& .MuiTablePagination-spacer + p': {
      display: 'none'
    }
  }
}));

function FancyFormattedDate(props) {
  const ordinals = 'selectordinal, one {#st} two {#nd} few {#rd} other {#th}';
  return (
    <FormattedDateParts
      value={props.date}
      month="long"
      day="numeric"
      weekday="long"
      year="numeric"
    >
      {
        parts =>
          <>
            {`${parts[0].value} ${parts[2].value} `}
            <FormattedMessage
              id="historyDialog.ordinals"
              defaultMessage={`{day, ${ordinals}}`}
              values={{ day: parts[4].value }}
            /> {parts[6].value} @ <FormattedTime value={props.date}/>
          </>
      }
    </FormattedDateParts>
  )
}

interface VersionsListProps {
  resource: Resource<LegacyVersion[]>;
  onOpenMenu(anchorEl: Element, version: LegacyVersion): void;
}

function VersionsList(props: VersionsListProps) {
  const { formatMessage } = useIntl();
  const classes = versionListStyles({});
  const { resource, onOpenMenu } = props;
  const versions = resource.read();
  return (
    <List component="div" className={classes.list} disablePadding>
      {
        versions.map((version: LegacyVersion, i: number) =>
          <ListItem key={version.versionNumber} divider={versions.length - 1 !== i} className={classes.listItem}>
            <ListItemText
              classes={{ multiline: classes.listItemTextMultiline, primary: classes.listItemTextPrimary }}
              primary={
                <>
                  <FancyFormattedDate date={version.lastModifiedDate}/>
                  {
                    (i === 0) &&
                    <Chip label={formatMessage(translations.current)} className={classes.chip}/>
                  }
                </>
              }
              secondary={version.comment}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={(e) => onOpenMenu(e.currentTarget, version)}>
                <MoreVertIcon/>
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        )
      }
    </List>
  )
}

const menuSection = [
  [
    {
      id: 'test',
      label: translations.test
    }
  ]
];

export default function HistoryDialog(props) {
  const {
    open = true,
    handleClose = () => {
    },
    site = 'editorial',
    path = '/site/website/index.xml'
  } = props;
  const { formatMessage } = useIntl();
  const classes = historyStyles({});

  const [menu, setMenu] = useSpreadState({
    anchorEl: null,
    activeVersion: null
  });

  const [pagination, setPagination] = useSpreadState({
    limit: null,
    offset: null
  });

  const [data, setData] = useState<{ contentItem: LegacyItem, versions: LegacyVersion[] }>({
    contentItem: null,
    versions: null
  });

  const [error, setError] = useState<APIError>(null);

  const resource = useStateResource<LegacyVersion[], { contentItem: LegacyItem, versions: LegacyVersion[] }>(
    data,
    {
      shouldResolve: (data) => Boolean(data.versions),
      shouldReject: () => Boolean(error),
      shouldRenew: () => false,
      resultSelector: () => data.versions,
      errorSelector: () => error
    }
  );

  useEffect(() => {
    getItemVersions(site, path).subscribe(
      (response) => {
        setTimeout(() => {
          setData({ contentItem: response.item, versions: response.versions });
        }, 3000)
      },
      (response) => {
        setError(response);
      }
    )
  }, [site, path]);

  const handleOpenMenu = useCallback((anchorEl, version) => {
    setMenu({
      anchorEl,
      activeVersion: version
    })
  }, [setMenu]);

  const handleMenuClose = () => {
    setMenu({
      anchorEl: null,
      activeVersion: null
    })
  };

  const handleMenuItemClicked = (section: SectionItem) => {
    console.log(section)
  };

  const onPageChanged = (e, next: number) => {

  }

  return (
    <>
      <Dialog
        onClose={handleClose}
        open={open}
        fullWidth
        maxWidth="md"
      >
        <DialogHeader title={formatMessage(translations.headerTitle)} onClose={handleClose}/>
        <DialogBody>
          <Suspencified resource={resource} component={VersionsList} componentProps={{ onOpenMenu: handleOpenMenu }}/>
        </DialogBody>
        {
          data.versions &&
          <DialogFooter className={classes.dialogFooter}>
            <TablePagination
              className={classes.pagination}
              classes={{ root: classes.pagination, selectRoot: 'hidden', toolbar: classes.toolbar }}
              component="div"
              labelRowsPerPage=""
              count={0}
              rowsPerPage={20}
              page={1}
              backIconButtonProps={{
                'aria-label': formatMessage(translations.previousPage)
              }}
              nextIconButtonProps={{
                'aria-label': formatMessage(translations.nextPage)
              }}
              onChangePage={(e: React.MouseEvent<HTMLButtonElement>, page: number) => onPageChanged(e, page * 20)}
            />
          </DialogFooter>
        }
        <ContextMenu
          open={!!menu.anchorEl}
          anchorEl={menu.anchorEl}
          onClose={handleMenuClose}
          sections={menuSection}
          onMenuItemClicked={handleMenuItemClicked}
        />
      </Dialog>
    </>
  )
}

