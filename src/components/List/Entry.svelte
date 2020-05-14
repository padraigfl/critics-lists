<script>
  import { beforeUpdate } from 'svelte';
  import ListEntryDataPoint from './ListEntryDataPoint.svelte';
  import {getIdFromName} from '../../utils';
  export let placement;
  export let title;
  export let entry;
  export let points;

  export let format;
  export let data;
  export let displayAll;
  $: optionsVisible = false;
  $: extend = false; // TODO handle toggle of extra data
  $: hasData = data.director || data.cast || data.genre || data.language;

  const formatVoteCount = (count) => {
    if (count > 10 ** 6) {
      return (count / 10**6).toFixed(0) + 'M';
    }
    if (count > 10 ** 5) {
      return (count / 10**6).toFixed(1) + 'M';
    }
    if (count > 10 ** 3) {
      return  (count / 10 ** 3).toFixed(0) + 'K';
    }
    return `<1k`
  }

  const markAsUninterested = () => {
    const uninterested = JSON.parse(window.localStorage.getItem('uninterested') || '[]');
    window.localStorage.setItem(
      'uninterested',
      JSON.stringify(
        uninterested.includes(title)
          ? uninterested.filter(v => v !== title)
          : [...uninterested, title],
      ),
    );
  };

  const imdb = {
    site: 'IMDb', 
    icon: 'imdb.png',
  }

  
  const getFilm = () => ([
    data.imdb ? {
      ...imdb,
      link: `https://www.imdb.com/title/${data.imdb.id}`,
      text: data.imdb.rating ? `${data.imdb.rating && data.imdb.rating.toFixed(1)} (${formatVoteCount(data.imdb.votes)})` : undefined,
    } : {
      ...imdb,
      link: `https://www.imdb.com/find?s=tt&q=${title}`,
    },
    {
      site: 'RT',
      link: `https://www.rottentomatoes.com/search/?search=${title}`,
      icon: 'rotten.png',
      text: data.rotten ? data.rotten + '%' : '',
    },
    ...(data.metacritic ? [{
      site: 'MC',
      link: `https://www.metacritic.com/search/movie/${title}/results`,
      text: data.metacritic + '%',
      icon: 'metacritic--text.png',
    }] : []),
  ]);

  const album = [// need to remove by
    { site: 'Spotify', link: 'https://open.spotify.com/search/', icon: 'spotify.png', modify: v => v.replace(/\s/g, '%20').replace(/by/g, '') },// %20
    { site: 'Youtube', link: 'https://www.youtube.com/results?search_query=', icon: 'youtube.png', modify: v => v.replace(/\s/g, '%20') }, // +
    { site: 'RYM', link: 'https://rateyourmusic.com/search?searchtype=l&searchterm=', modify: v => v.replace(/\s/g, '+').replace(/by/g, '') } , // +
  ];

  const tv = [
    { site: 'IMDb', link: 'https://www.imdb.com/find?s=tt&q=', icon: 'imdb.png', modify: v => v.replace(/\(.*\)/g, '%20') },
    { site: 'RT', link: 'https://www.rottentomatoes.com/search/?search=', icon: 'rotten.png', modify: v => v.replace(/\(.*\)/g, '%20') },
  ];

  const mediaLinkSets = {
    film: getFilm(),
    album,
    tv,
  };

  const getFormat = format => mediaLinkSets[format] || [];

  $: links = getFormat(format);
  $: searches = [{
    site: 'Letterboxd',
    link: `https://letterboxd.com/search/films/${title}`,
    icon: 'letterboxd.png'
  }, {
    icon: 'google.png',
    site: 'Google',
    text: 'Google',
    link: `https://www.google.com/search?q=film+${title.replace(' ', '+').replace('&', '+and+')}`,
  }];

  const toggle = () => {
    extend = !extend;
  }
  const expand = () => { extend = true }

</script>

