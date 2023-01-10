<script>
  import Checkbox from '../List/Checkbox.svelte';
  import { getLocalStorageList, setLocalStorageList } from '../../utils/general';
  import { TV } from '../../utils/constants';
  export let format;
  export let year;
  export let data;
  export let title;
  export let lists = [];
  let interested = true;
  let known = false;

  $: hasData = data.director || data.cast || data.genre || data.language;
  $: extend = false; // TODO handle toggle of extra data


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

  const listActions = lists ? [
    {
      icon: '?',
      action: update.interested,
      isChecked: (title) => lists.interested[title],
      description: 'ooh',
      key: 'interested',
    },
  ] : [];


  const markAsKnown = () => {
    let listNow = getLocalStorageList('know', format, year);
    if (listNow.includes(title)) {
      listNow = listNow.filter(v => v !== title);
      known = false;
    } else {
      listNow.push(title);
      known = true;
      update();
    }
    setLocalStorageList('know', format, year)(listNow);
  }

</script>

<li class={`InterestedCard`}>
  <div class="InterestedCard__heading">
    <div class="InterestedCard__actions">
      {#if interested}
        <button class="InterestedCard__remove InterestedCard__remove--list" on:click={update} disabled={!interested} />
      {/if}
      <button class={`InterestedCard__remove InterestedCard__remove--known ${known ? 'marked' : ''}`} on:click={markAsKnown} />
    </div>
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
        data.runtime && format !== TV && data.runtime !== 'N/A'
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
      <p>
        <strong>{title}</strong>:
        Removed from list
        {#if known}
          (marked as <img src="/icons/tick-fill.png" style="display: inline-black; width: 20px; margin-left: 2px; margin-bottom: -4px;" alt="known" />)
        {/if}
      </p>
      {#if !known}
        <button on:click={update}>Undo</button>
      {:else}
        <button on:click={update}>Keep on list</button>
        <button
          on:click={() => {
            markAsKnown();
            update();
          }}
        >
          Undo
        </button>
      {/if}
    </div>
  {/if}
</li>