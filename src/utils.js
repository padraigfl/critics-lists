export const getIdFromName = name =>
  name
  .split(' ')
  .join('_')
  .replace(/[\[\]()]/g, '');