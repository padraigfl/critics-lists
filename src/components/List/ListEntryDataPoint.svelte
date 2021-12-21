<script>
  export let value;
  export let key = null;
  export let small = false;
  export let icon = false;
  export let description = '';

  $: generatedValue =  value >= 1 ? (+value).toFixed(0) : (value || 0).toFixed(0)
</script>

<div
  class={`ListEntryDataPoint ${small ? 'ListEntryDataPoint--small': 'ListEntryDataPoint--heading'}`}
  icon={icon}
  data-description={description}
  title={description}
>
  <p class="a11y invisible">{description}</p>
  { generatedValue }{key || ''}
</div>