var fs = require('fs');
var curl = require('curl');

const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s']; 

function writeFile(filename, jsonData) {
  // console.log('writing:', filename);
  return fs.writeFile(filename, JSON.stringify(jsonData), function(err) {
    if (err) throw err;
  });
}

const readFile = (filename) => {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch {
    console.error(filename, 'doesnt exist');
    return {};
  }
}

const addFilm = (films, film, year, bonusData) => {
  let filmName = film;
  let data;
  if (bonusData) {
    filmName = film.replace(/\(.*\)/, '').trim();
    data = film.replace(/.*\((.*)\)/, '$1').trim();
  }
  if (films[filmName]) {
    console.log('duplicate film');
    return;
  }
  films[filmName] = { year, originalTitle: film }
  if (bonusData && data) {
    films[filmName][bonusData] = data;
  }
};

const getFilmList = (year, bonusData) => {
  const criticData = readFile(`./public/data/${year}-film.json`);
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
      addFilm(films, film, year, bonusData);
    });
  });
  return films;
};

const getFilm = (films, title, year, issueLog, errorLog = {}, apikey = '') => {
  const url = `http://www.omdbapi.com/?t=${title.replace(/\&/g, '%26').replace(/\s/g, '%20')}${year ? `&y=${year}` : ''}&type=movie&apikey=${apikey}`
  return new Promise((res) => {
    setTimeout(() => {
      curl.get(url, null, (err,resp,respBody)=>{
        try {
          const body = JSON.parse(respBody);
          console.log(respBody);
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
          res();
          console.log(e);
          console.log(respBody);
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
  Promise.all(
    log.map(([name, { year }]) => 
      getFilm(films, name, +year + yearChange, issueLog, errorLog)
    )
  ).then(() => {
    writeFile(`filmdata/${year}failures.json`, errorLog);
    writeFile(`filmdata/${year}issues.json`, issueLog);
    writeFile(`filmdata/${year}film.json`, films);
    if (!yearChange) {
      handleIssueLog(films, issueLog, errorLog, 1);
    } else if (yearChange === 1) {
      handleIssueLog(films, issueLog, errorLog, -1);
    }
  });
}

const writeFilms = (films, year, errorLog, issueLog) => {
  Promise.all(Object.entries(films).map(([title]) => (
    getFilm(films, title, null, issueLog, errorLog)
  ))).then(() => {
    // console.log(films);
    films = Object.entries(films).reduce((acc, [key,val]) => ({
      ...acc,
      [val.originalTitle || key]: val,
    }), {});
    writeFile(`filmdata/${year}failures.json`, errorLog);
    writeFile(`filmdata/${year}issues.json`, issueLog);
    writeFile(`filmdata/${year}film.json`, films);
    // handleIssueLog(films, issueLog, errorLog);
  });
}



const workYear = (year, bonusData) => {
  let films = getFilmList(year, bonusData);
  const errorLog = {};
  let issueLog = {};
  writeFilms(films, year, errorLog, issueLog);
};


// years.forEach((v, idx) => {
//   setTimeout(() => workYear(v, v === '2010s' ? 'year' : undefined), idx * 10000)
// });

// workYear('2010s', 'year');


// const cata = readFile(`./public/filmdata/${2010}sissues.json`);
// Object.entries(cata).forEach(
//   v => {
//     console.log(v);
//     //if (v[1].notSameYear && +v[1].notSameYear < 2015 && +v[1].notSameYear > 1999)
//     if (!v[1].notSameYear)
//       getFilm({}, v[0], +v[1].year) 
//   } 
// )

// getFilm({}, 'My Perestroika')

// workYear('2010s', 'year');

// const newFile = readFile('./filmdata/2010sssfilm.json');
// const oldFile = readFile('./public/filmdata/2010sfilm.json');

// Object.entries(newFile).forEach(([k, v]) => {
//     oldFile[k]['Ratings'] = [];
//     if (oldFile[k] && v && v['Rotten Tomatoes']) {
//       oldFile[k]['Ratings'].push({ Source: 'Rotten Tomatoes', Value: v['Rotten Tomatoes'] });
//     }
//     if (oldFile[k] && v && v['Metascore']) {
//       oldFile[k]['Ratings'].push({ Source: 'Metacritic', Value: v['Metascore'] });
//     }
// });

// writeFile('2010sfilm.json',oldFile);