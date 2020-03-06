<script>
  import ListEntry from './ListEntry.svelte';
  import FilmListEntry from './FilmListEntry.svelte';
  export let listData;
  export let yearData;  
  export let format;
  // $: iterativeWorks = Object.entries(yearData.works);
  // $: mostFirsts = iterativeWorks.sort((a, b) => b[1].firsts.length - a[1].firsts.length)[0][0];
  // $: mostLists = iterativeWorks.sort((a, b) => b[1].critics.length - a[1].critics.length)[0][0];

  $: Entry = format === 'film' ? FilmListEntry : ListEntry;
</script>

<ol class="List">
  {#each listData as [ key, data ], i}
    <Entry
      placement={i+1}
      title={key}
      points={data.score}
      entry={yearData.works[key]}
      format={format}
      {...(
        format === 'film' ? {
          data,
          displayAll: false,
        } : {}
      )}
    />
  {/each}
</ol>