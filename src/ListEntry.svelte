<script>

  import Meter from 'meter';
  export let placement;
  export let title;
  export let entry;
  export let highestPoints;
  export let mostFirsts;
  export let mostLists;
  let listData = [];
  let yearData;
  let derivedData;
</script>

<li>
  <div>{placement}</div>
  <div>{title}</div>
  <div>{entry.points}</div>
  <div>{entry.critics.length}</div>
  <div>{entry.firsts.length}</div>
  <Meter value={entry.points} total={highestPoints} />
  <Meter value={entry.critics.length} total={mostLists} />
  <Meter value={entry.firsts.length} total={mostFirsts} />
  <ul>
    {#each ['imdb', 'letterboxd', 'rottentomoatoes'] as site}
      <a href={`${site}/search/${title}`} target="_blank">{site}</a>
    {/each}
  </ul>
</li>