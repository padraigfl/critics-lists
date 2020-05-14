<script>
  import {getIdFromName} from '../../utils';
  export let entry;
  $: data = Array.isArray(entry.data) ? entry.data : [entry.data];

  const goToFilm = (id) => {
    document.getElementById(id)
      .scrollIntoView({ behavior: 'smooth', position: 'center' });
    // window.scrollBy(0, -50)
    document.querySelector(`#${id} a`).focus();
    document.querySelector(`#${id} a`).blur();
  }
</script>

<dt class="DataBlock__tag">
  {entry.title}
</dt>
<dd class="DataBlock__data">
  <strong>
    {#each data as v, idx}
      {#if entry.dataLink}
        <button on:click={() => goToFilm(getIdFromName(v))}>{v}</button>
      {:else}
        {v}
      {/if}
      {#if idx < data.length - 1}
        <br />
      {/if}
    {/each}
  </strong>
  {#if entry.descriptor}
    <em class="DataBlock__descriptor">{entry.descriptor}</em>
  {/if}  
  {#if entry.link}
    <a href={entry.link} target="_blank">*</a>
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
          <a href={entry.validator.link} target="_blank">*</a>
        {/if}
      ]
    </div>
  {/if}
</dd>
