<script>
	import Modal from './Modal.svelte';
	import axios from 'axios';
	import { push } from 'svelte-spa-router';
	import { processListsWithRankings, SCORING_MATRICES } from '../../analytics';
  import {
    loadingPage, year, format, scoringMatrix, filterOptions, filterSelections, ordering, viewUninterested
  } from '../../store';
  import { OPTIONS } from '../../utils/constants';

  export let getOptions;
  export let updateSort;
  export let updateOptions;
  export let selectedOptions;
  export let order;
  export let checkboxes;

  let activeMatrix;

  scoringMatrix.subscribe((val) => activeMatrix = val);

  const setMatrix = (e) => {
    const value = e.target.value;
    scoringMatrix.update(() => value);
  }

  $: options = getOptions();
</script>

<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
<div class="nav__options">
  <ul>
    {#each options as opt}
      <li>
        {#if opt.type === 'sort'}
          <div class="nav__options__title">
            {opt.key || opt.title}
          </div>
          <select class="nav__options__select" on:change={(e) => updateSort(opt.options[e.target.value])} value={opt.options.findIndex(v => v.key === order.key)}>
            {#each opt.options as selectOption, i}
              <option value={i} >
                {selectOption.title}
              </option>
            {/each}
          </select>
        {:else}
          <div class="nav__options__title">
              {opt.key || opt.title}
          </div>
          <select class="nav__options__select" on:change={updateOptions(opt.key || opt.title, opt.type)} value={selectedOptions[opt.key || opt.title] || null}>
            <option value='All'>All</option>
            {#if Array.isArray(opt.options)}
              {#each opt.options.sort((a, b) => a[0] > b[0] ? 1 : -1).filter(a => a[1] > 1) as selectOption}
                <option value={selectOption.title || selectOption[0]} >
                  {`${selectOption[0]} (${selectOption[1]})`}
                </option>
              {/each}
            {/if}
          </select>
        {/if}
      </li>
    {/each}
    <li>
      <div class="nav__options__title">
          Scoring Metric
      </div>
      <select class="nav__options__select" on:change={setMatrix} value={activeMatrix}>
        {#each Object.entries(SCORING_MATRICES) as [ key, matrix]}
          <option value={key}>
            {key}
          </option>
        {/each}
      </select>
    </li>
    {#each checkboxes as { title, toggle, checked, icon, goal, text }}
      <li class={`nav__options__toggle nav__options__toggle--${title || text}`}>
        <input name={`${goal}_${title || text}`} id={`${goal}_${title || text}`} type="checkbox" on:change={toggle} checked={checked} />
        <label for={`${goal}_${title || text}`}>
          {goal}{text ? ` ${text}` : ''}
        </label>
      </li>
    {/each}
  </ul>
  <p class="nav__options__link"><a href="/">About</a></p>
</div>
