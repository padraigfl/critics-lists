<script>
  import Entry from './Entry.svelte';
  import { viewUninterested, viewKnown, viewInterested } from '../../store';
  export let listData;
  export let yearData;  
  export let format;
  export let year;
  let canSeeUninterested = false;
  let canSeeKnown = true;
  let canSeeInterested = true;

  viewUninterested.subscribe((val) => canSeeUninterested = val);
  viewKnown.subscribe((val) => canSeeKnown = val);
  viewInterested.subscribe((val) => canSeeInterested = val);

  // $: iterativeWorks = Object.entries(yearData.works);
  // $: mostFirsts = iterativeWorks.sort((a, b) => b[1].firsts.length - a[1].firsts.length)[0][0];
  // $: mostLists = iterativeWorks.sort((a, b) => b[1].critics.length - a[1].critics.length)[0][0];

  const getListName = (key) => `${key}_${format}_${year}`;

  const getLocalStorageList = (key, defaultValue = []) => {
    return JSON.parse(window.localStorage.getItem(getListName(key))) || defaultValue;
  }

  const setLocalStorageList = (key, value) => {
    return window.localStorage.setItem(getListName(key), JSON.stringify(value));
  }

  $: lists = ['interested', 'seen', 'uninterested'].reduce((acc, key) => ({
    ...acc,
    [key]: getLocalStorageList(key, key === 'interested' ? {} : []),
  }), {});

  const updateInterestedList = (e) => {
    const key = e.target.value;
    const oldList = getLocalStorageList('interested', {});
    if (oldList[key]) {
      delete oldList[key];
    } else {
      const val = listData.find(([id]) => id === key);
      if (val) {
        oldList[key] = val[1];
      }
    }
    console.log(oldList);
    setLocalStorageList(`interested`, oldList);
  }

  const updateBasicList = list => (e) => {
    const key = e.target.value;
    let tempList = getLocalStorageList(list);
    if (tempList.includes(key)) {
      setLocalStorageList(list, tempList.filter(v => v !== key));
    } else {
      setLocalStorageList(list, [...tempList, key]);
    }
  }

  const updateKnownList = updateBasicList('seen');
  const updateMehList = updateBasicList('uninterested');
  const update = {
    'interested': updateInterestedList,
    'seen': updateKnownList,
    'uninterested': updateMehList,
  };

</script>

<ol class="List">
  {#each listData as [ key, data ], i}
    {#if canSeeUninterested || !lists.uninterested.includes(key)}
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