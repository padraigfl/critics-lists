<script>
  import Entry from './Entry.svelte';
  import { viewUninterested, viewKnown, viewInterested } from '../../store';
  import {
    generateListUpdater,
    getLocalStorageList,
    customLists,
  } from '../../utils.js';
  export let listData;
  export let yearData;  
  export let format;
  export let year;
  let canSeeUninterested = false;
  let canSeeKnown = true;
  let canSeeInterested = true;
  const updateLists = () => customLists.reduce((acc, role) => ({
    ...acc,
    [role]: getLocalStorageList(role, format, year),
  }), {});

  viewUninterested.subscribe((val) => canSeeUninterested = val);
  viewKnown.subscribe((val) => canSeeKnown = val);
  viewInterested.subscribe((val) => canSeeInterested = val);

  let lists = updateLists();

  $: update = customLists.reduce((acc, role) => ({
    ...acc,
    [role]: (e) => {
      generateListUpdater(role, format, year, listData, yearData)(e);
      lists = updateLists();
    },
  }), {});

</script>

<ol class="List">
  {#each listData as [ key, data ], i}
    {#if !lists
      || (
        (canSeeUninterested || !lists.uninterested.includes(key))
        && (canSeeKnown || !lists.know.includes(key))
        && (canSeeInterested || !lists.interested[key])
      )
    }
      <Entry
        placement={i+1}
        title={key}
        points={data.score}
        entry={yearData.works[key]}
        format={format}
        data={data}
        displayAll={false}
        update={update}
        lists={lists}
      />
    {/if}
  {/each}
</ol>