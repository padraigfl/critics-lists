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
    viewUninterested, viewKnown, viewInterested, viewSingleEntries, viewStateless,
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
  let canSeeUninterested = true;
  let canSeeKnown = true;
  let canSeeInterested = true;
  let canSeeSingleEntries = true;
  let canSeeStateless = true;

  viewUninterested.subscribe((val) => canSeeUninterested = val);
  viewKnown.subscribe((val) => canSeeKnown = val);
  viewInterested.subscribe((val) => canSeeInterested = val);
  viewStateless.subscribe((val) => canSeeStateless = val);
  viewSingleEntries.subscribe((val) => canSeeSingleEntries = val);

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
    }
  })();

  const handlingFilters = () => {
    let iterativeList = fullList;
    Object.entries(filters ||{}).forEach(([key, val]) => {
      console.log(key, val)
      if (val && val !== 'All') {
        iterativeList = iterativeList.filter(v => v[1][key] && v[1][key].includes(val));
      }
    });
    let sorted = [...iterativeList.sort(objectEntriesSort(sortBy.key))];
    if (sortBy.invert) {
      sorted.reverse();
    }
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

  const getCsv = () => {
    if (format_value === ALBUM) {
      return null;
    }
    const dataEntries = [...document.querySelectorAll('.List .Entry')].filter(v => {
      if (v.computedStyleMap) {
        return v.computedStyleMap().get('display').value !== 'none'
      }
      return v.clientWidth;
    }).map((entryEl) => {
      const title = entryEl.querySelector('.Entry__title').textContent.replace(/\([^()]*\)$/, '').trim();
      const imdbEl = entryEl.querySelector('.ExternalLink--IMDb')
      const imdbID = imdbEl ? imdbEl.getAttribute('href').split('/').pop() : '';
      return {
        title,
        imdbID
      }
    });

    const url = 'imdbID,Title\n'
      + dataEntries
        .filter(({ title, imdbID }) => !!title && !!imdbID)
        .map(({ title, imdbID }) =>
          // remove TV network, year, or junk data added to names
          `${imdbID.trim()},${title.replace(/\([^()]*\)$/, '').trim()}`
        ).join('\n')
    return url;
  }

  $: downloadCSV = () => {
    debugger
    const csv = getCsv(listData);
    var downloadLink = document.createElement("a");
    var blob = new Blob(["\ufeff", csv]);
    var url = URL.createObjectURL(blob);
    downloadLink.href = url;

    downloadLink.download = `${format_value}-${params.year}-letterboxdList-${
      !canSeeUninterested ? 'hideUninterested-' : ''
    }${!canSeeKnown ? 'hideKnown-' : ''
    }${!canSeeInterested ? 'hideInterested-' : ''
    }${!canSeeStateless ? 'hideUnselected-' : ''
    }${!canSeeSingleEntries ? 'hideSingleEntries-' : ''
    }-${Object.entries(filters).map(([k, v]) => `${k}=${v}`).join('&')}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

</script>


<svelte:head>
  <title>Aggregated Year-End List: {params.format} of {params.year}</title>
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
      filters={filters}
      downloadCsv={downloadCSV}
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