<li class={`Entry Entry--${format} ${!hasData ? 'Entry--no-data' : '' }`} id={getIdFromName(title)}>
  <div
    class="Entry__core"
  >
    <div class="Entry__placement">
      {placement}
      {#if hasData && !extend}
        <button class="Entry__display-details" on:click={expand}>
          🔽
        </button>
      {/if}
    </div>
    <div class="Entry__heading">
      <strong class="Entry__title">{title}</strong>
      {#if data.runtime || data.country}
        <div class="Entry__subtitle">
        ({data.runtime ? `${data.runtime}min${data.country ? '; ': ''}`: ''}{data.country ? data.country.join(', ') : ''})
        </div>
      {/if}
      <div class="Entry__links">
        {#each links as { site, link, modify, icon, text }, i}
          <a class={`ExternalLink ${ icon ? `ExternalLink--icon` : '' } ${site === 'IMDb' ? 'ExternalLink--imdb' : '' }`} href={link} target="_blank">
            {#if icon}
              <img class="ExternalLink__icon" src={`/icons/${icon}`} alt={site} />
            {:else}
              {site}
            {/if}
            {#if text}
              <span class="ExternalLink__extra-text">{text}</span>
            {/if} 
          </a>
        {/each}
        <!-- <button on:click={toggle}>
          {extend ? '<' : '>'}
        </button> -->
      </div>
    </div>
    <div class="Entry__points">
      <ListEntryDataPoint value={points} key="pts" />
      <ListEntryDataPoint value={entry.firsts.length} small icon="🏆" />
      <ListEntryDataPoint value={entry.critics.length} small icon="📋" />
      {#if hasData && data.awards}
        <ListEntryDataPoint value={data.awards.wins} small icon="W" />
        <ListEntryDataPoint value={data.awards.noms} small icon="N" />
      {/if}
    </div>
  </div>
  {#if (displayAll || extend) && hasData }
    <div class="Entry__extended">
      {#if data.poster}
        <img class="Entry__poster" src={data.poster.replace('X300', 'X70')} alt="" />
      {/if}
      <div class="Entry__options">
        <div>
          <input
            class="Entry__options"
            name={`${title}__uninterested`}
            type="checkbox"
            checked={JSON.parse(window.localStorage.getItem('uninterested') || '[]').includes(title)}
            on:change={markAsUninterested}
          />
          <lable for={`${title}__uninterested`}>Hide list</lable>
        </div>
        <div>
          <input
            class="Entry__options"
            name={`${title}__uninterested`}
            type="checkbox"
            checked={JSON.parse(window.localStorage.getItem('uninterested') || '[]').includes(title)}
            on:change={markAsUninterested}
          />
          <lable for={`${title}__uninterested`}>Watch list</lable>
        </div>
      </div>
      <ul class="Entry__details">
        <li class="Entry__details__data"><div>Director</div> <div>{data.director || 'N/A'}</div></li>
        <li class="Entry__details__data"><div>Cast</div> <div>{data.cast ? data.cast.join(', ') : 'N/A'}</div></li>
        <li class="Entry__details__data"><div>Genre</div> <div>{data.genre ? data.genre.join(', ') : 'N/A'}</div></li>
        <li class="Entry__details__data"><div>Language</div> <div>{data.language ? data.language.join(', ') : 'N/A'}</div></li>
        <!-- BROKEN ATM <dt>Awards</dt> <dd>{data.awards.wins} / {(data.awards.noms + data.awards.wins)}</dd> -->
      </ul>
      {#if data.plot && data.plot !== 'N/A' }
        <p><em>{data.plot}</em></p>
      {/if}
      <div class="Entry__links">
        {#each searches as { site, link, modify, icon, text }, i}
          <a class={`ExternalLink ${ icon ? `ExternalLink--icon` : '' } ${site === 'IMDb' ? 'ExternalLink--imdb' : '' }`} href={link} target="_blank">
            {#if icon}
              <img class="ExternalLink__icon" src={`/icons/${icon}`} alt={site} />
            {:else}
              {site}
            {/if}
            {#if text}
              <span class="ExternalLink__extra-text">{text}</span>
            {/if} 
          </a>
        {/each}
      </div>
        <!-- <button on:click={toggle}>
          {extend ? '<' : '>'}
        </button> -->
      <!-- <img src={data.poster&& data.poster.replace('300', '80')} /> -->
    </div>
  {/if}
</li>