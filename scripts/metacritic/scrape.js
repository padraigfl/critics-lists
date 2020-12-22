var jsdom = require('jsdom');
const process = require('process');
const curl = require('curl');
var fs = require('fs');

function writeJSON(filename, jsonData) {
  console.log('writing:', filename);
  return fs.writeFile(filename, JSON.stringify(jsonData), function(err) {
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

const formatListData = (listEntryEls, works, criticName, oldFormat) => {
  const data = {
    list: {},
  };
  [...listEntryEls].forEach((entry, idx) => {
    if (entry.querySelector('em')) {
      data.note = entry.querySelector('em').textContent;
      return;
    }
    let rankingEntry = +entry.getAttribute('value') || '_';

    if (oldFormat && rankingEntry === '_') {
      rankingEntry = idx + 1;
    }

    if (entry.textContent.includes('(tie)') || entry.textContent.match(/\(.*tie.*\)/)) {
      entry.textContent.replace('(tie)', '').trim().replace(' -AND- ', ' AND ').split(' AND ').forEach((v) => {
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
    const title = entry.textContent.replace(/(\t|\n|\s)+/g, ' ').trim();
    data.list[title] = rankingEntry;
    if (!works[title]) {
      works[title] = { critics: [], firsts: [] }
    }
    works[title].critics.push(criticName);
    if (rankingEntry === 1) {
      works[title].firsts.push(criticName);
    }
  });
  return data;
}

const getNextSibling = (element) => {
  const idx = [...element.parentNode.children].findIndex(el => el === element) + 1;
  return [...element.parentElement.children][idx];
}

const process2010 = (headingRows, url) => {
  const critics = {};
  const publications = {};
  const works = {};

  [...headingRows].forEach(v => {
    let link;
    const publicationName = !v.querySelector('strong').childElementCount ? v.querySelector('strong').textContent.replace(/(\t|\n|\s)+/g, ' ').trim() : undefined;
    let criticName = v.textContent.replace(/(View article)/, '').replace(/(\t|\n|\s)+/g, ' ').trim();
    if (publicationName) {
      criticName = criticName.replace(publicationName, '').replace(/(\t|\n|\s)+/g, ' ').trim();
    }
    if (critics[criticName]) {
      criticName = `${criticName}-${publicationName || Math.random().toString().substr(0, 3)}`;
    }
    if (v.querySelector('a')) {
      link = v.querySelector('a').href;
    }
    criticName = criticName.replace(/\s*View full list\s*/, '');

    const nextSibling = getNextSibling(v);
    if (nextSibling) {
      critics[criticName] = {
        link,
        publication: publicationName, 
      }
      const orderedList = nextSibling.querySelectorAll('ol li');
      const unorderedList = nextSibling.querySelectorAll('ul li');
      if (orderedList.length > 0) {
        const { list, ...rest } = formatListData(orderedList, works, criticName, true);
        critics[criticName] = {
          ...critics[criticName],
          ...rest,
          list,
        }
      }
      if (unorderedList.length > 0) {
        const { list, ...rest } = formatListData(unorderedList, works, criticName);
        critics[criticName] = {
          ...critics[criticName],
          ...rest,
          list: {
            ...critics[criticName].list, 
            ...list,
          },
        }
      }

    }
  })

  return { critics, works, publications }
}

const processData = (document) => {
  const critics = {};
  const publications = {};
  const works = {};

  let publicationsEl = document.getElementsByClassName('listtable');


  console.log('\n\n\n\n'+publicationsEl.length+'\n\n\n');

  if (publicationsEl.length === 2) {
    return process2010(
      [...publicationsEl[1].querySelectorAll('.criticname')].map(el => el.parentElement)
    );
  }

  if (publicationsEl.length === 3) {
    return process2010(
      [...publicationsEl[2].querySelectorAll('.criticname')].map(el => el.parentElement)
    );
  }

  for (let i = 1; i < publicationsEl.length; i++) {

    let publicationName = publicationsEl[i].querySelector('caption');
    if (!publicationName || !publicationName.textContent) {
      publicationName = publicationsEl[i].textContent || Math.ramdom();
    }
    publicationName = publicationName.textContent.replace(/(\t|\n|\s)+/g, ' ').trim();
    publications[publicationName] = {
      name: publicationName,
      writers: [],
    };
    const dataRows = publicationsEl[i].querySelectorAll('tbody tr');
    for (let j = 0; j < dataRows.length; j+=2) {
      const criticName = getCriticsName(critics, publicationName, dataRows[j]);
      publications[publicationName].writers.push(criticName);
      try {
        critics[criticName] = {
          link: dataRows[j].querySelector('a') ? dataRows[j].querySelector('a').href : undefined,
          publicationName: publicationName,
          ...formatListData(dataRows[j+1].querySelectorAll('td li'), works, criticName)
        };
      } catch {
        // console.log(publicationName, criticName);
      }
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

const dataFetch = (url, log) => {
  let year = url.match(/\d{4}/) ? url.match(/\d{4}/)[0] : 2010;
  let format =  url.match(/film|movie|album|tv|television/) ? url.match(/film|movie|album|tv|television/)[0] : 'mystery'+Math.random();
  if (format === 'television') {
    format = 'tv';
  } else if (format === 'movie') {
    format = 'film';
  }
  if (url.match('decade')) {
    year = 'decade-2000s';
  }
  if (url.match('2010s')) {
    year = 'decade-2010s';
  }

  curl.get(url, null, (err,resp,body)=>{
    if(resp && resp.statusCode == 200){
      const document = parseDom(body);

      const data = document.querySelector('.categoryname')// || document.querySelector('.criticname')
        ? process2010([...document.querySelectorAll('tr.categoryname')], url)
        : processData(document);
      const validData = Object.values(data.critics).some((criticData, idx) => {

        if (!criticData || typeof criticData.list !== 'object') {
          console.log('bad', Object.keys(data)[idx], criticData);
          return false;
        }
        return (
          Object.values(criticData.list) && Object.values(criticData.list).length > 9
        );
      });

      if (!validData) {
        throw Error('request fetched invalid data structure');
      }

      // writeJSON(`data/${year}-${format}.json`, {
      //   ...data,
      //   source: url,
      // });
      writeJSON(`public/data/${year}-${format}.json`, data.critics);
      dataLog[year] = (Array.isArray(dataLog[year]) ? [...dataLog[year], format] : [format]);
      dataLog[format] = (Array.isArray(dataLog[format]) ? [...dataLog[format], [year]] : [year]);
      dataLog[`${year}-${format}`] = {
        lists: Object.keys(data.critics),
        entries: Object.keys(data.works),
      };
    } else{
      //some error handling
      console.log("error while fetching url", url, err, resp);
    }

    if (log) {
      writeJSON('dataLog.json', dataLog);
      process.exit();
    }
  });
};

let count = 0;

const dataLog = { year: [], format: [] };
[
  // // // 'https://www.metacritic.com/feature/film-critics-pick-the-best-movies-of-the-decade', // no valid data
  // 'https://www.metacritic.com/feature/best-movies-of-the-decade-2010s',
  // 'https://www.metacritic.com/feature/best-albums-of-the-decade-2010s',
  // // // 'https://www.metacritic.com/feature/best-albums-of-the-decade-a-roundup-of-critic-lists' // unique format,
  // 'https://www.metacritic.com/feature/best-tv-shows-of-the-decade-2010s',
  // 'https://www.metacritic.com/feature/film-critic-top-ten-lists',
  // 'https://www.metacritic.com/feature/movie-critic-best-of-2011-top-ten-lists',
  // 'https://www.metacritic.com/feature/top-ten-lists-best-movies-of-2012',
  // 'https://www.metacritic.com/feature/film-critic-top-10-lists-best-movies-of-2013',
  // 'https://www.metacritic.com/feature/film-critic-top-10-lists-best-movies-of-2014',
  // 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2015',
  // 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2016',
  // 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2017',
  // 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2018',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-movies-of-2019',
  'https://www.metacritic.com/feature/film-critics-pick-10-best-movies-of-2020',
  // 'https://www.metacritic.com/feature/music-critic-top-ten-lists-best-of-2010?albums=1',
  // 'https://www.metacritic.com/feature/music-critic-top-ten-lists-best-albums-of-2011',
  // 'https://www.metacritic.com/feature/top-ten-lists-best-albums-of-2012',
  // 'https://www.metacritic.com/feature/critics-pick-top-ten-albums-of-2013',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-albums-of-2014',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2015',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2016',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2017',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2018',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2019',
  'https://www.metacritic.com/feature/music-critics-pick-top-10-best-albums-of-2020',
  // 'https://www.metacritic.com/feature/tv-critics-pick-ten-best-tv-shows-of-2010',
  // 'https://www.metacritic.com/feature/tv-critic-top-10-best-shows-of-2011',
  // 'https://www.metacritic.com/feature/top-ten-lists-best-tv-shows-of-2012',
  // 'https://www.metacritic.com/feature/tv-critics-pick-best-television-shows-of-2013',
  // 'https://www.metacritic.com/feature/tv-critics-pick-10-best-tv-shows-of-2014',
  // 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2015',
  // 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2016',
  // 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2017',
  // 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2018',
  // 'https://www.metacritic.com/feature/critics-pick-top-10-best-tv-shows-of-2019',
  'https://www.metacritic.com/feature/tv-critics-pick-10-best-tv-shows-of-2020',

].forEach((url, idx, arr) => {
  count = count + 1;
  setTimeout(()  => {
    try {
      dataFetch(url, (idx - 1  === arr.length));
    } catch (e) {
      console.error(e);
      console.error("failed at", url);
    }
  }, count * 5000);
});

// window.getData = processData;