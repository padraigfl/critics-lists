<script>
  import { onMount, beforeUpdate, afterUpdate } from 'svelte';
  import axios from 'axios';
	import { push } from 'svelte-spa-router';
  import List from './List.svelte';
  import DataBlock from './DataBlock.svelte';
  import DataList from './DataList.svelte';
	import {
    formatList,
    deriveAdditionalDataFromProcessedList,
    processListsWithRankings,
  } from './analytics';
  import './styles.scss';
  import { year, format, scoringMatrix, loadingPage } from './store';
	export let params = params;
  $: listData = null;
  $: yearData = null;
  $: derivedData = null;
  let data;
  let fileName = `/data/${params.year}-${params.format}.json`;
  let matrix_value;
  let isLoading;
  
  $: fileName = `/data/${params.year}-${params.format}.json`;
	//onMount(()=>rolled=Math.floor(Math.random() * params.bound) + 1);
	//With the onMount instead of the assignment below, when you go from a die with 7 sides to one with 15 or vice-versa, it does not update rolled. With the function below, it does, but it does not re-roll if you route from the 7-sided die back to the 7-sided die.

	loadingPage.subscribe(value => {
		isLoading = value;
	});

  const processFile = (json) => {
    yearData = formatList(json, matrix_value);
    listData = processListsWithRankings(json, matrix_value);
    derivedData = deriveAdditionalDataFromProcessedList(listData, yearData);
    loadingPage.update(() => false);
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
    let resp;
    let json;
    try {
      resp = await fetch(fileName);
      json = await resp.json();
    } catch {
      push('/');
      return;
    }
    if (resp.ok) {
      window.localStorage.setItem(
        `${params.year}-${params.format}`,
        JSON.stringify(json),
      );
      window.localStorage.setItem('latest', Date.now());
      return processFile(json);
    } else {
      throw new Error('aaag');
    }
  };

  // $: data = getJsonData();
  afterUpdate(getJsonData, matrix_value);

	scoringMatrix.subscribe(value => {
    matrix_value = value;
    getJsonData();
	});

</script>


<svelte:head>
  <title>Critics Lists: {params.format} of {params.year}</title>
</svelte:head>
<div class="ListBreakdown">
  {#if yearData && listData && !isLoading}
    <DataList
      yearData={yearData}
      listData={listData}
    />
  {/if}
  {#if listData && listData.length && yearData && !isLoading}
    <List listData={listData} yearData={yearData} format={params.format} />
  {:else}
    Loading...
  {/if}
</div>