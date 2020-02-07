var fs = require('fs');
var curl = require('curl');

function writeFile(filename, jsonData) {
  console.log('writing:', filename);
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
  films[filmName] = { year }
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

const getFilm = (title, year, apikey) => {
  const url = `http://www.omdbapi.com/?t=${title}${year ? `&y=${year}` : ''}&type=movie&apikey=${apikey}`
  return new Promise((res) => {
    curl.get(url, null, (err,resp,respBody)=>{
      const body = JSON.parse(respBody);
      if (body.Error) {
        errorLog[title] = { year };
      }
      if (body.Year !== films[title].year) {
        issueLog[title] = {
          ...films[title],
          ...body
        };
      }
      if (resp && resp.statusCode == 200) {
        films[title] = {
          ...films[title],
          ...body,
        };
      } else {
        errorLog[title] = { year };
        //some error handling
        console.log("error while fetching url", url, err, resp);
      }
      res(body);
    });
  });
}



const films = getFilmList(2010);
const errorLog = readFile('failures.json');
let issueLog = readFile('issues.json');

const writeFilms = () => {
  Promise.all(Object.entries(films).map(([title]) => (
    getFilm(title)
  ))).then(() => {
    console.log(films);
    writeFile('failures.json', errorLog);
    writeFile('issueLog', issueLog);
    writeFile(`afilm-2011.json`, films);
  });
}

const handleIssueLog = (yearChange = 0) => {
  const log = Object.entries(issueLog);
  issueLog = {};
  Promise.all(
    log.map(([name, { year }]) => 
      getFilm(name, year)
    )
  ).then(() => {
    writeFile('failures.json', errorLog);
    writeFile('issueLog', issueLog);
    writeFile(`afilm-2011.json`, films);
    if (!yearChange) {
      handleIssueLog(year + 1);
    } else if (yearChange === -1) {
      handleIssueLog(year - 1);
    }
  });
}

writeFilms();