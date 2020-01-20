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
</script>

<li class="ListEntry">
  <div class="ListEntry__data">
    <div class="ListEntry__placement">{placement}</div>
    <div class="ListEntry__title">
      {title}
      <ul>
        {#each ['imdb', 'letterboxd', 'rottentomoatoes'] as site}
          <a href={`${site}/search/${title}`} target="_blank">{site}</a>
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