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

  const getImdbDisplay = () => {
    const imdb = {
        site: 'IMDb', 
        icon: 'imdb.png',
    }
    if (data.imdb) {
      return {
        ...imdb,
        link: `https://www.imdb.com/title/${data.imdb.id}`,
        text: `${data.imdb.rating} (${formatVoteCount(data.imdb.votes)})`,
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
      text: data.rotten + '%',
    },
    {
      site: 'Letterboxd',
      link: `https://letterboxd.com/search/films/${data.title}`,
      icon: 'letterboxd.png'
    },
  ];
  if (data.metacritic) {
    film.splice(2, 0, {
      site: 'MC',
      link: `https://www.metacritic.com/search/movie/${data.title}/results`,
      text: data.metacritic + '%',
      icon: 'metacritic.png',
    });
  }
</script>

<li class={`ListEntry ListEntry--${format}`} id={getIdFromName(title)}>
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      <strong>{title}</strong>
      ({data.runtime}min; {data.country})
      <div class="ListEntry__links">
        {#each film as { site, link, modify, icon, text }, i}
          <a class={icon ? 'ListEntry__link ListEntry__link--icon' : 'ListEntry__link'} href={link} target="_blank">
            {#if icon}
              <img class="ListEntry__icon" src={`/icons/${icon}`} alt={site} />
            {:else}
              {site}
            {/if}
            {#if text}
              <span>{text}</span>
             {/if} 
          </a>
          {#if i < film.length - 1}
            {' | '}
          {/if}
        {/each}
      </div>
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
      <!-- BROKEN ATM <dt>Awards</dt> <dd>{data.awards.wins} / {(data.awards.noms + data.awards.wins)}</dd> -->
    </dl>
    <p>{data.plot}</p>
    <!-- <img src={data.poster&& data.poster.replace('300', '80')} /> -->
  </div>
</li>