<script>
  export let value;
  export let total;
  export let key = null;
  export let small = false;
  export let icon = false;
</script>

<div
  class={`Meter ${small ? 'Meter--small': ''}`}
>
  <div class="Meter__text">
    {value >= 1 ? value.toFixed(0) : (value || 0).toFixed(1)}{key || ''}
  </div>
  {#if icon}
  <div class="Meter__icon">
    {icon}
  </div>
  {/if}
  <div class="Meter__graph">
    <div
      class="Meter__graph__value"
      style={`width: ${(value / total) * 100}%`}
    />
  </div>
</div>