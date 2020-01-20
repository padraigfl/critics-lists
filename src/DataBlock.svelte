<script>
  export let entry;
</script>

<dt class="DataBlock__tag">{entry.title}</dt>
<dd class="DataBlock__data">
  <strong>{entry.data}</strong>
  {#if entry.descriptor}
    <em class="DataBlock__descriptor">{entry.descriptor}</em>
  {/if}
  {#if entry.validator && entry.validator.data !== entry.data}
    <div class="DataBlock__validator">
      [
        {entry.validator.text}:
        {entry.validator.data}
        {#if entry.validator.descriptor}
          <em class="DataBlock__descriptor">{entry.validator.descriptor}</em>
        {/if}
      ]
    </div>
  {/if}
</dd>
