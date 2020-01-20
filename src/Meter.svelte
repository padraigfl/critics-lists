<script>
  export let value;
  export let total;
  export let small;
  export let icon;
</script>

<div
  class={`Meter ${small ? 'Meter--small': ''}`}
>
  <div class="Meter__text">
    {value >= 1 ? value.toFixed(0) : value.toFixed(1)}
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