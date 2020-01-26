<script>
  import { beforeUpdate } from 'svelte';
  import DataBlock from './DataBlock.svelte';
	import {
    deriveAdditionalDataFromProcessedList,
  } from './analytics';
  export let yearData;
  export let listData;
  let derivedData;

  let dataList = [];
  
  const getDerivedData = () => {
    derivedData = deriveAdditionalDataFromProcessedList(listData, yearData);
    dataList = [
      { title: '# Lists aggregated:', data: Object.keys(yearData.critics).length },
      // { title: '# Publications', data: yearData.publications },
      { title: '# Unique entries', data: Object.keys(yearData.works).length },
      { title: 'Highest ranked with no #1', data: derivedData.biggestLoser },
      {
        title: 'Lowest ranked with a #1',
        data: derivedData.smallestWinner,
        validator: {
          text: 'Omitting entries in <3 lists',
          data: derivedData.smallestWinnerValidator,
        },
      },
      { title: 'Highest ranked pair that share no lists', data: derivedData.divisivePair },
      {
        title: 'Most contrarian critic (lowest points for overall list)',
        data: derivedData.mostContrarianCritic.name,
        descriptors: `with ${ derivedData.mostContrarianCritic.score }
    against an average of ${ (derivedData.mostContrarianCritic.totalVal / (Object.keys(yearData.critics).length)).toFixed(1)}`,
        validator: {
          text: 'Omitting lists with 3+ unique entries',
          data: derivedData.mostContrarianCriticValidator.name,
          descriptors: `with ${ derivedData.mostContrarianCriticValidator.score }
    against an average of ${ (derivedData.mostContrarianCriticValidator.totalVal / (Object.keys(yearData.critics).length)).toFixed(1)}`
        },
      },
      // { title: 'Data Source', data: yearData.source }
    ];
  }
  beforeUpdate(getDerivedData);

</script>

<dl class="DataList">
  {#each dataList as entry
  }
    <DataBlock
      entry={entry}
    />
  {/each}
</dl>