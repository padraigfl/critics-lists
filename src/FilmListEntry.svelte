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
  export let data;

  const film = [
    { 
      site: 'IMDb', 
      link: (
        data.imdb ?
          `https://www.imdb.com/title/${data.imdb.id}`
          : `https://www.imdb.com/find?s=tt&q=${data.title}`
      ),
      icon: 'imdb.png',
    },
    {
      site: 'RT',
      link: `https://www.rottentomatoes.com/search/?search=${data.title}`,
      icon: 'rotten.png',
    },
    {
      site: 'Letterboxd',
      link: `https://letterboxd.com/search/films/${data.title}`,
      icon: 'letterboxd.png'
    },
  ];
</script>

<li class={`ListEntry ListEntry--${format}`} id={getIdFromName(title)}>
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      <strong>{title}</strong>
      <ul class="ListEntry__links">
        {#each film as { site, link, modify, icon }, i}
          <a class={icon ? 'ListEntry__link--icon' : 'ListEntry__link'} href={link} target="_blank">
            {#if icon}
              <img class="ListEntry__icon" src={`/icons/${icon}`} alt={site} />
            {:else}
              {site}
            {/if}
          </a>{' '}
        {/each}
      </ul>
    </div>
    <div class="ListEntry__stats">
      <Meter value={points} total={highestPoints} key="pts" />
      <Meter value={entry.firsts.length} total={mostFirsts} small icon="🏆" />
      <Meter value={entry.critics.length} total={mostLists} small icon="📋" />
    </div>
  </div>
  {JSON.stringify(data)}
</li>