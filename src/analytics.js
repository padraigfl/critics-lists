
export const defaultScoringMatrix = {
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
};

const addMetricToScore = (val, rank, scoringMatrix = defaultScoringMatrix) => {
  const score = scoringMatrix[rank];
  return val ? val + score : score;
}

const getUnrankedListValue = (list, scoringMatrix = defaultScoringMatrix) => {
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

export const processListsWithRankings = (critics, matrix = defaultScoringMatrix) => {
  const films = {};
  Object.values(critics).forEach(({ list }) => {
    matrix._ = matrix._ || getUnrankedListValue(list, matrix);
    Object.entries(list).forEach(([workName, ranking]) => {
      films[workName] = addMetricToScore(films[workName], ranking, matrix);
    });
  });
  return Object.entries(films).sort((a, b) => b[1] - a[1]);
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
    [val[0]]: val[1],
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

export const deriveAdditionalDataFromProcessedList = (processedList, data) => {
  const biggestLoser = getHighestWithoutNumberOne(processedList, data);
  const smallestWinner = getLowestNumberOne(processedList, data);
  const smallestWinnerValidator = getLowestNumberOneValidator(processedList, data);
  const divisivePair = getMostDivisivePair(processedList, data);
  const onlyInOneList = getFilmsInOneList(data);
  const mostContrarianCritic = getMostContrarianCritic(processedList, data);
  const mostContrarianCriticValidator = getMostContrarianCritic(processedList, data, 3);

  return {
    biggestLoser,
    smallestWinner,
    smallestWinnerValidator,
    divisivePair,
    onlyInOneList,
    mostContrarianCritic,
    mostContrarianCriticValidator,
  };
}

export const formatList = (smallData) => {
  const publications = {};
  const works = {};
  Object.entries(smallData).forEach(([critic, { list, publication }]) => {
    if (publications[publication]) {
       publications[publication].push(critic);
    } else {
      publications[publication] = [critic];
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
