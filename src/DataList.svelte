<script>
  import { beforeUpdate } from 'svelte';
  import DataBlock from './DataBlock.svelte';
	import {
    deriveAdditionalDataFromProcessedList,
  } from './analytics';
  export let yearData;
  export let listData;
  let prevYearData;
  let dataList = [
    { title: '# Lists aggregated:', data: Object.keys(yearData.critics).length },
    { title: '# Publications', data: Object.keys(yearData.publications).length },
    { title: '# Unique entries', data: Object.keys(yearData.works).length },
  ];
  
  const getDerivedData = () => {
    let derivedData = deriveAdditionalDataFromProcessedList(listData, yearData);
    dataList = [
      ...dataList.slice(0, 3),
      { title: 'Highest ranked with no #1', data: derivedData.biggestLoser, dataLink: true },
      {
        title: 'Lowest ranked with a #1',
        data: derivedData.smallestWinner,
        dataLink: true,
        validator: {
          text: 'in more than 2 lists',
          data: derivedData.smallestWinnerValidator,
          dataLink: true,
        },
      },
      { title: 'Highest ranked pair that share no lists', data: derivedData.divisivePair, dataLink: true },
      {
        title: 'Most contrarian critic (lowest points for overall list)',
        data: derivedData.mostContrarianCritic.name,
        descriptors: `with ${ derivedData.mostContrarianCritic.score }
    against an average of ${ (derivedData.mostContrarianCritic.totalVal / (Object.keys(yearData.critics).length)).toFixed(1)}`,
        link: yearData.critics[derivedData.mostContrarianCritic.name].link,
        validator: {
          text: 'Omitting lists with 3+ unique entries',
          data: derivedData.mostContrarianCriticValidator.name,
          descriptors: `with ${ derivedData.mostContrarianCriticValidator.score }
    against an average of ${ (derivedData.mostContrarianCriticValidator.totalVal / (Object.keys(yearData.critics).length)).toFixed(1)}`,
        link: yearData.critics[derivedData.mostContrarianCriticValidator.name].link,
        },
      },
      // { title: 'Data Source', data: yearData.source }
    ];
  }


  $: {
    if (yearData !== prevYearData) {
      prevYearData = yearData;
      getDerivedData();
    }
  }

</script>

<dl class="DataList">
  {#each dataList as entry
  }
    <DataBlock
      entry={entry}
    />
  {/each}
</dl>