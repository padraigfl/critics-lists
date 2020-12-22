var fs = require('fs');

const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2010s']; 

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

module.exports = {
  writeFile,
  readFile,
  YEARS: years,
};
