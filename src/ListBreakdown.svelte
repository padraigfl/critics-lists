<script>
  import { onMount, beforeUpdate, afterUpdate } from 'svelte';
  import axios from 'axios';
  import List from './List.svelte';
  import DataBlock from './DataBlock.svelte';
  import DataList from './DataList.svelte';
	import {
    formatList,
    deriveAdditionalDataFromProcessedList,
    processListsWithRankings,
  } from './analytics';
  import './styles.scss';
	export let params = params;
  let listData = [];
  let yearData;
  let derivedData;
  let data;
  let fileName = `/data/small/${params.year}-${params.format}.json`;
  
  $: fileName = `/data/small/${params.year}-${params.format}.json`;
	//onMount(()=>rolled=Math.floor(Math.random() * params.bound) + 1);
	//With the onMount instead of the assignment below, when you go from a die with 7 sides to one with 15 or vice-versa, it does not update rolled. With the function below, it does, but it does not re-roll if you route from the 7-sided die back to the 7-sided die.

  const processFile = (json) => {
    $: yearData = formatList(json);
    $: listData = processListsWithRankings(json);
    $: derivedData = deriveAdditionalDataFromProcessedList(listData, yearData);
    return {
      yearData,
      listData,
      derivedData,
    }
  }

  const getJsonData = async () => {
    const localStorageItem = `${params.year}-${params.format}`;
    const priorData = window.localStorage.getItem(localStorageItem);
    if (priorData) {
      return processFile(JSON.parse(priorData));
    }
    const resp = await fetch(fileName);
    const json = await resp.json();
    if (resp.ok) {
      window.localStorage.setItem(
        `${params.year}-${params.format}`,
        JSON.stringify(json),
      );
      return processFile(json);
    } else {
      throw new Error('aaag');
    }
  };

  // $: data = getJsonData();
  afterUpdate(getJsonData);
	
</script>

<div class="ListBreakdown">
  {#if derivedData && yearData && listData}
    <DataList
      derivedData={derivedData}
      yearData={yearData}
      listData={listData}
    />
  {/if}
  {#if listData.length && yearData}
    <List listData={listData} yearData={yearData} />
  {:else}
    Loading...
  {/if}
</div>