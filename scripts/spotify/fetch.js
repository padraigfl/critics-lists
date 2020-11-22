var curl = require('curl');
var process = require('process');
var { readFile, writeFile } = require('../utils');

const getSpotify = (query, pause = 500) => new Promise((res, rej) => {
  curl.get(
  `https://api.spotify.com/v1/${query}`,
  {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
      Accept: 'application/json',
    },
  }, (data) => {
    try {
      setTimeout(() => res(JSON.parse(data)), pause);
    } catch (e) {
      rej('e');
    }
  })
});

const sanitizeString = (str) => str.toLowerCase().replace(/[^\w]/g, ' ').replace(/\s+/g, ' ')

const handleAlbumResponse = (albumName, artistName) => res => {
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
  if (!albumData) {
    return album;
  }
  // const spotifyAlbum = await getSpotify(`album/${albumData.id}`)
  return {
    ...album,
    image: albumData.images.find((image) => image.width === 64).url,
    popularity: albumData.popularity,
    spotifyId: albumData.id,
    urls: albumData.external_urls,
  };
}

const getAlbumData = (albumName, artistName) => {
  return getSpotify(`search?q=album%3A${albumName}%20artist%3A${artistName}&type=album`)
    .then(handleAlbumResponse(albumName, artistName))
    .then(formatAlbumData(albumName, artistName))
    .catch((e) => e)
}

const getAlbumsData = (year) => {
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

  allAlbums.map(async (albumString, idx) => {
    const [name, artist] = albumString.split(' by ');
    albumData[albumString] = await getAlbumData(name, artist);
    if (allAlbums.length === idx + 1) {
      // writeFile(`./public/albumdata/${year}data.json`, albumData);
      // setTimeout(process.exit, 1000);
      console.log(allAlbums);
    }
  });
}

getAlbumsData('2010');

