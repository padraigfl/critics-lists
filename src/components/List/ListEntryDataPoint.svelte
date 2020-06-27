<script>
  export let value;
  export let key = null;
  export let small = false;
  export let icon = false;
  export let description = '';
</script>

<div
  class={`ListEntryDataPoint ${small ? 'ListEntryDataPoint--small': 'ListEntryDataPoint--heading'}`}
  icon={icon}
  data-description={description}
>
  <p class="a11y invisible">{description}</p>
  { value >= 1 ? (+value).toFixed(0) : (value || 0).toFixed(0)}{key || ''}
</div>