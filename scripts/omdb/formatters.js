const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s']; 

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

const formatRatings = (filmData) => {
  const ratings = {
    Metascore: filmData.Metascore,
    "Rotten Tomatoes": parseInt(filmData["Rotten Tomatoes"]),
    imdbRating: +filmData.imdbRating,
    imdbVotes: +filmData.imdbVotes,
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
      ratings.imdbRating = +rating.Value.split('/')[0];
    } else {
      ratings[rating.Source] === ratings[rating.Value]
    }
  })
  return ratings;
};

const formatFilmData = (filmData) => {
  return {
    Year: +filmData.Year,
    Runtime: parseInt(filmData.Runtime),
    Awards: formatAwards(filmData.Awards),
    ...formatRatings(filmData),
    imdbVotes: +filmData.imdbVotes,
    BoxOffice: +filmData.BoxOffice.replace(/(\$|,)+/g, ''),
  }
};

module.exports = {
  formatFilmData,
}