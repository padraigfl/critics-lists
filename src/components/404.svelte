<script>
  import { FORMATS, YEARS } from '../utils/constants';
  let errors = {};
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const newErrors = {};
  if (params.get('year')) {
    errors = { 
      year: true,
    };
  }
  if (params.get('format')) {
    errors = {
      ...errors,
      format: true,
    }
  }
</script>

<div style="padding-top: 52px; margin: 20px;">
  This is the 404 page, you probably shouldn't be here...

  {#if Object.keys(errors).length}
    {#if errors.year}
      <p>Invalid format, needs to be one of</p>
      <ul>
        {#each YEARS as year}
          <li>{year}</li>
        {/each}
      </ul>
    {/if}
    {#if errors.format}
      <p>Invalid year, needs to be one of:</p>
      <ul>
        {#each FORMATS as format}
          <li>{format}</li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
