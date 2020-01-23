<script>

  import Meter from './Meter.svelte';
  export let placement;
  export let title;
  export let entry;
  export let points;
  export let highestPoints;
  export let mostFirsts;
  export let mostLists;
  let listData = [];
  let yearData;
  let derivedData;

  const film = [
    { site: 'IMDb', link: 'https://imdb.com/search/' },
    { site: 'RT', link: 'https://rottentomatoes.com/search/' },
    { site: 'Letterboxd', link: 'https://letterboxd.com/search/' },
  ];

  const music = [
    { site: 'Spotify', link: '' },
  ]
</script>

<li class="ListEntry">
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      {title}
      <ul class="ListEntry__links">
        {#each film as { site, link }, i}
          {#if i !== 0}
          |
          {/if}
          <a href={`${link}/${title}`} target="_blank">{site}</a>{' '}
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