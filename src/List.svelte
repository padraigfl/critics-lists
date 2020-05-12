<script>
  import ListEntry from './ListEntry.svelte';
  import FilmListEntry from './FilmListEntry.svelte';
  import { viewUninterested } from './store';
  export let listData;
  export let yearData;  
  export let format;
  let canSeeUninterested = false;

  viewUninterested.subscribe((val) => canSeeUninterested = val);
  // $: iterativeWorks = Object.entries(yearData.works);
  // $: mostFirsts = iterativeWorks.sort((a, b) => b[1].firsts.length - a[1].firsts.length)[0][0];
  // $: mostLists = iterativeWorks.sort((a, b) => b[1].critics.length - a[1].critics.length)[0][0];

  const getUninterestedList = () => {
    return JSON.parse(window.localStorage.getItem('uninterested') || '[]')
  }

  $: Entry = format === 'film' ? FilmListEntry : ListEntry;
</script>

<ol class="List">
  {#each listData as [ key, data ], i}
    {#if canSeeUninterested || !getUninterestedList().includes(key)}
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
    {/if}
  {/each}
</ol>