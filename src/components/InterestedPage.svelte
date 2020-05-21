<script>
  import { OPTIONS } from '../store';
  import InterestedCard from './InterestedCard/InterestedCard.svelte';
  import {
    getLocalStorageList,
  } from '../utils';
  export let format = 'film';
  let allInterested = {};

  OPTIONS.years.forEach((year) => {
    allInterested[year] = getLocalStorageList('interested', format, year);
  });

  const flattened = Object.entries(allInterested).reduce((acc, [year, data]) => {
    return {
      ...acc,
      ...data,
    }
  }, {});
</script>
{#if Object.keys(flattened).length === 0}
  You haven't added anything to your {format} list.
{:else}
  <ul class="InterestedList">
    {#each Object.entries(flattened) as [ key, data ], i}
      <InterestedCard
        title={key}
        format={format}
        data={data}
        year={data.listYear || data.year}
      />
    {/each}
  </ul>
{/if}