<script>

  import Meter from './Meter.svelte';
  export let placement;
  export let title;
  export let entry;
  export let points;
  export let highestPoints;
  export let mostFirsts;
  export let mostLists;
  export let format;
  let listData = [];
  let yearData;
  let derivedData;

  const film = [
    { site: 'IMDb', link: 'https://www.imdb.com/find?s=tt&q=' },
    { site: 'RT', link: 'https://www.rottentomatoes.com/search/?search=' },
    { site: 'Letterboxd', link: 'https://letterboxd.com/search/films/' },
  ];

  const album = [// need to remove by
    { site: 'Spotify', link: 'https://open.spotify.com/search/', modify: v => v.replace(/\s/g, '%20').replace(/by/g, '') },// %20
    { site: 'RYM', link: 'https://rateyouralbum.com/search?searchtype=l&searchterm=', modify: v => v.replace(/\s/g, '+').replace(/by/g, '') } , // +
    { site: 'Youtube', link: 'https://www.youtube.com/results?search_query=', modify: v => v.replace(/\s/g, '%20') }, // +
  ];

  const tv = [
    { site: 'IMDb', link: 'https://www.imdb.com/find?s=tt&q=', modify: v => v.replace(/\(.*\)/g, '%20') },
    { site: 'RT', link: 'https://www.rottentomatoes.com/search/?search=', modify: v => v.replace(/\(.*\)/g, '%20') },
  ];

  const formats = { film, album, tv };
</script>

<li class="ListEntry" id={title.split(' ').join('_').replace(/[\[\]]/)}>
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      <strong>{title}</strong>
      <ul class="ListEntry__links">
        {#each formats[format] as { site, link, modify }, i}
          {#if i !== 0}
          |
          {/if}
          <a href={`${link}${modify ? modify(title) : title}`} target="_blank">{site}</a>{' '}
        {/each}
      </ul>
    </div>
    <div class="ListEntry__stats">
      <Meter value={points} total={highestPoints} key="pts" />
      <Meter value={entry.firsts.length} total={mostFirsts} small icon="🏆" />
      <Meter value={entry.critics.length} total={mostLists} small icon="📋" />
    </div>
  </div>
</li>