import { writable } from 'svelte/store';
import { SCORING_MATRICES } from './analytics';
import { FILM, ALBUM, TV, GENRE, LANGUAGE, COUNTRY } from './utils/constants';

// default filters to fall back onto
const defaultFilters = {
  [FILM]: {
    [GENRE]: [],
    [LANGUAGE]: [],
    [COUNTRY]: [],
  },
};

export const films = writable({});
export const albums = writable({});
export const tv = writable({});

// active format (selected from navbar)
export const format = writable('Format');
// active year (selected from navbar)
export const year = writable('Year');

// expanded data for media
export const mediaData = writable({});

// very generic all app loading handler
export const loadingPage = writable(true);

// filter options, will be populated upon data retrieval
export const filterOptions = writable({
  [FILM]: {
    [GENRE]: defaultFilters[FILM][GENRE],
    [LANGUAGE]: defaultFilters[FILM][LANGUAGE],
    [COUNTRY]: defaultFilters[FILM][COUNTRY],
  },
  [TV]: {
    [GENRE]: defaultFilters[FILM][GENRE],
    [LANGUAGE]: defaultFilters[FILM][LANGUAGE],
    [COUNTRY]: defaultFilters[FILM][COUNTRY],
  },
  [ALBUM]: {
    [GENRE]: defaultFilters[FILM][GENRE],
  }
});

// controls the current means of allocating points
export const scoringMatrix = writable(SCORING_MATRICES.default);

// controls how entries are filters (@TODO: optimise across formats)
export const filterSelections = writable({});

// ordering of entries, could potentially persist across formats if shared type??
export const ordering = writable({ key: 'score' });

// toggle for including entries you've flagged with one of the icons
export const viewKnown = writable(true);
export const viewUninterested = writable(true);
export const viewInterested = writable(true);
export const viewSingleEntries = writable(true);