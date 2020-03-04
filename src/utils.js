export const getIdFromName = name =>
  name
  .split(/\s|,/)
  .join('_')
  .replace(/[\[\]()]/g, '');

export const getValueFromObject = (key = 'score') => val => {
  let soughtValue = val;
  key.split('.').forEach(key => {
    if (typeof soughtValue[key] !== 'undefined') {
      soughtValue = soughtValue[key];
    }
  });
  return soughtValue;
}

export const objectEntriesSort = (key) => {
  const getComparisonValue = getValueFromObject(key);
  return ([,a], [,b]) => (
    (getComparisonValue(b) || 0) - (getComparisonValue(a) ||0)
  );
}
