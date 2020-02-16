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

  const getImdbDisplay = () => {
    const imdb = {
        site: 'IMDb', 
        icon: 'imdb.png',
    }
    if (data.imdb) {
      return {
        ...imdb,
        link: `https://www.imdb.com/title/${data.imdb.id}`,
        rating: data.imdb.rating,
        votes: data.imdb.votes,
      };
    }
    return {
      ...imdb,
      link: `https://www.imdb.com/find?s=tt&q=${data.title}`,
    };
  };

  const film = [
    getImdbDisplay(),
    {
      site: 'RT',
      link: `https://www.rottentomatoes.com/search/?search=${data.title}`,
      icon: 'rotten.png',
      rating: data.rotten,
    },
    {
      site: 'Letterboxd',
      link: `https://letterboxd.com/search/films/${data.title}`,
      icon: 'letterboxd.png'
    },
  ];
  if (data.metacritic) {
    film.push({
      site: 'MC',
      link: `https://www.metacritic.com/search/movie/${data.title}/results`,
      rating: data.metacritic,
      icon: 'metacritic.png',
    });
  }
</script>

<li class={`ListEntry ListEntry--${format}`} id={getIdFromName(title)}>
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      <strong>{title}</strong>
      <ul>
        <li>{data.runtime}min</li>
        <li>{data.country}</li>
      </ul>
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
  <div>
    <dl>
      <dt>Director</dt> <dd>{data.director}</dd>
      <dt>Cast</dt> <dd>{data.cast}</dd>
      <dt>Genre</dt> <dd>{data.genres}</dd>
      <dt>Language</dt> <dd>{data.language}</dd>
    </dl>
    <p>{data.plot}</p>
    <!-- <img src={data.poster&& data.poster.replace('300', '80')} /> -->
  </div>
  {JSON.stringify(data)}
</li>