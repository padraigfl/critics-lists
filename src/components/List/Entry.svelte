<script>
  import { beforeUpdate } from 'svelte';
  import ListEntryDataPoint from './ListEntryDataPoint.svelte';
  import ExternalLink from './ExternalLink.svelte';
  import Checkbox from './Checkbox.svelte';
  import {getIdFromName} from '../../utils';
  export let placement;
  export let title;
  export let entry;
  export let points;

  export let format;
  export let data;
  export let displayAll;
  export let lists;
  export let update;
  $: optionsVisible = false;
  $: extend = false; // TODO handle toggle of extra data
  $: hasData = data.director || data.cast || data.genre || data.language;

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
    return `<1k`
  }


  const imdb = {
    site: 'IMDb', 
    icon: 'imdb.png',
  }

  
  const getFilm = (content) => ([
    content.imdb ? {
      ...imdb,
      link: `https://www.imdb.com/title/${content.imdb.id}`,
      text: content.imdb.rating ? `${content.imdb.rating && content.imdb.rating.toFixed(1)} (${formatVoteCount(content.imdb.votes)})` : undefined,
    } : {
      ...imdb,
      link: `https://www.imdb.com/find?s=tt&q=${title}`,
    },
    {
      site: 'RT',
      link: `https://www.rottentomatoes.com/search/?search=${title}`,
      icon: 'rotten.png',
      text: content.rotten ? content.rotten + '%' : '',
    },
    ...(content.metacritic ? [{
      site: 'MC',
      link: `https://www.metacritic.com/search/movie/${title}/results`,
      text: content.metacritic + '%',
      icon: 'metacritic--text.png',
    }] : []),
  ]);

  const album = [// need to remove by
    { site: 'Spotify', link: 'https://open.spotify.com/search/', icon: 'spotify.png', modify: v => v.replace(/\s/g, '%20').replace(/by/g, '') },// %20
    { site: 'Youtube', link: 'https://www.youtube.com/results?search_query=', icon: 'youtube.png', modify: v => v.replace(/\s/g, '%20') }, // +
  ];

  const tv = [
    { site: 'IMDbTv', link: 'https://www.imdb.com/find?s=tt&q=', icon: 'imdb.png', modify: v => v.replace(/\(.*\)/g, '%20') },
    { site: 'RTTv', link: 'https://www.rottentomatoes.com/search/?search=', icon: 'rotten.png', modify: v => v.replace(/\(.*\)/g, '%20') },
  ];

  $: mediaLinkSets = {
    film: getFilm(data),
    album,
    tv,
  };

  const getFormat = format => [...mediaLinkSets[format]] || [];

  $: links = getFormat(format, data);
  $: searches = [{
    site: 'Letterboxd',
    link: `https://letterboxd.com/search/films/${title}`,
    icon: 'letterboxd.png'
  }, {
    icon: 'google.png',
    site: 'Google',
    link: `https://www.google.com/search?q=film+${title.replace(' ', '+').replace('&', '+and+')}`,
  }];

  const toggle = () => {
    extend = !extend;
  }
  const expand = (e) => { extend = !extend; e.currentTarget.blur(); }

  const listActions = lists ? [
    {
      icon: '+',
      action: update.know,
      isChecked: (v) => lists.know.includes(v),
      description: 'yep',
      key: 'seen',
    },
    {
      icon: '?',
      action: update.interested,
      isChecked: (title) => lists.interested[title],
      description: 'ooh',
      key: 'interested',
    },
    {
      icon: 'x',
      action: update.uninterested,
      isChecked: (v) => lists.uninterested.includes(v),
      description: 'meh',
      key: 'uninterested',
    },
  ] : [];

</script>

<li class={`Entry Entry--${format} ${!hasData ? 'Entry--no-data' : '' }`} id={getIdFromName(title)}>
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
        <strong class="Entry__title">{title}</strong>
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
              link={link}
            />
          {/each}
          <!-- <button on:click={toggle}>
            {extend ? '<' : '>'}
          </button> -->
        </div>
        {#if lists}
          <div class="Entry__checkboxes">
            {#each listActions as { icon, action, isChecked, description, key }}
              <Checkbox
                checked={isChecked(title)}
                action={action}
                title={title}
                icon={icon}
                description={description}
                key={key}
              />
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <div class="Entry__points">
      <ListEntryDataPoint value={points} key="pts" />
      {#if !hasData || !data.award}
        <div/> <div />
      {/if}
      <ListEntryDataPoint value={entry.firsts.length} small icon="🏆" description="#1's"/>
      <ListEntryDataPoint value={entry.critics.length} small icon="📋" description="Lists" />
      {#if hasData && data.awards}
        <ListEntryDataPoint value={data.awards.wins} small icon="W" description="Awards"/>
        <ListEntryDataPoint value={data.awards.noms} small icon="N" description="Noms"/>
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