<script>
  export let listData;
  export let yearData;  
</script>

<ol>
  {#each listData as entry}
    <li>{entry[0]} - {entry[1]} - {yearData.works[entry[0]].firsts.length} firsts</li>
  {/each}
</ol>