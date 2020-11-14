
export const SCORING_MATRICES = {
  default: {
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
    '_': 0.5,
    description: 'Strongly favours entries high in lists'
  },
  metacritic: {
    1: 3,
    2: 2,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
    '_': 0.5,
    description: 'Approximation of metacritic scoring system',
  },
  flat: {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
    '_': 1,
    description: '1 point regardless of ranking',
  },
  defaultInverted: {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    '_': 5,
    description: 'Inversion of default scoring system, priotises lower ranked entries.',
  },
  flatTop5: {
    1: 3,
    2: 2,
    3: 1,
    4: 1,
    5: 1,
    6: 0.1,
    7: 0.1,
    8: 0.1,
    9: 0.1,
    10: 0.1,
    '_': 0.1,
    description: '1 point for any 1-5, .1 point for other ratings',
  },
}

const addMetricToScore = (val, rank, scoringMatrix = SCORING_MATRICES.default) => {
  const score = scoringMatrix[rank];
  return val ? val + score : score;
}

const getUnrankedListValue = (list, scoringMatrix = SCORING_MATRICES.default) => {
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

const stringToNumber = val => (
  typeof val === 'string' ? +val.replace(/[^\d.]+/g, '') : undefined
);

const formatAwards = (awards = '') => {
  let count = {};
  if (awards === 'N/A') {
    return count;
  };
  let otherAwards = false;
  ['Oscar', 'Golden Globe', 'BAFTA Film Award', 'Primetime Emmy'].map((award) => {
    const hasMajorAward = awards.includes(award);
    if (hasMajorAward) {
      otherAwards = true;
      const oscars = awards.split(award)[0];
      if (oscars.includes('Won')) {
        count.wins = (count.wins || 0) + stringToNumber(oscars);
      } else {
        count.noms = (count.noms || 0) + stringToNumber(oscars);
      }
    }
  });
  (
    otherAwards ? 
      awards.split('. ')[1]
      : awards
  ).split(' & ').forEach(v => {
    if (v.toLowerCase().includes('win')) {
      count.wins = (count.wins || 0) + stringToNumber(v);
    } else if (v.toLowerCase().includes('omination')){
      count.noms =  (count.noms || 0) + stringToNumber(v);
    }
  })
  if (count.wins || count.noms) {
    count.combined = (count.wins || 0) + (count.noms || 0);
  }
  return count;
};


const formatOmdbData = (omdbData = {}) => {
  const imdb = {
    id: omdbData.imdbID || undefined,
    rating: stringToNumber(omdbData.imdbRating),
    votes: stringToNumber(omdbData.imdbVotes),
  };
  const rotten = (omdbData.Ratings || []).find(v => v.Source === 'Rotten Tomatoes');
  const metacritic = (omdbData.Ratings || []).find(v => v.Source === 'Metacritic');
  const boxOffice = omdbData.BoxOffice !== 'N/A' ? stringToNumber(omdbData.BoxOffice) : undefined;
  const awards = formatAwards(omdbData.Awards);

  return {
    imdb,
    awards,
    boxOffice,
    plot: omdbData.Plot,
    rating: omdbData.Rated,
    rotten: rotten ? stringToNumber(rotten.Value) : undefined,
    metacritic: metacritic ? parseInt(metacritic.Value) : undefined,
    poster: omdbData.Poster,
    language: omdbData.Language ? omdbData.Language.split(', ') : undefined,
    country: omdbData.Country ? omdbData.Country.split(', ') : undefined,
    release: new Date(omdbData.Released),
    runtime: stringToNumber(omdbData.Runtime),
    genre: omdbData.Genre ? omdbData.Genre.split(', ') : undefined,
    production: omdbData.Production,
    cast: omdbData.Actors ? omdbData.Actors.split(', ') : undefined,
    director: omdbData.Director,
  }
}

export const processListsWithRankings = (critics, omdbData, matrix = SCORING_MATRICES.default, orderFunc) => {
  const films = {};
  Object.values(critics).forEach(({ list }) => {
    matrix._ = matrix._ || getUnrankedListValue(list, matrix);
    Object.entries(list).forEach(([workName, ranking]) => {
      films[workName] = {
        score: addMetricToScore(films[workName] ? films[workName].score : undefined, ranking, matrix),
        ...formatOmdbData(omdbData[workName] || {}),
      };
    });
  });
  return Object.entries(films).sort(orderFunc || objectEntriesSort('score'));
}

const getHighestWithoutNumberOne = (processedList, data) =>
  (processedList.find(([v]) => data.works[v].firsts.length === 0) || [])[0];

const getLowestNumberOne = (processedList, data) =>
  ([...processedList].reverse().find(([v]) => data.works[v].firsts.length > 0) || [])[0];

const getLowestNumberOneValidator = (processedList, data) =>
  ([...processedList].reverse()
    .find(([v]) => (
      data.works[v].firsts.length > 0 && data.works[v].critics.length > 3
    )) || []
  )[0];

// likely not working corretly
const getMostDivisivePair = (processedList, data) => {
  let i = 1;
  let j = 2;
  let a = null;
  let b = null;
  while (j < processedList.length) {
    a = data.works[processedList[i][0]];
    b = data.works[processedList[j][0]];
    let containsNoMatches = true;
    a.critics.forEach(critic => {
      if (b.critics.includes(critic)) {
        containsNoMatches = false;
      }
    });
    if (containsNoMatches) {
      return [
        processedList[i][0],
        processedList[j][0],
      ];
    }
    if (j - i === 2) {
      i += 1;
    }
    if (j - i === 1) {
      j += 1;
    }
  }
  if (
    i === processedList.length
    || j === processedList.length
  ) {
    return [];
  } 

  return [
    processedList[i][0],
    processedList[j][0],
  ];

  // for (let i = 0; i < processedList.length; i++) {
  //   const a = data.works[processedList[i][0]];
  //   for (let j = i+1; j < processedList.length; j++) {
  //     const b = data.works[processedList[j][0]];
  //     let noMatch = true;
  //     a.critics.forEach(critic => {
  //       if (b.critics.includes(critic)) {
  //         noMatch = false;
  //       }
  //     });
  //     if (noMatch) {
  //     }
  //   }
  // }
  // return pair;
};

const getFilmsInOneList = (data) => (
  Object.keys(data.works)
    .filter(workKey => data.works[workKey].critics.length === 1)
    .reduce((acc, key) => ([
      ...acc,
      key,
    ]), [])
);

const getMostContrarianCritic = (processedList, data, maxUniqueEntries) => {
  const processedListObj = processedList.reduce((acc, val) => ({
    ...acc,
    [val[0]]: val[1].score,
  }), {});

  let totalVal = 0;
  let biggestContrarian = {
    name: null,
    score: Number.MAX_SAFE_INTEGER,
  };

  Object.entries(data.critics).forEach(([critic, { list }]) => {
    const criticListVal = Object.keys(list).reduce((acc, val) => 
      acc + processedListObj[val], 0
    );
    totalVal += (criticListVal || 0);

    if (
      Object.keys(list).length >= 10
      && criticListVal < biggestContrarian.score
      && (
        !maxUniqueEntries
        || (
          Object.keys(list)
            .filter(v => data.works[v].critics.length === 1)
            .length <= maxUniqueEntries
        )
      )
    ) {
      biggestContrarian = {
        name: critic,
        score: criticListVal,
      };
    }
  });
  return {
    ...biggestContrarian,
    totalVal,
  };
}

export const getListOfArrayValues = (processedList, values) => {
  const accumlators = values.reduce((acc, val) => ({
    ...acc,
    [val]: {},
  }), {});
  processedList.forEach(([, entry]) => {
    values.forEach(val => {
      if (!Array.isArray(entry[val])) {
        return;
      } 
      entry[val].forEach(dataPoint => {
        accumlators[val][dataPoint] = (accumlators[val][dataPoint] || 0) + 1;
      })
    })
  });
  return accumlators;
}

export const getMostOfArrayValues = (processedList, values) => {
  return Object.entries(getListOfArrayValues(processedList, values)).reduce((acc, [key, values]) => {
    return ({
      ...acc,
      [key]: Object.entries(values).sort(([,a], [,b]) => b - a)[0],
    });
  }, {});
}

const getMostSuccessfulStudio = (processedList) => {
  const productions = processedList.reduce((acc, [title, { production}]) => {
    if (!production || production === 'undefined' || production === 'N/A') {
      return acc;
    }
    if (acc[production]) {
      acc[production].push(title);
    } else {
      acc[production] = [title];
    }
    return acc;
  }, []);
  if (Object.entries(productions).length === 0) {
    return 'N/A';
  }
  const mostSuccessfulStudio = Object.entries(productions).sort((a, b) => (
    b[1].length - a[1].length
  ))[0];
  return `${mostSuccessfulStudio[0]} (${mostSuccessfulStudio[1].length})`
}

export const deriveAdditionalDataFromProcessedList = (processedList, data, format) => {
  const biggestLoser = getHighestWithoutNumberOne(processedList, data);
  const smallestWinner = getLowestNumberOne(processedList, data);
  const smallestWinnerValidator = getLowestNumberOneValidator(processedList, data);
  const divisivePair = getMostDivisivePair(processedList, data);
  const onlyInOneList = getFilmsInOneList(data);
  const mostContrarianCritic = getMostContrarianCritic(processedList, data);
  const mostContrarianCriticValidator = getMostContrarianCritic(processedList, data, 3);
  const arrayValues = getMostOfArrayValues(processedList, ['genre', 'cast', 'country', 'language']);
  const count = processedList.length;
  let bestStudio;
  if (format === 'film') {
    bestStudio = getMostSuccessfulStudio(processedList);
  }

  return {
    biggestLoser,
    smallestWinner,
    smallestWinnerValidator,
    divisivePair,
    onlyInOneList,
    mostContrarianCritic,
    mostContrarianCriticValidator,
    bestStudio,
    arrayValues,
    count,
  };
}

export const formatList = (smallData) => {
  const publications = {};
  const works = {};
  Object.entries(smallData).forEach(([critic, { list, publicationName, publication }]) => {
    let p = publicationName || publication;
    if (publications[p]) {
       publications[p].push(critic);
    } else if (p) {
      publications[p] = [critic];
    }
    Object.entries(list).forEach(([work, rank]) => {
      if (works[work]) {
        works[work].critics.push(critic);
      } else {
        works[work] = { critics: [critic], firsts: [] };
      }
      if (rank === 1) {
        works[work].firsts.push(critic);
      }
    });
  });
  return {
    publications,
    works,
    critics: smallData,
  };
};
