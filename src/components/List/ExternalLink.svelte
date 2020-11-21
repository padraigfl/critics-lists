<script>
  export let icon;
  export let text;
  export let site;
  export let link;
</script>

<a
  class={`ExternalLink ${site ? `ExternalLink--${site}` : '' }`}
  href={link}
  target="_blank"
>
  <div class={`ExternalLink__icon ${ icon ? `ExternalLink__icon--${icon}` : 'ExternalLink__icon--no-icon' }`} aria-label={icon} data-site={site}/>
  {#if text}
    <span class="ExternalLink__extra-text">{text}</span>
  {:else}
    <img class="ExternalLink__search-icon" src="/icons/search.svg" alt="search"/>
  {/if} 
</a>
