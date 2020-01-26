import { writable } from 'svelte/store';

export const films = writable({

});

export const albums = writable({

});

export const tv = writable({

});

export const format = writable('film');
export const year = writable('2019');

export const scoringMatrix = writable({
  1: 10,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
  10: 1,
  '_': 1,
});

export const OPTIONS = {
  years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
  formats: ['film', 'album', 'tv'],
};
