import { writable } from 'svelte/store';
import { SCORING_MATRICES } from './analytics';

export const films = writable({

});

export const albums = writable({

});

export const tv = writable({

});

export const format = writable('Format');
export const year = writable('Year');
export const filmData = writable({});

export const loadingPage = writable(true);

export const scoringMatrix = writable(SCORING_MATRICES.default);

export const filterOptions = writable({
  film: {
    genre: [],
    language: [],
    country: [],
  },
});

export const filterSelections = writable({});

export const ordering = writable('score');

export const viewUninterested = writable(true);
export const viewKnown = writable(true);
export const viewInterested = writable(true);

export const OPTIONS = {
  years: ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'],
  formats: ['film', 'album', 'tv'],
};

export const SOURCE = {
  film: {
    '2010': 'https://www.metacritic.com/feature/film-critic-top-ten-lists',
    '2011': 'https://www.metacritic.com/feature/movie-critic-best-of-2011-top-ten-lists',
    '2012': 'https://www.metacritic.com/feature/top-ten-lists-best-movies-of-2012',
    '2013': 'https://www.metacritic.com/feature/film-critic-top-10-lists-best-movies-of-2013',
    '2014': 'https://www.metacritic.com/feature/film-critic-top-10-lists-best-movies-of-2014',
    '2015': 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2015',
    '2016': 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2016',
    '2017': 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2017',
    '2018': 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2018',
    '2019': 'https://www.metacritic.com/feature/critics-pick-top-10-best-movies-of-2019',
    '2010s': 'https://www.metacritic.com/feature/best-albums-of-the-decade-2010s',
  },
  tv: {
    '2010': 'https://www.metacritic.com/feature/tv-critics-pick-ten-best-tv-shows-of-2010',
    '2011': 'https://www.metacritic.com/feature/tv-critic-top-10-best-shows-of-2011',
    '2012': 'https://www.metacritic.com/feature/top-ten-lists-best-tv-shows-of-2012',
    '2013': 'https://www.metacritic.com/feature/tv-critics-pick-best-television-shows-of-2013',
    '2014': 'https://www.metacritic.com/feature/tv-critics-pick-10-best-tv-shows-of-2014',
    '2015': 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2015',
    '2016': 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2016',
    '2017': 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2017',
    '2018': 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2018',
    '2019': 'https://www.metacritic.com/feature/critics-pick-top-10-best-tv-shows-of-2019',
    '2010s': 'https://www.metacritic.com/feature/best-tv-shows-of-the-decade-2010s',
  },
  album: {
    '2010': 'https://www.metacritic.com/feature/music-critic-top-ten-lists-best-of-2010',
    '2011': 'https://www.metacritic.com/feature/music-critic-top-ten-lists-best-albums-of-2011',
    '2012': 'https://www.metacritic.com/feature/top-ten-lists-best-albums-of-2012',
    '2013': 'https://www.metacritic.com/feature/critics-pick-top-ten-albums-of-2013',
    '2014': 'https://www.metacritic.com/feature/critics-pick-top-10-albums-of-2014',
    '2015': 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2015',
    '2016': 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2016',
    '2017': 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2017',
    '2018': 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2018',
    '2019': 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2019',
    '2010s': 'https://www.metacritic.com/feature/best-movies-of-the-decade-2010s',
  },
}