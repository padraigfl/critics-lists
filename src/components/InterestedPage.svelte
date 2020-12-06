<script>
  import {beforeUpdate} from 'svelte';
	import { push } from 'svelte-spa-router';
  import { OPTIONS, FORMATS } from '../utils/constants';
  import { year, format, filterOptions, filterSelections, ordering } from '../store';
  import InterestedCard from './InterestedCard/InterestedCard.svelte';
  import {
    getLocalStorageList,
    objectEntriesSort,
    hasNestedValue,
  } from '../utils/general';
  import {
    getListOfArrayValues,
  } from '../analytics';
  export let params;
  let allInterested = {};
  let filteredList = {};
  let filters = {};
  let sortBy;
  let currentFormat = params.format;

  $: (() => {
    if (!FORMATS.includes(params.format)) {
      push('/error?format=true');
    }
  })();


  const handlingFilters = (fullList) => {
    let iterativeList = fullList;
    Object.entries(filters ||{}).forEach(([key, val]) => {
      if (val && val !== 'All') {
        iterativeList = iterativeList.filter(v => v[1][key] && v[1][key].includes(val));
      }
    });
    let sorted = [...iterativeList.sort(objectEntriesSort(sortBy.key))]
    if (sortBy.invert) {
      sorted = sorted.reverse();
    }
    return sorted.filter(v => hasNestedValue(v, sortBy.key));
  }

  OPTIONS.years.forEach((year) => {
    allInterested[year] = getLocalStorageList('interested', params.format, year);
  });
  let flattened = Object.entries(
    Object.entries(allInterested).reduce((acc, [year, data]) => {
      return {
        ...acc,
        ...data,
      }
    }, {})
  );

  const getOptions = data => getListOfArrayValues(data, ['genre', 'language', 'country']);


  ordering.subscribe(val => {
    sortBy = val;
    if (filteredList) {
      filteredList = handlingFilters(flattened);
    }
  });
  filterSelections.subscribe(val => {
    if (filteredList) {
      filters = val;
      filteredList = handlingFilters(flattened);
    }
  });

  year.update(() => 'List');
  format.update(() => params.format);
  if (!['release', 'runtime'].includes(sortBy.key)) {
    ordering.update(() => ({ key: 'release'}));
  }
  filteredList = handlingFilters(flattened, params);
  if (params.format === 'film') {
    filterOptions.update(() => ({
      film: getOptions(filteredList),
    }));
  }

  beforeUpdate(() => {
    // @todo hack hack hack hack, resolve
    if (currentFormat && params.format !== currentFormat) {
      currentFormat = params.format;
      window.location.reload();
    }
  })
</script>
{#if filteredList.length === 0}
  <div style="margin-top: 50vh; transform: translateY(-50%); text-align: center;">
    You haven't added anything to your {currentFormat} list. Please check the home page to
    by clicking <img src="/icons/list-add.svg" alt="interested icon" style="margin-bottom:-5px;" /> you add that entry to this list
  </div>
{:else}
  <ul class="InterestedList">
    {#each filteredList as [ key, data ], i}
      <InterestedCard
        title={key}
        format={currentFormat}
        data={data}
        year={data.listYear || data.year}
      />
    {/each}
  </ul>
{/if}