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

const formatListName = (role, format, year) => [role, format, year].join('_');

export const customLists = ['interested', 'know', 'uninterested'];

export const getLocalStorageList = (role, format, year) => {
  return JSON.parse(window.localStorage.getItem(formatListName(role, format, year)))
    || ( role === 'interested' ?  {} : []);
}

export const setLocalStorageList = (role, format, year) => (value) => {
  return window.localStorage.setItem(formatListName(role, format, year), JSON.stringify(value));
}

const updateInterestedList = (format, year, listData = [], yearData = {}) => (e) => {
  const key = e.target.value;
  const oldList = getLocalStorageList('interested', format, year);
  if (oldList[key]) {
    delete oldList[key];
  } else {
    const val = listData.find(([id]) => id === key);
    if (val) {
      oldList[key] = {
        ...val[1],
        ...yearData.works[key],
      };
    }
  }
  setLocalStorageList(`interested`, format, year)(oldList);
}

export const generateListUpdater = (role, format, year, listData, yearData) => (e) => {
  if (role === 'interested') {
    return updateInterestedList(format, year, listData, yearData)(e);
  }
  const key = e.target.value;
  let tempList = getLocalStorageList(formatListName(role, format, year));
  if (tempList.includes(key)) {
    setLocalStorageList(list, tempList.filter(v => v !== key));
  } else {
    setLocalStorageList(role, format, year)([...tempList, key]);
  }
}
