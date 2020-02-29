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
    getListOfArrayValues,
  } from './analytics';
  import './styles.scss';
  import { year, filmData, format, scoringMatrix, loadingPage, filterOptions, ordering, filterSelections } from './store';
	export let params = params;
  let listData = null;
  let data;
  let fileName = `/data/${params.year}-${params.format}.json`;
  let matrix_value;
  let isLoading;
  let omdbData = {};
  let yearData = [];
  let fullList = [];
  let filters = {};
  let mostFirsts;
  let mostLists;
  let maxPoints;
  let orderFunc = params.format === 'film' ? (val) => val.score : undefined;
  let format_value = params.format;

  const handlingFilters = () => {
    let iterativeList = fullList;
    Object.entries(filters ||{}).forEach(([key, val]) => {
      if (val && val !== 'All') {
        iterativeList = iterativeList.filter(v => v[1][key] && v[1][key].includes(val));
      }
    });
    return iterativeList.sort(([,a], [,b]) => ((orderFunc(b) || 0) - orderFunc(a) ||0))
  }

  ordering.subscribe(val => {
    orderFunc = val;
    if (listData) {
      listData = handlingFilters();
    }
  });
  filterSelections.subscribe(val => {
    if (listData) {
      filters = val;
      listData = handlingFilters();
      console.log(listData)
    }
  });
  
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
      console.log(year);
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

  const getOptions = (listData) => getListOfArrayValues(listData, ['genres', 'language', 'country']);

  const processFile = async (json) => {
    const filmss = await getFilmData(params.year);
    listData = processListsWithRankings(json, filmss, matrix_value, orderFunc);
    fullList = listData;
    yearData = formatList(json, matrix_value);
    loadingPage.update(() => false);
    // getFilmData(params.year);
    return {
      yearData,
      listData,
    }
  }

  const getJsonData = async () => {
    if (params.format !== 'film') {
      ordering.update(() => (val) => val.score);
    }
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

  beforeUpdate(async () => {
    if (fileName !== `/data/${params.year}-${params.format}.json`) {
      fileName = `/data/${params.year}-${params.format}.json`;
      await getJsonData();
      filterOptions.update(() => ({
        film: getOptions(listData),
      }));
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
      format={params.format}
    />
  {/if}
  {#if listData && listData.length && yearData && !isLoading}
    <List listData={listData} yearData={yearData} format={params.format} />
  {:else}
    Loading...
  {/if}
</div>