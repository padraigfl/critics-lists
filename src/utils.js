export const getIdFromName = name =>
  name
  .split(/\s|,/)
  .join('_')
  .replace(/[\[\]()]/g, '');