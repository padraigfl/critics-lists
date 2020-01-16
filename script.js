const getCriticsName = (critics, publicationName, criticDataRow) => {
  let criticName = criticDataRow.innerText.split('View full list')[0];
  if (critics[criticName]) {
    criticName = `${criticName}-${publicationName}`;
  }
  return criticName;
};

const addOneToScore = (val) => val ? val + 1 : 1;

const defaultScoringMatrix = {
  1: 10,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
  'unranked': 0.5,
};

const addMetricToScore = (val, rank, scoringMatrix) => {
  const score = scoringMatrix[rank];
  return val ? val + score : score;
}

const getUnrankedListValue = (list, scoringMatrix) => {
  const rankedCount = Object.values(list).filter(v => typeof v === 'number').length;
  const unrankedCount = Object.values(list).length - rankedCount;
  const totalMatrixScorePoints = Object.entries(scoringMatrix).reduce(
    (acc, [rank, score]) => {
      if (typeof rank === 'number') {
        return acc + score;
      }
      return acc;
    }, 0
  );
  return (totalMatrixScorePoints / Object.values(list)) * unrankedCount;
}

const formatListData = (listEntryEls, films) => {
  const data = {
    list: {},
  };
  [...listEntryEls].forEach((entry) => {
    if (entry.querySelector('em')) {
      data.note = entry.querySelector('em').innerText;
      return;
    }
    const rankingEntry = +entry.getAttribute('value') || 'unranked';
    if (entry.innerText.includes('(tie)')) {
      entry.innerText.replace('(tie)', '').trim().split(' -AND- ').forEach((v) => {
        data.list[v] = rankingEntry;
        films[v] = addOneToScore(films[v]);
      });
      return;
    }
    data.list[entry.innerText] = rankingEntry;
    films[entry.innerText] = addOneToScore(films[entry.innerText]);
  });
  return data;
}

const getData = () => {
  const critics = {};
  const publications = {};
  const films = {};
  
  const publicationsEl = document.getElementsByClassName('listtable');

  for (let i = 1; i < publicationsEl.length; i++) {
    const publicationName = publicationsEl[i].querySelector('caption').innerText;
    publications[publicationName] = {
      name: publicationName,
      writers: [],
    };
    const dataRows = publicationsEl[i].querySelectorAll('tbody tr');
    for (let j = 0; j < dataRows.length; j+=2) {
      const criticName = getCriticsName(critics, publicationName, dataRows[j]);
      publications[publicationName].writers.push(criticName);
      critics[criticName] = {
        link: dataRows[j].querySelector('a') ? dataRows[j].querySelector('a').href : undefined,
        publicationName: publicationName,
        ...formatListData(dataRows[j+1].querySelectorAll('td li'), films)
      };
    }
  }
  return { critics, films, publications };
}

window.getData = getData;