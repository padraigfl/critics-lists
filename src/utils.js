export const getIdFromName = name =>
  '_' +
  name
  .split(/\s|,/)
  .join('_')
  .replace(/[\[\]()]/g, '');

export const getValueFromObject = (key = 'score') => val => {
  let soughtValue = val;
  key.split('.').forEach(key => {
    if (typeof soughtValue !== 'undefined') {
      soughtValue = soughtValue[key];
    }
  });
  return soughtValue;
}

export const objectEntriesSort = (key) => {
  const getComparisonValue = getValueFromObject(key);
  return ([,a], [,b]) => {
    const valA = getComparisonValue(a);
    const valB = getComparisonValue(b);
    const aUndefined = typeof valA === 'undefined';
    const bUndefined = typeof valB === 'undefined';
    if (aUndefined && bUndefined) {
      return 0;
    }
    if (aUndefined || valA - valB < 0) {
      return 1;
    }
    if (bUndefined || valB - valA < 0)  {
      return -1;
    }
    return 0;
  };
}
