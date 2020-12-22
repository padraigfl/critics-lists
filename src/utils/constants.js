// constant values to avoid typos
export const FILM = 'film';
export const ALBUM = 'album';
export const TV = 'tv';
export const ALL = 'all';
export const GENRE = 'genre';
export const LANGUAGE = 'language';
export const COUNTRY = 'country';
export const YEARS = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2010s'];

export const FORMATS = [FILM, ALBUM, TV];

export const OPTIONS = {
  years: YEARS,
  formats: FORMATS,
};

export const SOURCE = {
  [FILM]: {
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
    '2020': 'https://www.metacritic.com/feature/film-critics-pick-10-best-movies-of-2020',
    '2010s': 'https://www.metacritic.com/feature/best-albums-of-the-decade-2010s',
  },
  [TV]: {
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
    '2020': 'https://www.metacritic.com/feature/tv-critics-pick-10-best-tv-shows-of-2020',
    '2010s': 'https://www.metacritic.com/feature/best-tv-shows-of-the-decade-2010s',
  },
  [ALBUM]: {
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
    '2020': 'https://www.metacritic.com/feature/music-critics-pick-top-10-best-albums-of-2020',
    '2010s': 'https://www.metacritic.com/feature/best-movies-of-the-decade-2010s',
  },
};
