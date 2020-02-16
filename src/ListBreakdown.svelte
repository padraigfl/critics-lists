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
  import { year, filmData, format, scoringMatrix, loadingPage } from './store';
	export let params = params;
  let listData = null;
  let data;
  let fileName = `/data/${params.year}-${params.format}.json`;
  let matrix_value;
  let isLoading;
  let omdbData = {};
  let yearData = {};
  
	//onMount(()=>rolled=Math.floor(Math.random() * params.bound) + 1);
	//With the onMount instead of the assignment below, when you go from a die with 7 sides to one with 15 or vice-versa, it does not update rolled. With the function below, it does, but it does not re-roll if you route from the 7-sided die back to the 7-sided die.

	loadingPage.subscribe(value => {
		isLoading = value;
  });

  filmData.subscribe(value => {
    omdbData = value;
  });

  const getFilmData = async (year) => {
    try {
      const resp = await fetch(`/filmdata/${year}film.json`);
      const films = await resp.json();
      filmData.update(() => films);
      return films;
    } catch (e) {
      console.log(e);
      filmData.update({});
      return {};
    }
  }

  const processFile = async (json) => {
    const filmss = await getFilmData(params.year);
    listData = processListsWithRankings(json, filmss, matrix_value);
    yearData = formatList(json, matrix_value);
    loadingPage.update(() => false);
    getFilmData(params.year);
    return {
      yearData,
      listData,
    }
  }

  const getJsonData = async () => {
    year.update(() => params.year);
    format.update(() => params.format);
    const localStorageItem = `${params.year}-${params.format}`;
    const priorData = window.localStorage.getItem(localStorageItem);
    if (priorData) {
      return processFile(JSON.parse(priorData));
    }
    let resp;
    let json;
    let films = {};
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

  // getJsonData();

  beforeUpdate(() => {
    if (fileName !== `/data/${params.year}-${params.format}.json`) {
      fileName = `/data/${params.year}-${params.format}.json`;
      getJsonData();
    }
  });

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
    <List listData={listData} yearData={yearData} format={params.format} omdbData={omdbData} />
  {:else}
    Loading...
  {/if}
</div>