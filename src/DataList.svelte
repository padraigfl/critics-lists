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
      { title: 'Number of list:', data: Object.keys(yearData.critics).length },
      { title: 'Number of unique entries: ', data: Object.keys(yearData.works).length },
      { title: 'Highest ranked with no number 1\'s', data: derivedData.biggestLoser },
      { title: 'Lowest ranked with number 1\'s', data: derivedData.smallestWinner },
      { title: 'Lowest ranked with number 1 (and more than one nomination)', data: derivedData.smallestWinnerValidator },
      { title: 'Highest ranked pair that are in no lists together', data: derivedData.divisivePair },
      { title: 'Most contrarian critic (lowest points for overall list) ', data: ` ${ derivedData.mostContrarianCritic.name} with ${ derivedData.mostContrarianCritic.score }
    against an average of ${ derivedData.mostContrarianCritic.totalVal / (Object.keys(yearData.critics).length)}`  },
      { title: 'Most contrarian critic with &lt;4 unique entries', data: ` ${ derivedData.mostContrarianCriticValidator.name} with ${ derivedData.mostContrarianCriticValidator.score }
    against an average of ${ derivedData.mostContrarianCriticValidator.totalVal / (Object.keys(yearData.critics).length)}`  },
    ];
  }
  beforeUpdate(getDerivedData);

</script>

<dl>
  {#each dataList as entry
  }
    <DataBlock
      entry={entry}
    />
  {/each}
</dl>