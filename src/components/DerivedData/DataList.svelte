<script>
  import { beforeUpdate } from 'svelte';
  import DataBlock from './DataBlock.svelte';
	import {
    deriveAdditionalDataFromProcessedList,
  } from '../../analytics';
  import { SOURCE } from '../../store'; 
  export let yearData;
  export let listData;
  export let format;
  export let year;
  let prevYearData;
  let prevListData;

  const formatNameFromLink = (link) => {
    const name = 'Metacritic: ' + link.split('/').pop().replace(/\-/g, ' ');
    return name.includes(year) ? name : `${name} (year)`;
  }

  let dataList = [
    { title: 'Source', data: formatNameFromLink(SOURCE[format][year]), link: SOURCE[format][year] },
    { title: '# Lists aggregated:', data: Object.keys(yearData.critics).length },
    { title: '# Publications', data: Object.keys(yearData.publications).length },
    { title: '# Unique entries', data: Object.keys(yearData.works).length },
  ];

  
  const getDerivedData = () => {
    let derivedData = deriveAdditionalDataFromProcessedList(listData, yearData, format);
    dataList = [
      ...dataList.slice(0, 3),
      {
        title: 'Total entries', data: derivedData.count,
        validator: {
          text: 'On more than one list',
          data: derivedData.count - derivedData.onlyInOneList.length,
        }
      },
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
    if (derivedData.bestStudio) {
      dataList.push(
        {
          title: 'Most featured production company',
          data: derivedData.bestStudio,
        },
      );
    }
  }


  $: {
    if (yearData !== prevYearData) {
      prevYearData = yearData;
      prevListData = listData;
      getDerivedData();
    }
  }

</script>

<div class="DataList">
  <dl>
    {#each dataList as entry
    }
      <DataBlock
        entry={entry}
      />
    {/each}
  </dl>
</div>