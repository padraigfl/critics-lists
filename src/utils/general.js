import { TV } from "./constants";

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

export const hasNestedValue = (obj, key) => {
  let soughtValue = obj[1];
  key.split('.').forEach(k => {
    if (typeof soughtValue !== 'undefined') {
      soughtValue = soughtValue[k];
    }
  });
  return typeof soughtValue !== 'undefined';
}

export const objectEntriesSort = (key) => {
  const getComparisonValue = getValueFromObject(key);
  return ([,a], [,b]) => {
    const valA = getComparisonValue(a);
    const valB = getComparisonValue(b);
    const aUndefined = typeof valA === 'undefined';
    const bUndefined = typeof valB === 'undefined';
    const diff = valA - valB;
    if (aUndefined && bUndefined) {
      return -1;
    }
    if (aUndefined || valA < valB || (!Number.isNaN(diff) && diff < 0)) {
      return 1;
    }
    if (bUndefined || valB < valA || (!Number.isNaN(diff) && diff > 0)) {
      return -1;
    }
    // if (aUndefined || valA - valB < 0 || valA < valB) {
    //   return 1;
    // }
    // if (bUndefined || valB - valA < 0 || valA > valB)  {
    //   return -1;
    // }
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
        listYear: year,
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
  let tempList = getLocalStorageList(role, format, year);
  if (tempList.includes(key)) {
    setLocalStorageList(role, format, year)(tempList.filter(v => v !== key));
  } else {
    setLocalStorageList(role, format, year)([...tempList, key]);
  }
}

// scrape the correct routes to generate links
export const getJustWatchLocations = () => (
  [...document.querySelectorAll('.countries-list__region li a')].reduce((acc, el) => {
    return {
      ...acc,
      [el.href.replace('https://www.justwatch.com/', '')]: el.innerText.trim(),
    };
  }, {})
);

export const getJustWatchLink = (title, location, type, year) => {
  return `https://justwatch.com/${location}/search?q=${title}&content_type=${type === TV ? 'show' : 'movie'}`;
}