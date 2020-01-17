var jsdom = require('jsdom');
const curl = require('curl');
var fs = require('fs');

function writeJSON(filename, jsonData) {
  return fs.writeFile(filename, JSON.stringify(jsonData, null, '  '), function(err) {
    if (err) throw err;
  });
}

const getCriticsName = (critics, publicationName, criticDataRow) => {
  let criticName = criticDataRow.textContent.split('View full list')[0];
  if (critics[criticName]) {
    criticName = `${criticName}-${publicationName}`;
  }
  return criticName.replace(/(\t|\n|\s)+/g, ' ').trim();
};

const addOneToScore = (val) => val ? val + 1 : 1;

const formatListData = (listEntryEls, works, criticName) => {
  const data = {
    list: {},
  };
  [...listEntryEls].forEach((entry) => {
    if (entry.querySelector('em')) {
      data.note = entry.querySelector('em').textContent;
      return;
    }
    const rankingEntry = +entry.getAttribute('value') || 'unranked';
    if (entry.textContent.includes('(tie)')) {
      entry.textContent.replace('(tie)', '').trim().split(' -AND- ').forEach((v) => {
        data.list[v] = rankingEntry;
        if (!works[v]) {
          works[v] = { critics: [], firsts: [] }
        }
        works[v].critics.push(criticName);
        if (rankingEntry === 1) {
          works[v].firsts.push(criticName);
        }
      });
      return;
    }
    data.list[entry.textContent] = rankingEntry;

    if (!works[entry.textContent]) {
      works[entry.textContent] = { critics: [], firsts: [] }
    }
    works[entry.textContent].critics.push(criticName);
    if (rankingEntry === 1) {
      works[entry.textContent].firsts.push(criticName);
    }
  });
  return data;
}

const processData = (document) => {
  const critics = {};
  const publications = {};
  const works = {};
  
  const publicationsEl = document.getElementsByClassName('listtable');

  for (let i = 1; i < publicationsEl.length; i++) {
    let publicationName = publicationsEl[i].querySelector('caption');
    if (publicationName) {
      publicationName = publicationName.textContent.replace(/(\t|\n|\s)+/g, ' ').trim();
    } else {
      publicationName = publicationsEl[i].textContent || Math.ramdom();
      console.log(publicationsEl[i].innerHTML)
    }
    publications[publicationName] = {
      name: publicationName,
      writers: [],
    };
    const dataRows = publicationsEl[i].querySelectorAll('tbody tr');
    for (let j = 0; j < dataRows.length; j+=2) {
      const criticName = getCriticsName(critics, publicationName, dataRows[j]);
      publications[publicationName].writers.push(criticName);
      critics[criticName] = {
        link: dataRows[j].querySelector('a') ? dataRows[j].querySelector('a').href : undefined,
        publicationName: publicationName,
        ...formatListData(dataRows[j+1].querySelectorAll('td li'), works, criticName)
      };
    }
  }
  // TODO write data
  return { critics, works, publications };
}

const parseDom = html => {
    const {JSDOM} = jsdom;
    const dom = new JSDOM(html);
    return dom.window.document;
}

const dataFetch = (url) => {
  const year = url.match(/\d{4}/)[0];
  let format = url.match(/film|movie|album|tv|television/)[0]
  if (format === 'television') {
    format = 'tv';
  } else if (format === 'movie') {
    format = 'film';
  }

  curl.get(url, null, (err,resp,body)=>{
    if(resp.statusCode == 200){
      const document = parseDom(body);
      console.log(document);
      const data = processData(document);
      writeJSON(`${year}-${format}.json`, {
        ...data,
        source: url,
      });
      dataLog[year] = (Array.isArray(dataLog[year]) ? dataLog[year].push(format) : [format]);
      dataLog[format] = (Array.isArray(dataLog[format]) ? dataLog[format].push(year) : [year]);
    }
    else{
      //some error handling
      console.log("error while fetching url");
    }
  });
};

const dataLog = {};
[
  'https://www.metacritic.com/feature/critics-pick-top-10-best-movies-of-2019',
  'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2016',
  'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2016',
  'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2016',
  'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2015',
].forEach((url, idx, arr) => {
  dataFetch(url);
  if (idx === (arr.length - 1)) {
    writeJSON('dataLog.json', dataLog);
  }
});

// window.getData = processData;