<script>
  import { beforeUpdate } from 'svelte';
  import ListEntryDataPoint from './ListEntryDataPoint.svelte';
  import ExternalLink from './ExternalLink.svelte';
  import Checkbox from './Checkbox.svelte';
  import {getIdFromName} from '../../utils/general';
  import { ALBUM, TV } from '../../utils/constants';
  export let placement;
  export let title;
  export let entry;
  export let points;

  export let format;
  export let data;
  export let displayAll;
  export let lists;
  export let update;
  export let isKnown;
  export let isInterested;
  export let isUninterested;
  $: optionsVisible = false;
  $: extend = false; // TODO handle toggle of extra data
  $: hasData = format !== ALBUM && (
    data.director || data.cast || data.genre || data.language
  );
  $: formattedTitle = format === ALBUM
    ? { name: title.split(' by ')[0], src: title.split(' by ')[1] }
    : format === TV
      ? { name: title.split('(')[0], src: (title.split('(')[1] || '').replace(')', '')}
      : null;

  const formatVoteCount = (count) => {
    if (count > 10 ** 6) {
      return (count / 10**6).toFixed(0) + 'M';
    }
    if (count > 10 ** 5) {
      return (count / 10**6).toFixed(1) + 'M';
    }
    if (count > 10 ** 3) {
      return  (count / 10 ** 3).toFixed(0) + 'K';
    }
    if (!count) {
      return '';
    }
    return `<1k`
  }


  const imdb = {
    site: 'IMDb', 
    icon: 'imdb',
  }

  
  const getFilm = (content) => {
    return ([
    content.imdbID ? {
      ...imdb,
      link: `https://www.imdb.com/title/${content.imdbID}`,
      text: content.imdbRating ? `${+content.imdbRating && (+content.imdbRating).toFixed(1)}/${formatVoteCount(content.imdbVotes)}` : undefined,
    } : {
      ...imdb,
      link: `https://www.imdb.com/find?s=tt&q=${title}`,
    },
    {
      site: 'RottenTomatoes',
      link: `https://www.rottentomatoes.com/search/?search=${title}`,
      icon: 'rotten',
      text: content.rotten ? content.rotten + '%' : '',
    },
    ...(content.metacritic ? [{
      site: 'Metacritic',
      link: `https://www.metacritic.com/search/movie/${title}/results`,
      text: content.metacritic  !== 'N/A' ? content.metacritic + '%' : '',
      icon: 'metacritic',
    }] : []),
  ]);
  }

  const getAlbum = content =>{
    return [
      !content.id
        ? { site: 'Spotify', link: 'https://open.spotify.com/search/', icon: 'spotify', modify: v => v.replace(' by ', ' ').replace(/\s+/g, '%20') }
        : { site: 'Spotify', link: `https://open.spotify.com/album/${content.id}`, icon: 'spotify', text: '►' },
      { site: 'Youtube', link: 'https://www.youtube.com/results?search_query=', icon: 'youtube', modify: v => v.replace(/by\s/g, '').replace(/\s/g, '%20') }, // +
    ];
  }

  $: mediaLinkSets = {
    film: getFilm(data),
    album: getAlbum(data),
    tv: getFilm(data).slice(0, 1),
  };

  const getFormat = format => [...mediaLinkSets[format]] || [];

  $: links = getFormat(format, data);
  $: searches = [{
    site: 'Letterboxd',
    link: `https://letterboxd.com/search/films/${title}`,
    icon: 'letterboxd'
  }, {
    icon: 'google',
    site: 'Google',
    link: `https://www.google.com/search?q=film+${title.replace(' ', '+').replace('&', '+and+')}`,
  }];

  const toggle = () => {
    extend = !extend;
  }
  const expand = (e) => { extend = !extend; e.currentTarget.blur(); }

  $: listActions = lists ? [
    {
      icon: '+',
      action: (e) => {
        update.know(e);
        isKnown = !isKnown;
      },
      isChecked: isKnown,
      description: 'yep',
      a11y: 'Already known',
      key: 'seen',
    },
    {
      icon: '?',
      action: (e) => {
        update.interested(e);
        isInterested = !isInterested;
      },
      isChecked: isInterested,
      description: 'ooh',
      a11y: 'Add to interested list',
      key: 'interested',
    },
    {
      icon: 'x',
      action:  (e) => {
        update.uninterested(e);
        isUninterested = !isUninterested;
      },
      isChecked: isUninterested,
      description: 'meh',
      a11y: 'Mark as uninterested',
      key: 'uninterested',
    },
  ] : [];

