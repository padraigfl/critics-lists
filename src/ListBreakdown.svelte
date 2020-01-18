<script>
  import {onMount, beforeUpdate, afterUpdate } from 'svelte';
  import axios from 'axios';
  import List from './List.svelte';
	import { processListsWithRankings } from './analytics';
	export let params = params;
  let listData = [];
  let yearData;
  let derivedData;
	//onMount(()=>rolled=Math.floor(Math.random() * params.bound) + 1);
	//With the onMount instead of the assignment below, when you go from a die with 7 sides to one with 15 or vice-versa, it does not update rolled. With the function below, it does, but it does not re-roll if you route from the 7-sided die back to the 7-sided die.

  const loadFile = async () => {
    const fileName = `/data/${params.year}-${params.format}.json`;
		axios.get(fileName).then(({data}) => {
      yearData = data;
			listData = processListsWithRankings(
        data.critics
      );
      
		});
  }
  beforeUpdate(loadFile);
	
</script>
<style>
  .ListBreakdown {
    display: flex;
    flex: 1 1 0;
    max-height: 80vh;
    overflow: auto;
  }
  .ListBreakdown__details {
    width: 60%;
  }
</style>

<div class="ListBreakdown">
  {#if yearData}
    <div class="ListBreakdown__details">
      <div>
      Number of list: { Object.keys(yearData.critics).length}
      </div>
      <div>
      Number of unique entries: { Object.keys(yearData.works).length}
      </div>
      <div>
      Highest ranked with no number 1's
      </div>
      <div>
      Lowest ranked with number 1's
      </div>
      <div>
      Highest ranked pair that are in no lists together
      </div>
      <div>
      Only in one list
      </div>
      <div>
      Most contrarian critic (lowest points for overall list)
      </div>
      <div>
      Most contrarian critic with &lt;4 unique entries
      </div>
    </div>
  {/if}
  <div class="ListBreakdown__list">
    {#if listData.length}
      <List listData={listData} yearData={yearData} />
    {:else}
      Loading...
    {/if}
  </div>
</div>