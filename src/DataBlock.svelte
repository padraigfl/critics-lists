<script>
  export let entry;
</script>

<dt class="DataBlock__tag">{entry.title}</dt>
<dd class="DataBlock__data">
  <strong>
    {#if Array.isArray(entry.data)}
      {#each entry.data as v}
        {v}<br />
      {/each}
    {:else}
      {entry.data}
    {/if}
  </strong>
  {#if entry.descriptor}
    <em class="DataBlock__descriptor">{entry.descriptor}</em>
  {/if}  
  {#if entry.link}
    <a href={entry.link} target="_blank">_</a>
  {/if}
  {#if entry.validator && entry.validator.data !== entry.data}
    <div class="DataBlock__validator">
      [
        {entry.validator.text}:
        {#if Array.isArray(entry.validator.data)}
          {#each entry.data as v}
            {v}<br />
          {/each}
        {:else}
          {entry.validator.data}
        {/if}
        {#if entry.validator.descriptor}
          <em class="DataBlock__descriptor">{entry.validator.descriptor}</em>
        {/if}
        {#if entry.validator.link}
          <a href={entry.validator.link} target="_blank">_</a>
        {/if}
      ]
    </div>
  {/if}
</dd>
