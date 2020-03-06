<script>
  export let value;
  export let key = null;
  export let small = false;
  export let icon = false;
</script>

<div
  class={`ListEntryDataPoint ${small ? 'ListEntryDataPoint--small': ''}`}
>
  <div class="ListEntryDataPoint__text">
    { value >= 1 ? (+value).toFixed(0) : (value || 0).toFixed(0)}{key || ''}
  </div>
  {#if icon}
  <div class="ListEntryDataPoint__icon">
    {icon}
  </div>
  {/if}
</div>