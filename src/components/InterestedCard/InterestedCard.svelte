<script>
  import Checkbox from '../List/Checkbox.svelte';
  import { getLocalStorageList, setLocalStorageList } from '../../utils';
  export let format;
  export let year;
  export let data;
  export let title;
  export let lists = [];
  export let links = [];
  let interested = true;

  $: hasData = data.director || data.cast || data.genre || data.language;
  $: extend = false; // TODO handle toggle of extra data


  const listActions = lists ? [
    {
      icon: '?',
      action: update.interested,
      isChecked: (title) => lists.interested[title],
      description: 'ooh',
      key: 'interested',
    },
  ] : [];

  const update = () => {
    const listNow = getLocalStorageList('interested', format, year);
    if (listNow[title]) {
      delete listNow[title];
      interested = false;
    } else {
      listNow[title] = data;
      interested = true;
    }
    setLocalStorageList('interested', format, year)(listNow);
  }

</script>

<li class={`Entry InterestedCard`}>
  <div class="InterestedCard__heading">
    {#if interested}
      <button class="InterestedCard__remove" on:click={update} disabled={!interested}>X</button>
    {/if}
    <strong class="InterestedCard__title">{title}</strong>
    {#if data.runtime || data.country}
      <div class="InterestedCard__subtitle">
      ({
          year 
            ? `${year}${
              data.runtime || data.country
                ? '; '
                : ''}`
            : ''
        }{
        data.runtime
          ? `${data.runtime}min${data.country
            ? '; '
            : ''}`
          : ''
        }{
        data.country
          ? data.country.join(', ')
          : ''
      })
      </div>
    {/if}
  </div>
  {#if hasData }
    <ul class="InterestedCard__details">
      <li><strong>Director</strong> <span>{data.director || 'N/A'}</span></li>
      <li><strong>Cast</strong> <span>{data.cast ? data.cast.join(', ') : 'N/A'}</span></li>
      <li><strong>Genre</strong> <span>{data.genre ? data.genre.join(', ') : 'N/A'}</span></li>
      <li><strong>Language</strong> <span>{data.language ? data.language.join(', ') : 'N/A'}</span></li>
    </ul>
    {#if data.plot && data.plot !== 'N/A' }
      <p><em>{data.plot}</em></p>
    {/if}
  {/if}
  {#if !interested} 
    <div class="InterestedCard__undo-wrapper">
      <p><strong>{title}</strong>: Removed from list</p>
      <button on:click={update}>Undo</button>
    </div>
  {/if}
</li>