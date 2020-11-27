<script>
  import { onMount, beforeUpdate, afterUpdate } from 'svelte';
  import axios from 'axios';
	import { push } from 'svelte-spa-router';
  import List from './List/List.svelte';
  import DataBlock from './DerivedData/DataBlock.svelte';
  import DataList from './DerivedData/DataList.svelte';
	import {
    formatList,
    processListsWithRankings,
    getListOfArrayValues,
    SCORING_MATRICES,
  } from '../analytics';
  import '../styles.scss';
  import {
    year, mediaData, format, scoringMatrix, loadingPage, filterOptions, ordering, filterSelections,
  } from '../store';
  import { objectEntriesSort, hasNestedValue } from '../utils/general';
  import { FILM, ALBUM, FORMATS, YEARS } from '../utils/constants';
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
  let paramError; 

  $: (() => {
    let errors = [];
    if(params.format && !FORMATS.includes(params.format)) {
      errors.push('format=true');
    }
    if (params.year && !YEARS.includes(params.year)) {
      errors.push('year=true');
    }

    if (errors.length) {
      paramError = true;
      push(`/error?${errors.join('&')}`);
    } else {
      console.log('no errors');
    }
  })();

  const handlingFilters = () => {
    let iterativeList = fullList;
    Object.entries(filters ||{}).forEach(([key, val]) => {
      if (val && val !== 'All') {
        iterativeList = iterativeList.filter(v => v[1][key] && v[1][key].includes(val));
      }
    });
    let sorted = [...iterativeList.sort(objectEntriesSort(sortBy.key))];
    if (sortBy.invert) {
      sorted.reverse();
    }
    console.log(sorted);
    return sorted.filter(v => hasNestedValue(v, sortBy.key));
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

  mediaData.subscribe(value => {
    omdbData = value;
  });

  const getMediaData = async (year) => {
    try {
      const resp = await fetch(`/${params.format}/${year}data.json`);
      const data = await resp.json();
      mediaData.update(() => data);
      return data;
    } catch (e) {
      mediaData.update({});
      return {};
    }
  }

  const getOptions = (listData) => getListOfArrayValues(listData, ['genre', 'language', 'country']);

  const processFile = async (json) => {
    const media = await getMediaData(params.year);
    listData = await processListsWithRankings(json, media, matrix_value, objectEntriesSort(sortBy.key), params.format);
    fullList = listData;
    yearData = formatList(json, matrix_value);
    // getMediaData(params.year);
    return {
      yearData,
      listData,
    }
  }

  const getJsonData = async () => {
    if (params.format !== FILM) {
      ordering.update(() => ({ key: 'score' }));
    }
    year.update(() => params.year);
    format.update(() => params.format);
    let resp;
    let json;
    let films = {};
    if (paramError) {
      return;
    }
    try {
      resp = await fetch(fileName);
      json = await resp.json();
    } catch {
      push('/errors?requestFailure=true');
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
      [params.format]: getOptions(listData),
    }));
  }

  beforeUpdate(async () => {
    if (fileName !== `/data/${params.year}-${params.format}.json`) {
      fileName = `/data/${params.year}-${params.format}.json`;
      await processData();
    }
  });

	scoringMatrix.subscribe(async value => {
    matrix_value = SCORING_MATRICES[value];
    await processData();
	});

</script>


<svelte:head>
  <title>Critics Lists: {params.format} of {params.year}</title>
</svelte:head>
<div class={`ListBreakdown ${params.format}`}>
  {#if isLoading}
    <div class="ListBreakdown__loading">Loading...</div>
  {/if}
  {#if yearData && listData}
    <DataList
      yearData={yearData}
      listData={listData}
      format={params.format}
      year={params.year}
    />
  {/if}
  {#if listData && listData.length && yearData}
    <List listData={listData} yearData={yearData} format={params.format} year={params.year} />
  {:else if !isLoading}
    <div class="List">
      No results found (most likely reason if you have more than one filter enabled: filter counts represent the overall list)
    </div>
  {/if}
</div>