</script>

<li 
  class={`Entry Entry--${format} ${
    !hasData ? 'Entry--no-data' : '' 
    } ${
      isKnown ? 'Entry--known' : ''
    } ${
      isInterested ? 'Entry--interested' : ''
    } ${
      isUninterested ? 'Entry--uninterested' : ''
    } ${
      entry.critics.length === 1 ? 'Entry--single-list' : ''
    }`}
  id={getIdFromName(title)}>
  <div
    class="Entry__core"
  >
    <div class="Entry__placement">
      {placement}
      {#if hasData}
        <button class={`Entry__display-details ${extend ? 'extend' : ''}`} on:click={expand} />
      {/if}
    </div>
    <div class="Entry__body">
      <div class="Entry__body-row--title">
        <span class="Entry__title">
          { #if formattedTitle }
            <strong>{formattedTitle.name}</strong>
            {#if formattedTitle.src}
              {' '}{formattedTitle.src}
            {/if}
          {:else }
            <strong>{title}</strong>
          {/if}
        </span>
        {#if data.runtime || data.country}
          <div class="Entry__subtitle">
          ({data.runtime ? `${data.runtime}min${data.country ? '; ': ''}`: ''}{data.country ? data.country.join(', ') : ''})
          </div>
        {/if}
      </div>
      <div class="Entry__body-row--actions">
        <div class="Entry__links">
          {#each links as { site, link, modify, icon, text }, i}
            <ExternalLink
              site={site}
              icon={icon}
              text={text}
              link={title && modify ? `${link}${modify(title)}` : link}
            />
          {/each}
          <!-- <button on:click={toggle}>
            {extend ? '<' : '>'}
          </button> -->
        </div>
        {#if lists}
          <div class="Entry__checkboxes">
            {#each listActions as { icon, action, isChecked, description, key, a11y }}
              <Checkbox
                checked={isChecked}
                action={action}
                title={title}
                icon={icon}
                description={description}
                key={key}
                a11y={a11y}
              />
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <div class="Entry__points">
      <ListEntryDataPoint value={points} key="pts" />
      {#if !hasData || !data.awards}
        <div/> <div />
      {/if}
      <ListEntryDataPoint value={entry.firsts.length} small icon="🏆" description="Number of first place entries"/>
      <ListEntryDataPoint value={entry.critics.length} small icon="📋" description="Numeber of lists featured on" />
      {#if hasData && data.awards}
        <ListEntryDataPoint value={data.awards.wins} small icon="W" description="Awards won"/>
        <ListEntryDataPoint value={data.awards.noms} small icon="N" description="Awards nominated for (excluding wins)"/>
      {/if}
    </div>
  </div>
  {#if (displayAll || extend) && hasData }
    <div class="Entry__extended">
      {#if data.poster}
        <img class="Entry__poster" src={data.poster.replace('X300', 'X70')} alt="" />
      {/if}
      <ul class="Entry__details">
        <li class="Entry__details__data"><div>Director</div> <div>{data.director || 'N/A'}</div></li>
        <li class="Entry__details__data"><div>Cast</div> <div>{data.cast ? data.cast.join(', ') : 'N/A'}</div></li>
        <li class="Entry__details__data"><div>Genre</div> <div>{data.genre ? data.genre.join(', ') : 'N/A'}</div></li>
        <li class="Entry__details__data"><div>Language</div> <div>{data.language ? data.language.join(', ') : 'N/A'}</div></li>
        <!-- BROKEN ATM <dt>Awards</dt> <dd>{data.awards.wins} / {(data.awards.noms + data.awards.wins)}</dd> -->
      </ul>
      {#if data.plot && data.plot !== 'N/A' }
        <p><em>{data.plot}</em></p>
      {/if}
      <div class="Entry__links Entry__links--search">
        Search: 
        {#each searches as { site, link, modify, icon, text }, i}
          <ExternalLink
            site={site}
            icon={icon}
            text={text}
            link={link}
          />
        {/each}
      </div>
        <!-- <button on:click={toggle}>
          {extend ? '<' : '>'}
        </button> -->
      <!-- <img src={data.poster&& data.poster.replace('300', '80')} /> -->
    </div>
  {/if}
</li>