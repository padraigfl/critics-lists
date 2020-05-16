<script>
  import { onMount, beforeUpdate, afterUpdate } from 'svelte';
  import axios from 'axios';
	import { push } from 'svelte-spa-router';
  import List from './List/List.svelte';
  import DataBlock from './DerivedData/DataBlock.svelte';
  import DataList from './DerivedData/DataList.svelte';
	import {
    formatList,
    deriveAdditionalDataFromProcessedList,
    processListsWithRankings,
    getListOfArrayValues,
  } from '../analytics';
  import '../styles.scss';
  import {
    year, filmData, format, scoringMatrix, loadingPage, filterOptions, ordering, filterSelections,
  } from '../store';
  import { objectEntriesSort, getValuesFromObject } from '../utils';
	export let params = params;
  let listData = null;
  let data;
  let fileName = `/data/${params.year}-${params.format}.json`;
  let matrix_value;
  let isLoading = true;
  let omdbData = {};
  let yearData = [];
  let fullList = [];
  let filters = {};
  let mostFirsts;
  let mostLists;
  let maxPoints;
  let sortBy;
  let format_value = params.format;

  const handlingFilters = () => {
    let iterativeList = fullList;
    Object.entries(filters ||{}).forEach(([key, val]) => {
      if (val && val !== 'All') {
        iterativeList = iterativeList.filter(v => v[1][key] && v[1][key].includes(val));
      }
    });
    return iterativeList.sort(objectEntriesSort(sortBy))
  }

  ordering.subscribe(val => {
    sortBy = val;
    if (listData) {
      listData = handlingFilters();
    }
  });
  filterSelections.subscribe(val => {
    if (listData) {
      filters = val;
      listData = handlingFilters();
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
      const resp = await fetch(`/filmdata/${year}film.json`);
      const films = await resp.json();
      filmData.update(() => films);
      return films;
    } catch (e) {
      filmData.update({});
      return {};
    }
  }

  const getOptions = (listData) => getListOfArrayValues(listData, ['genre', 'language', 'country']);

  const processFile = async (json) => {
    const filmss = await getFilmData(params.year);
    listData = await processListsWithRankings(json, filmss, matrix_value, objectEntriesSort(sortBy));
    fullList = listData;
    yearData = formatList(json, matrix_value);
    // getFilmData(params.year);
    return {
      yearData,
      listData,
    }
  }

  const getJsonData = async () => {
    if (params.format !== 'film') {
      ordering.update(() => 'score');
    }
    year.update(() => params.year);
    format.update(() => params.format);
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
      return processFile(json);
    } else {
      throw new Error('aaag');
    }
  };

  const processData = async () => {
    await getJsonData();
    listData = handlingFilters();
    loadingPage.update(() => false);
    filterOptions.update(() => ({
      film: getOptions(listData),
    }));
  }

  beforeUpdate(async () => {
    if (fileName !== `/data/${params.year}-${params.format}.json`) {
      fileName = `/data/${params.year}-${params.format}.json`;
      await processData();
    }
  });

	scoringMatrix.subscribe(async value => {
    matrix_value = value;
    await processData();
	});

</script>


<svelte:head>
  <title>Critics Lists: {params.format} of {params.year}</title>
</svelte:head>
<div class="ListBreakdown">
  {#if isLoading}
    <div class="ListBreakdown__loading">Loading...</div>
  {/if}
  {#if yearData && listData}
    <DataList
      yearData={yearData}
      listData={listData}
      format={params.format}
    />
  {/if}
  {#if listData && listData.length && yearData}
    <List listData={listData} yearData={yearData} format={params.format} year={params.year} />
  {:else if !isLoading}
    No results found
  {/if}
</div>