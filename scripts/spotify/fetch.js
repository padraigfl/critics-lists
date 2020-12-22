var curl = require('curl');
const { get } = require('http');
var process = require('process');
var { readFile, writeFile, YEARS } = require('../utils');

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
      res({ error: true });
    }
    try {
      setTimeout(() => {
        try {
          res(JSON.parse(data))
         } catch(e) {
           rej({ error: true });
         }
      }, pause);
    } catch (e) {
      console.log(e);
      rej({ error: true });
    }
  })
});

const sanitizeString = (str) => str.toLowerCase().replace(/[^\w]/g, ' ').replace(/\s+/g, ' ')

const getArtistData = async (artistId) => {
  return await getSpotify(`artists/${artistId}`);
}

const getAlbumLengthFromTracks = (tracks) => tracks.items.reduce(
  (acc, { duration_ms }) => acc + duration_ms,
  0,
);

const getAlbumData = async (selectedSearchResult) => {
  return await getSpotify(`albums/${selectedSearchResult}`)
}

const getArtistGenres = (artistData) => {
  return (
    artistData.reduce((acc, { genres }) => {
      genres.forEach((genre) => {
        if (!acc.includes(genre)) {
          acc.push(genre);
        }
      });
      return acc;
    }, [])
  );
}

const handleAlbumResponse = (albumName, artistName) => async res => {
  let confidence = 4;
  let likelyAlbum = null;

  if (!res || res.error) {
    console.log('failed to fetch', artistName, albumName);
    return await Promise.resolve({ artist: artistName, album: albumName, confidence: 5 })
  }
  if (!res.albums || !res.albums.items.length) {
    console.log('none for ', albumName, artistName);
    return await Promise.resolve({ artist: artistName, album: albumName, confidence: 4 });
  }

  let album = res.albums.items.find((album) =>
    sanitizeString(album.name) === sanitizeString(albumName)
    && album.artists.some(artist =>
      sanitizeString(artist.name) === sanitizeString(artistName)
    )
  );

  if (album) {
    confidence = 1;
    likelyAlbum = album;
  } else {
    album = res.albums.items.find((album) =>
      sanitizeString(album.name) === sanitizeString(albumName)
      || album.artists.some(artist =>
        sanitizeString(artist.name) === sanitizeString(artistName)
      )
    );
  }

  if (!likelyAlbum && album) {
    likelyAlbum = album;
    confidence = 2;
  }

  if (!likelyAlbum && res.albums.items.length) {
    likelyAlbum = res.albums.items[0];
    // most popular was failing badly
    // likelyAlbum = res.albums.items.reduce((maxPop, album) => {
    //   if (album.popularity > maxPop.popularity) {
    //     return album;
    //   }
    //   return maxPop;
    // });
    confidence = 3;
  }

  const albumData = await getAlbumData(likelyAlbum.id);
  const artistData = await Promise.all(
    likelyAlbum.artists.filter(({ id }) => !!id).map((artist) => {
      return getArtistData(artist.id)
    })
  );

  return {
    artistName,
    albumName,
    spotifyAlbumName: albumData.name,
    confidence,
    id: albumData.id,
    popularity: albumData.popularity,
    trackCount: albumData.total_tracks,
    // mostPopularTrack: getMostPopularTrackId(albumData),
    upc: albumData.external_ids
      ? albumData.external_ids.upc
      : null,
    image: albumData.images.length
      ? albumData.images.pop().url
      : null,
    artists: artistData.map((artist) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
    })),
    genres: albumData.genres.length > 0
      ? albumData.genres
      : getArtistGenres(artistData),
    usingArtistGenres: albumData.genres.length === 0,
    length: getAlbumLengthFromTracks(albumData.tracks),
  }
}

const findAlbumData = async (albumName, artistName) => {
  return await getSpotify(`search?q=album%3A${(albumName || '').split(' ').join('%20')}%20artist%3A${(artistName|| '').split(' ').join('%20')}&type=album&limit=10&include_external=audio`)
    .then(handleAlbumResponse(albumName, artistName))
    .catch((e) => e)
}

const getAlbumsData = async (year) => {
  console.log(year);
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

  const albumBatches = [];
  const batchSize = 10;
  for (let i = 0; i < allAlbums.length; i+=batchSize) {
    albumBatches.push(allAlbums.slice(i, i+batchSize));
  }

  for (let i = 0; i < albumBatches.length; i++) {
    await Promise.all(albumBatches[i].map(
      (alb) => {
        const [name, artist] = alb.split(' by ');
        return findAlbumData(name, artist);
      })).then((dataArr) => {
        dataArr.forEach((entryData, idx) => {
          albumData[allAlbums[(i*batchSize) + idx]] = entryData;
        });
        return new Promise((res, rej) => {
          setTimeout(res, 5000);
        });
      });
    process.stdout.write(`${i+1}/${albumBatches.length};`);
  }
  console.log(albumData);
  console.log('high ', Object.values(albumData).filter(v => v.confidence === 1).length);
  console.log('med ', Object.values(albumData).filter(v => v.confidence === 2).length);
  console.log('low ', Object.values(albumData).filter(v => v.confidence === 3).length);
  console.log('no match', Object.values(albumData).filter(v => v.confidence === 4).length);
  console.log('fail', Object.values(albumData).filter(v => v.confidence === 5).length);
  writeFile(`./public/${year}data.json`, albumData);
}

const getYears = async (idx) => {
  await getAlbumsData(YEARS[idx]);
  if (idx === YEARS.length - 1) {
    setTimeout(process.exit, 1000);
  }
  return getYears(idx + 1);
}

getAlbumsData('2020');