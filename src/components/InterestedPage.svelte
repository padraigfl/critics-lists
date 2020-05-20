<script>
  import { OPTIONS } from '../store';
  import Entry from './List/Entry.svelte';
  export let format = 'film';
  

  const allInterested = OPTIONS.years.reduce((acc, val) => {
      const currentYear = window.localStorage.getItem(`interested_${format}_${val}`);
      if (currentYear) {
        return {
          ...acc,
          ...JSON.parse(currentYear),
        };
      }
      return acc;
    }, {});

</script>

<ol class="List">
  {#each Object.entries(allInterested) as [ key, data ], i}
    <Entry
      placement={i+1}
      title={key}
      points={data.score}
      format={format}
      data={data}
      displayAll={false}
      entry={{ firsts: [], critics: []}}
    />
  {/each}
</ol>