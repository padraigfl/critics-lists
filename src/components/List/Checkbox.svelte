<script>
  export let title;
  export let icon;
  export let checked;
  export let action;
  export let description;
  export let key;
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
    checked={checked ? 'checked' : ''}
    on:change={action}
  />
  <label
    for={`${title}__${icon}`} 
    data-description-action={`${checked ? 'Add to ' : 'Remove from'} ${key} list`}
    data-hover={description}
  />
</div>