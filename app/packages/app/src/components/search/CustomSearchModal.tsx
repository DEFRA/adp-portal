import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import { SidebarItem, useContent } from '@backstage/core-components';
import {
  SearchModal,
  SearchModalProvider,
  searchPlugin,
  useSearchModal,
} from '@backstage/plugin-search';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
  makeStyles,
  useTheme,
} from '@material-ui/core';
import {
  SearchBar,
  SearchResult,
  SearchResultPager,
} from '@backstage/plugin-search-react';
import { useRouteRef } from '@backstage/core-plugin-api';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  dialogTitle: {
    gap: theme.spacing(1),
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '1fr auto',
    '&> button': {
      marginTop: theme.spacing(1),
    },
  },
  input: {
    flex: 1,
  },
  button: {
    '&:hover': {
      background: 'none',
    },
  },
  paperFullWidth: { height: 'calc(100% - 128px)' },
  dialogActionsContainer: { padding: theme.spacing(1, 3) },
  viewResultsLink: { verticalAlign: '0.5em' },
}));

const CustomSearchModalContent = () => {
  const { state, toggleModal } = useSearchModal();
  const classes = useStyles();
  const navigate = useNavigate();
  const { transitions } = useTheme();
  const { focusContent } = useContent();
  const rootRouteRef = searchPlugin.routes.root;
  const searchRootRoute = useRouteRef(rootRouteRef)();
  const searchBarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    searchBarRef.current?.focus();
  }, [searchBarRef]);

  const handleSearchResultClick = useCallback(() => {
    setTimeout(focusContent, transitions.duration.leavingScreen);
  }, [focusContent, transitions]);

  const handleSearchBarSubmit = useCallback(() => {
    const query = searchBarRef.current?.value ?? '';
    navigate(`${searchRootRoute}?query=${query}`);
    handleSearchResultClick();
  }, [navigate, handleSearchResultClick, searchRootRoute]);

  return (
    <>
      <SidebarItem
        className="search-icon"
        icon={SearchIcon}
        text="Search"
        aria-label="Search"
        onClick={toggleModal}
      />
      <SearchModal {...state} toggleModal={toggleModal}>
        {() => (
          <>
            <DialogTitle id="search-modal-title">
              <Typography variant="h4" component="div">
                ADP Search
              </Typography>
              <Box className={classes.dialogTitle}>
                <SearchBar
                  aria-label="search bar"
                  className={classes.input}
                  inputProps={{ ref: searchBarRef }}
                  onSubmit={handleSearchBarSubmit}
                />
                <IconButton aria-label="close" onClick={toggleModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid
                container
                direction="row-reverse"
                justifyContent="flex-start"
                alignItems="center"
              >
                <Grid item>
                <Button
                  className={classes.button}
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleSearchBarSubmit}
                  disableRipple
                >
                  View Full Results
                </Button>
                </Grid>
              </Grid>
              <Divider />
              <SearchResult
                onClick={handleSearchResultClick}
                onKeyDown={handleSearchResultClick}
                aria-labelledby="search result"
              />
            </DialogContent>
            <DialogActions className={classes.dialogActionsContainer}>
              <Grid container direction="row">
                <Grid item xs={12}>
                  <SearchResultPager />
                </Grid>
              </Grid>
            </DialogActions>
          </>
        )}
      </SearchModal>
    </>
  );
};

export const CustomSearchModal = () => {
  return (
    <SearchModalProvider>
      <CustomSearchModalContent />
    </SearchModalProvider>
  );
};
