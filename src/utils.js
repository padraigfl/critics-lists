export const getIdFromName = name =>
  name
  .split(/\s|,/)
  .join('_')
  .replace(/[\[\]()]/g, '');

export const sortFunc = (key = 'score') => val => val[key];
