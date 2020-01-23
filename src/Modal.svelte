<script>
  export let onclose;
</script>

<div class="Modal-bg">
  <div class="Modal">
    <button class="Modal__close" on:click={onclose}>X</button>
    <slot></slot>
  </div>
</div>