var curl = require('curl');
var process = require('process');
var { readFile, writeFile } = require('../utils');

const getSpotify = (query, pause = 1000) => new Promise((res, rej) => {
  return curl.get(
  `https://api.spotify.com/v1/${query}`,
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
      Accept: 'application/json',
    },
  }, (err, resp, data) => {
    // console.log(f)
    if (err) {
      res({});
    }
    try {
      setTimeout(() => {
        try {
          res(JSON.parse(data))
         } catch(e) {
           rej(e);
         }
      }, pause);
    } catch (e) {
      console.log(e);
      rej('e');
    }
  })
});

const sanitizeString = (str) => str.toLowerCase().replace(/[^\w]/g, ' ').replace(/\s+/g, ' ')

const handleAlbumResponse = (albumName, artistName) => res => {
  if (!res.albums) {
    console.log('none for ', albumName, artistName);
    return [5, null];
  }
  let album = res.albums.items.find((album) => sanitizeString(album.name) === sanitizeString(albumName));
  if (album) {
    return [
      1,
      album,
    ];
  }
  const first = res.albums.items;
  if (sanitizeString(artistName) === sanitizeString(album.artist)) {
    return [
      2,
      first,
    ];
  }

  if (res.albums.items.length) {
    return [
      3,
      res.albums.items.reduce((maxPop, album) => {
        if (album.popularity > maxPop.popularity) {
          return album;
        }
        return maxPop;
      }),
    ];
  }

  return [4, null];
}

const formatAlbumData = (albumName, artistName) => ([confidence, albumData]) => {
  const album = { album: albumName, artist: artistName, confidence };
  if (!albumData && albumData !== null) {
    return album;
  }
  // const spotifyAlbum = await getSpotify(`album/${albumData.id}`)
  return {
    ...album,
    image: albumData.images.find((image) => image.width === 64).url,
    popularity: albumData.popularity,
    spotifyId: albumData.id,
    urls: albumData.external_urls,
    trackCount: albumData.total_tracks,
    release: albumData.release_date,
  };
}

const getAlbumData = async (albumName, artistName) => {
  return await getSpotify(`search?q=album%3A${albumName.split(' ').join('%20')}%20artist%3A${artistName.split(' ').join('%20')}&type=album&limit=10&include_external=audio`)
    .then(handleAlbumResponse(albumName, artistName))
    .then(formatAlbumData(albumName, artistName))
    .catch((e) => e)
}

const getAlbumsData = async (year) => {
  const listData = readFile(`./public/data/${year}-album.json`);
  const allAlbums = [];
  Object.values(listData).forEach((current) => {
    Object.keys(current.list).forEach((name) => {
      if (!allAlbums.includes(name)) {
        allAlbums.push(name);
      }
    })
  }, []);

  const albumData = {};

  for (let i = 0; i < allAlbums.length; i++) {
    const [name, artist] = allAlbums[i].split(' by ');
    albumData[allAlbums[i]] = await getAlbumData(name, artist);
    process.stdout.write(`${i+1}/${allAlbums.length};`);
  }
  console.log(albumData);
  console.log('high ', Object.values(albumData).filter(v => v.confidence === 1).length);
  console.log('med ', Object.values(albumData).filter(v => v.confidence === 2).length);
  console.log('low ', Object.values(albumData).filter(v => v.confidence === 3).length);
  console.log('no match', Object.values(albumData).filter(v => v.confidence === 4).length);
  console.log('no response', Object.values(albumData).filter(v => v.confidence === 5).length)
  writeFile('./public/audio2010.json', albumData);
  setTimeout(process.exit, 1000);
}

getAlbumsData('2010');

