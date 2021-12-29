
var { readFile, writeFile, YEARS } = require('../utils');

// Breaks down string value for awards and noms into a basic numeric, currently ignores source of award
const stringToNumber = (val) => +val ? +val : 0;

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

  return count;
};

// pulls data from the Ratings attribute and uses it if no other value available
const formatRatings = (filmData) => {
  const ratings = {
    Metascore: filmData.Metascore,
    "Rotten Tomatoes": parseInt(filmData["Rotten Tomatoes"]),
    imdbRating: +filmData.imdbRating,
    imdbVotes:  +(`${filmData.imdbVotes}`.replace(',', '')),
  };

  if (!filmData.Ratings || filmData.Ratings.length === 0) {
    return ratings;
  }

  filmData.Ratings.forEach((rating) => {
    if (!ratings.Metascore && rating.Source === 'Metacritic') {
      ratings.Metascore = +rating.Value.replace('%', '');
    } else if (!ratings['Rotten Tomatoes'] && rating.Source === 'Rotten Tomatoes') {
      ratings['Rotten Tomatoes'] = +rating.Value.replace('%', '')
    } else if (!ratings.imdbRating && rating.Source === 'Internet Movie Database') {
      ratings.imdbRating = +(rating.Value.split('/')[0]);
    } else {
      ratings[rating.Source] === ratings[rating.Value]
    }
  })
  return ratings;
};

// Aggregates the ratings across critics for faster data breakdowns
const getEntryRankings = (key, criticData) => {
  const rankings = {};

  if (key) {
    Object.values(criticData).forEach(({ list }) => {
      Object.entries(list).forEach(([title, rank]) => {
        if (title === key) {
          rankings[rank] = (rankings[rank] || 0) + 1
        }
      })
    });
  }

  return rankings;
}

// cleans the data some from the OMDb responses
const formatFilmData = (filmData, key, criticData) => {
  const { Ratings, ...data } = filmData;
  return {
    ...data,
    ...formatRatings(filmData),
    Year: +filmData.Year || undefined,
    Runtime: parseInt(filmData.Runtime) || 'N/A',
    // Awards: formatAwards(filmData.Awards),
    imdbVotes: filmData && filmData.imdbVotes ? +(`${filmData.imdbVotes}`.replace(',', '')) : undefined,
    // rankings: getEntryRankings(key, criticData)
  }
};

const readAndFormatFile = (format = 'tv', year = '2021') => {
  const allData = readFile(`./public/${format}/${year}data.json`);
  Object.entries(allData).forEach(([name, data ]) => {
    allData[name] = formatFilmData(data);
  })
  writeFile(`./public/${format}/${year}data.json`, allData);
}

//readAndFormatFile('film', '2021')

module.exports = {
  formatFilmData,
  getEntryRankings,
  readAndFormatFile,
};
