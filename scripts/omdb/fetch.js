var curl = require('curl');
const process = require('process');
var { readFile, writeFile, YEARS } = require('../utils');
const { formatFilmData } = require('./formatters');
var formatters = require('./formatters');

const addFilm = (films, film, year, bonusData) => {
  let filmName = film;
  let data;
  if (bonusData) {
    filmName = film.replace(/\(.*\)/, '').trim();
    data = film.replace(/.*\((.*)\)/, '$1').trim();
  }
  if (films[filmName]) {
    return;
  }
  films[filmName] = { year, originalTitle: film }
  if (bonusData && data) {
    films[filmName][bonusData] = data;
  }
};

const getFilmList = (year, bonusData, format = 'film') => {
  const criticData = readFile(`./public/data/${year}-${format}.json`);
  const films = {};

  Object.values(criticData).forEach(critic => {
    Object.keys(critic.list).forEach(film => {
      if (film.includes('-AND-')) {
        film.split('-AND-')
          .forEach(v => {
            addFilm(films, v, year, bonusData);
          });
        return;
      }
      if (format === 'tv' && film.match(/^.*\(.*\)$/)) {
        addFilm(films, film, year, bonusData);
        return;
      }
      addFilm(films, film, year, bonusData);
    });
  });
  return films;
};

const getFilm = (films, title, year, issueLog, errorLog = {}, format = 'film', apikey = process.env.OMDB_KEY) => {
  let url;
  if (format === 'film') {
    url = `http://www.omdbapi.com/?t=${title.replace(/\&/g, '%26').replace(/\s/g, '%20')}${year ? `&y=${year}` : ''}&type=movie${ apikey ? `&apikey=${apikey}` : ''}`
  } else if (format === 'tv' && title.split(' (')[0]) {
    url = `http://www.omdbapi.com/?t=${title.split(' (')[0].replace(/\&/g, '+').replace(/\s/g, '+')}&type=series${ apikey ? `&apikey=${apikey}` : ''}`
  } else {
    return Promise.resolve();
  }
  return new Promise((res) => {
    setTimeout(() => {
      curl.get(url, null, (err,resp,respBody)=>{
        try {
          const body = JSON.parse(respBody);
          if (body.Error) {
            errorLog[title] = { year, error: body.Error };
          }
          if (films[title] && +body.Year !== +films[title].year) {
            issueLog[title] = {
              ...films[title],
              notSameYear: body.Year,
            };
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
            films[title] = {
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
          } else {
            errorLog[title] = { year };
            //some error handling
            // console.log("error while fetching url", url, err, resp);
          }
          res(body);
        } catch(e) {
          errorLog[title] = { year };
          console.log('error', title);
          console.log(e);
          res();
        }
      });
    }, 500);
  });
}

const handleIssueLog = (
  films,
  issues,
  errorLog,
  yearChange = 0,
) => {
  const log = Object.entries(issues);
  issueLog = {};
  log.map(async ([name, { year }]) => 
    await getFilm(films, name, +year + yearChange, issueLog, errorLog)
  )
  writeFile(`${year}failures.json`, errorLog);
  writeFile(`${year}issues.json`, issueLog);
  writeFile(`${year}film.json`, films);
  if (!yearChange) {
    handleIssueLog(films, issueLog, errorLog, 1);
  } else if (yearChange === 1) {
    handleIssueLog(films, issueLog, errorLog, -1);
  }
}

const writeFilms = (films, year, errorLog, issueLog, format = 'film', onlyNew) => {
  let existingList = {};
  if (onlyNew) {
    existingList = readFile(`./public/${format}/${year}data.json`);
    let i = 0;
    let j = 0;
    Object.keys(films).forEach((filmName) => {
      i++;
      const key = filmName
        ? filmName
        : filmName.split(' (')[0].trim()
      try {
        if (
          existingList[key]
          || (format === 'tv' && !key.includes('*') && Object.keys(existingList).find(v => v.match(new RegExp("^"+key+"\s*(\(.*\))$"))))
        ) {
          delete films[key];
          j++;
        }
      } catch (e) {
        console.log(e);
      }
    });
    console.log(`fetching ${i - j} of ${i}`)
  }
  Promise.all(Object.entries(films).map(([title]) => (
    getFilm(films, title, null, issueLog, errorLog, format)
  ))).then(() => {
    films = Object.entries(films).reduce((acc, [key,val]) => ({
      ...acc,
      [val.originalTitle || key]: val,
    }), {});
   
    writeFile(`${year}failures${onlyNew ? '--only-new' : ''}.json`, errorLog);
    writeFile(`${year}issues${onlyNew ? '--only-new' : ''}.json`, issueLog);
    writeFile(`${year}data${onlyNew ? '--only-new' : ''}.json`, films);
    // handleIssueLog(films, issueLog, errorLog);
  });
}



const workYear = (year, bonusData, format, onlyNew) => {
  let films = getFilmList(year, bonusData, format);
  const errorLog = {};
  let issueLog = {};
  writeFilms(films, year, errorLog, issueLog, format, onlyNew);
};

/*
// single calls

get one film
  getFilm({}, 'My Perestroika')

get one year
  workYear('2010s', 'year');

get each year
  YEARS.forEach((v, idx) => {
    setTimeout(() => workYear(v, v === '2010s' ? 'year' : undefined), idx * 10000)
  });

resolve issues example (wrong year)
  const cata = readFile(`./public/filmdata/${2010}sissues.json`);
  Object.entries(cata).forEach(
    v => {
      console.log(v);
      //if (v[1].notSameYear && +v[1].notSameYear < 2015 && +v[1].notSameYear > 1999)
      if (!v[1].notSameYear)
        getFilm({}, v[0], +v[1].year) 
    } 
  )
*/

['2010s'].forEach((year, idx) => {
  setTimeout(() => {
    // 4th param only fetches data for new entries not in existing list
    workYear(year, 'year', 'tv', true)
    if (idx === YEARS.length - 1) {
      // setTimeout(process.exit, 1000);
    }
  }, idx * 500);
})


