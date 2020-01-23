<script>
  import ListEntry from './ListEntry.svelte';
  export let listData;
  export let yearData;  
  $: iterativeWorks = Object.entries(yearData.works);
  $: mostFirsts = iterativeWorks.sort((a, b) => b[1].firsts.length - a[1].firsts.length)[0][0];
  $: mostLists = iterativeWorks.sort((a, b) => b[1].critics.length - a[1].critics.length)[0][0];
</script>

<ol class="List">
  {#each listData as [ key, points ], i}
    <ListEntry
      placement={i+1}
      title={key}
      points={points}
      entry={yearData.works[key]}
      highestPoints={listData[0][1]}
      mostLists={yearData.works[mostLists].critics.length}
      mostFirsts={yearData.works[mostFirsts].firsts.length}
    />
  {/each}
</ol>