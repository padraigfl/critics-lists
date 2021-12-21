var curl = require('curl');
var process = require('process');
var { readFile, writeFile, YEARS } = require('../utils');
var { formatFilmData, getEntryRankings } = require('./formatters');

const getByImdbId = (imdbId, title, issueLog = {}, apikey = process.env.OMDB_KEY) => {
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
          issueLog[title] = { e: "CaughtError", id: imdbId }
          res();
        }
      });
    }, 300);
  });
}

// searches through the existing film data fields and checks again against omdb for new data
const updateYearData = async (year, format) => {
  const criticData = readFile(`./public/data/${year}-${format}.json`);
  const filmData = readFile(`./public/${format}/${year}data.json`);
  const issueLog = {};
  const filteredEntries = Object.entries(filmData).filter(([, value]) => value.imdbID);
  const sanitizedFilmData = {};
  const requestBatches = []

  for (let j = 0; j < filteredEntries.length; j += 10) {
    requestBatches.push(filteredEntries.slice(j, j+10));
  }

  for (let i = 0; i < requestBatches.length; i++) {
    await Promise.all(
      requestBatches[i].map((entry, idx) => {
        const [key, data] = entry;
        return new Promise((res, rej) => 
          getByImdbId(data.imdbID, key, issueLog)
            .then((film) => {
              console.log(key, data.imdbID);
              return setTimeout(() => res(film), 20 * idx);
            })
            .catch(() => setTimeout(() => res(), 1000))
        )
      })
    ).then((films) => {
      films.forEach((film, idx) => {
        if (film && film.imdbID) {
          sanitizedFilmData[requestBatches[i][idx][0]] = formatFilmData(film, requestBatches[i][idx][0], criticData);
        } else {
          issueLog[requestBatches[i][idx][0]] = {
            ...(issueLog[requestBatches[i][idx][0]] || {}),
            noId: true,
          };
        }
      })
    });
  }

  console.log('finished', year)
  if (Object.keys(issueLog).length > 0) {
    console.warn(issueLog);
  }
  writeFile(
    `./public/${format}/${year}data.json`,
    { ...filmData, ...sanitizedFilmData },
  );
  return Promise.resolve();
};

const getAllYears = async (format, idx = 0) => {
  if (!YEARS[idx]) {
    setTimeout(process.exit, 1000);
    return;
  };
  console.log(YEARS[idx]);
  await updateYearData('2013', format);
  // setTimeout(() => {
  //   getAllYears(format, idx + 1)
  // }, 1000);
}

getAllYears('film', 11);
// getAllYears('tv');
// module.exports = updateFilmList;
