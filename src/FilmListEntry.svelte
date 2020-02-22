<script>
  import { beforeUpdate } from 'svelte';
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
  export let data;
  export let displayAll;
  $: extend = displayAll || true; // TODO handle toggle of extra data
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

  const imdb = {
    site: 'IMDb', 
    icon: 'imdb.png',
  }


  $: film = [
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
    {
      site: 'Letterboxd',
      link: `https://letterboxd.com/search/films/${title}`,
      icon: 'letterboxd.png'
    },
  ];

  const toggle = () => {
    extend = !extend;
  }
</script>

<li class={`ListEntry ListEntry--${format}`} id={getIdFromName(title)}>
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      <strong>{title}</strong>
      {#if data.runtime || data.country}
        ({data.runtime ? `${data.runtime}min${data.country ? '; ': ''}`: ''}{data.country ? data.country.join(', ') : ''})
      {/if}
      <div class="ListEntry__links">
        {#each film as { site, link, modify, icon, text }, i}
          <a class={icon ? 'ListEntry__link ListEntry__link--icon' : 'ListEntry__link'} href={link} target="_blank">
            {#if icon}
              <img class="ListEntry__icon" src={`/icons/${icon}`} alt={site} />
            {:else}
              {site}
            {/if}
            {#if text}
              <span class="ListEntry__extra-text">{text}</span>
             {/if} 
          </a>
          {#if i < film.length - 1}
            {' | '}
          {/if}
        {/each}
        <!-- <button on:click={toggle}>
          {extend ? '<' : '>'}
        </button> -->
      </div>
    </div>
    <div class="ListEntry__stats">
      <Meter value={points} total={highestPoints} key="pts" />
      <Meter value={entry.firsts.length} total={mostFirsts} small icon="🏆" />
      <Meter value={entry.critics.length} total={mostLists} small icon="📋" />
    </div>
  </div>
  {#if extend && hasData }
    <div class="ListEntry__extended">
      <ul class="ListEntry__details">
        <li class="ListEntry__details__data"><div>Director</div> <div>{data.director || 'N/A'}</div></li>
        <li class="ListEntry__details__data"><div>Cast</div> <div>{data.cast ? data.cast.join(', ') : 'N/A'}</div></li>
        <li class="ListEntry__details__data"><div>Genre</div> <div>{data.genres ? data.genres.join(', ') : 'N/A'}</div></li>
        <li class="ListEntry__details__data"><div>Language</div> <div>{data.language ? data.language.join(', ') : 'N/A'}</div></li>
        <!-- BROKEN ATM <dt>Awards</dt> <dd>{data.awards.wins} / {(data.awards.noms + data.awards.wins)}</dd> -->
      </ul>
      {#if data.plot && data.plot !== 'N/A' }
        <p><em>{data.plot}</em></p>
      {/if}
      <!-- <img src={data.poster&& data.poster.replace('300', '80')} /> -->
    </div>
  {/if}
</li>