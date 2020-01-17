
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
