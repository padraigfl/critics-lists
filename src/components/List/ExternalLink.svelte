<script>
  export let icon;
  export let text;
  export let site;
  export let link;
</script>

<a
  class={`ExternalLink ${ icon ? `ExternalLink--icon` : '' } ${site === 'IMDb' ? 'ExternalLink--imdb' : '' }`}
  href={link}
  target="_blank"
>
  {#if icon}
    <img class="ExternalLink__icon" src={`/icons/${icon}`} alt={site} />
  {:else}
    {site}
  {/if}
  {#if text}
    <span class="ExternalLink__extra-text">{text}</span>
  {:else}
    <img class="ExternalLink__search-icon" src="/icons/search.svg" alt="search"/>
  {/if} 
</a>
