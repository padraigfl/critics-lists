var curl = require('curl');
var process = require('process');
var { readFile, writeFile, YEARS } = require('../utils');
var { formatFilmData, getEntryRankings } = require('./formatters');

const getByImdbId = (imdbId, title, issueLog = {}, apikey = '') => {
  const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${apikey}`
  return new Promise((res) => {
    setTimeout(() => {
      curl.get(url, null, (err,resp,respBody)=>{
        try {
          const body = JSON.parse(respBody);
          if (body.Error) {
            issueLog[imdbId] = { year, error: body.Error };
          }
          if (+resp.statusCode == 200) {
            const {
              Response,
              Website,
              DVD,
              Type,
              Ratings,
              Production,
              ...restBody
            } = body;
            console.log(title);
            res({
              ...(Ratings || []).reduce((acc, {Source, Value}) => {
                if (['Internet Movie Database', 'Metacritic'].includes(Source)) {
                  return acc;
                }
                return {
                  ...acc,
                  [Source]: Value,
                };
              }, {}),
              ...restBody
            });
          } else {
            issueLog[imdbId] = { year };
            //some error handling
            // console.log("error while fetching url", url, err, resp);
          }
          res(body);
        } catch(e) {
          issueLog[imdbId] = "CaughtError"
          res();
        }
      });
    }, 100);
  });
}

// searches through the existing film data fields and checks again against omdb for new data
const updateFilmList = (year, format = 'film') => {
  const criticData = readFile(`./public/data/${year}-${format}.json`);
  const filmData = readFile(`./public/filmdata/${year}data.json`);
  const issueLog = {};
  const filteredEntries = Object.entries(filmData).filter(([, value]) => value.imdbID);

  return Promise.all(
    filteredEntries.map(async ([key, { imdbID }]) => await getByImdbId(imdbID, key, issueLog))
  ).then((updatedFilmData) => {
    console.log(updatedFilmData)
    const sanitizedFilmData = {};
    updatedFilmData.forEach((film, idx) => {
      if (film && film.imdbID) {
        sanitizedFilmData[filteredEntries[idx][0]] = formatFilmData(film, filteredEntries[idx][1], criticData);
      } else {
        issueLog[filteredEntries[idx][0]] = 'noImdbKey';
      }
    });
    
    if (Object.keys(issueLog).length > 0) {
      console.warn(issueLog);
    }
    writeFile(
      `./public/${format}data/${year}data.json`,
      { ...filmData, ...sanitizedFilmData },
    );

    setTimeout(process.exit, 1000);
    return null;
  });
};

YEARS.forEach((year, idx, arr) => {
  updateFilmList(year, 'film')
    .then(() => {
      if (idx === arr.length - 1)
        setTimeout(process.exit, 1000);
    });
});
// module.exports = updateFilmList;
