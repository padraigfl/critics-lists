<script>
  import Entry from './Entry.svelte';
  import { viewUninterested, viewKnown, viewInterested, viewSingleEntries, viewStateless } from '../../store';
  import {
    generateListUpdater,
    getLocalStorageList,
    customLists,
  } from '../../utils/general.js';
  export let listData;
  export let yearData;  
  export let format;
  export let year;
  let canSeeUninterested = true;
  let canSeeKnown = true;
  let canSeeInterested = true;
  let canSeeSingleEntries = true;
  let canSeeStateless = true;
  const updateLists = () => customLists.reduce((acc, role) => ({
    ...acc,
    [role]: getLocalStorageList(role, format, year),
  }), {});

  viewUninterested.subscribe((val) => canSeeUninterested = val);
  viewKnown.subscribe((val) => canSeeKnown = val);
  viewInterested.subscribe((val) => canSeeInterested = val);
  viewStateless.subscribe((val) => canSeeStateless = val);
  viewSingleEntries.subscribe((val) => canSeeSingleEntries = val);

  $: lists = updateLists(format, year);

  $: update = customLists.reduce((acc, role) => ({
    ...acc,
    [role]: (e) => {
      generateListUpdater(role, format, year, listData, yearData)(e);
    },
  }), {});

</script>

<ol
  class={
    `List${
      canSeeInterested ? '' : ' List--hide-interested'
    }${
      canSeeUninterested ? '' : ' List--hide-uninterested'
    }${
      canSeeKnown ? '' : ' List--hide-known'
    }${
      canSeeSingleEntries ? '' : ' List--hide-single-entries'
    }${
      canSeeStateless ? '' : ' List--hide-stateless'
    }`
  }
>
  {#each listData as [ key, data ], i}
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
      isKnown={lists.know.includes(key)}
      isInterested={lists.interested[key]}
      isUninterested={lists.uninterested[key]}
    />
  {/each}
</ol>