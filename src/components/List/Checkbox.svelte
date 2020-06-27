<script>
  export let title;
  export let icon;
  export let checked;
  export let action;
  export let description;
  export let key;
  export let a11y;
  $:isChecked = checked;
</script>

<div
  class={`Checkbox ${isChecked ? 'checked' : ''} ${description.toLowerCase()}`}
>
  <input
    class="Entry__options"
    name={`${title}__${icon}`}
    id={`${title}__${icon}`}
    value={title}
    type="checkbox"
    checked={isChecked ? 'checked' : ''}
    on:change={action}
  />
  <label
    for={`${title}__${icon}`} 
    data-description-action={`${isChecked ? 'Add to ' : 'Remove from'} ${key} list`}
    data-hover={description}
  >
    <p class="a11y">{a11y}</p>
  </label>
</div>