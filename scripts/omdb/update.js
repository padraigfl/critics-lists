var curl = require('curl');
var process = require('process');
var { readFile, writeFile } = require('../utils');
var { formatFilmData, getEntryRankings } = require('./formatters');

const getByImdbId = (imdbId, issueLog = {}, apikey = '') => {
  const url = `http://www.omdbapi.com/?t=${imdbId}&apikey=${apikey}`
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
            const filmData = {
              ...films[title],
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
            };
            res(filmData)
          } else {
            errorLog[title] = { year };
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
  const filmData = readFile(`./public/filmdata/${year}${format}.json`);
  const [filmKeys, filmValues] = Object.entries(filmData);
  const issueLog = {};
  Promise.all(
    filmValues.map(async ({ imdbID }) => await getByImdbId(imdbID, issueLog))
  ).then((updatedFilmData) => {
    const sanitizedFilmData = {};
    updatedFilmData.forEach((film, idx) => {
      if (film.imdbID) {
        sanitizedFilmData[filmKeys[idx]] = formatFilmData(film, filmKeys[idx], criticData);
      }
    });
    
    if (Object.keys(issueLog).length > 0) {
      console.warn(issueLog);
    }
    writeFile(
      `./public/filmdata/${year}film.json`,
      { ...filmData, ...sanitizedFilmData },
    );
    setTimeout(process.exit, 1000);
  });
};

module.exports = updateFilmList;
