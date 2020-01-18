
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

