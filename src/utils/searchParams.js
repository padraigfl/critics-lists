import { FILM, ALBUM, TV, ALL } from './constants';

const paramPrefixes = {
  [FILM]: 'F',
  [ALBUM]: 'M',
  [TV]: 'T',
  [ALL]: 'A',
};

export const getInitialParam = (type, key, isArray) => {
  const searchParam = new URLSearchParams(window.locations.search.substring(1)).get(`${paramPrefixes[type]}:f:${key}`);
  if (!searchParam) {
    return null;
  }
  if (isArray) {
    return searchParam.split(',');
  }
  return searchParam;
}

export const setParams = (
  type,
  { filters, ...otherParams },
) => {
  let newParams = new URLSearchParams();
  Object.entries(filters)
    .forEach(([key, value]) => {
      newParams.set(`${paramPrefixes[type]}:f:${key}`, Array.isArray(value) ? value.join(',') : value);
    });
  Object.entries(otherParams)
    .forEach(([key, value]) => {
      newParams.set(`${paramPrefixes[ALL]}:f:${key}`, Array.isArray(value) ? value.join(',') : value);
    });
  window.location.search = `?${newParams.toString()}`;
};
