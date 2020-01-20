<script>
  import {onMount, beforeUpdate, afterUpdate } from 'svelte';
  import axios from 'axios';
  import List from './List.svelte';
  import DataBlock from './DataBlock.svelte';
  import DataList from './DataList.svelte';
	import {
    deriveAdditionalDataFromProcessedList,
    processListsWithRankings,
  } from './analytics';
  import './styles.scss';
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
      derivedData = deriveAdditionalDataFromProcessedList(listData, data);
		});
  }
  beforeUpdate(loadFile);
	
</script>

<div class="ListBreakdown">
  {#if derivedData && yearData && listData}
    <DataList
      derivedData={derivedData}
      yearData={yearData}
      listData={listData}
    />
  {/if}
  {#if listData.length && yearData}
    <List listData={listData} yearData={yearData} />
  {:else}
    Loading...
  {/if}
</div>