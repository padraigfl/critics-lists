<script>

  import Meter from './Meter.svelte';
  import {getIdFromName} from './utils';
  export let placement;
  export let title;
  export let entry;
  export let points;
  export let highestPoints;
  export let mostFirsts;
  export let mostLists;
  export let format;

  const film = [
    { site: 'IMDb', link: 'https://www.imdb.com/find?s=tt&q=', icon: 'imdb.png' },
    { site: 'RT', link: 'https://www.rottentomatoes.com/search/?search=', icon: 'rotten.png' },
    { site: 'Letterboxd', link: 'https://letterboxd.com/search/films/', icon: 'letterboxd.png' },
  ];

  const album = [// need to remove by
    { site: 'Spotify', link: 'https://open.spotify.com/search/', icon: 'spotify.png', modify: v => v.replace(/\s/g, '%20').replace(/by/g, '') },// %20
    { site: 'Youtube', link: 'https://www.youtube.com/results?search_query=', icon: 'youtube.png', modify: v => v.replace(/\s/g, '%20') }, // +
    { site: 'RYM', link: 'https://rateyouralbum.com/search?searchtype=l&searchterm=', modify: v => v.replace(/\s/g, '+').replace(/by/g, '') } , // +
  ];

  const tv = [
    { site: 'IMDb', link: 'https://www.imdb.com/find?s=tt&q=', icon: 'imdb.png', modify: v => v.replace(/\(.*\)/g, '%20') },
    { site: 'RT', link: 'https://www.rottentomatoes.com/search/?search=', icon: 'rotten.png', modify: v => v.replace(/\(.*\)/g, '%20') },
  ];

  const formats = { film, album, tv };
</script>

<li class={`ListEntry ListEntry--${format}`} id={getIdFromName(title)}>
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      {#if format === 'album'}
        <strong>
          {title.split(' by ')[0]}
        </strong>
        <div>{title.split(' by ')[1]}</div>
      {:else}
        <strong>{title}</strong>
      {/if}
      <div class="ListEntry__links">
        {#each formats[format] as { site, link, modify, icon }, i}
            <a class={icon ? 'ListEntry__link ListEntry__link--icon' : 'ListEntry__link'} href={`${link}${modify ? modify(title) : title}`} target="_blank">
              {#if icon}
                <img class="ListEntry__icon" src={`/icons/${icon}`} alt={site} />
              {:else}
                {site}
              {/if}
            </a>
        {/each}
      </div>
    </div>
    <div class="ListEntry__stats">
      <Meter value={points} total={highestPoints} key="pts" />
      <Meter value={entry.firsts.length} total={mostFirsts} small icon="🏆" />
      <Meter value={entry.critics.length} total={mostLists} small icon="📋" />
    </div>
  </div>
</li>