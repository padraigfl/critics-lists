<script>
	import Modal from './Modal.svelte';
	import axios from 'axios';
	import { push } from 'svelte-spa-router';
	import { processListsWithRankings, defaultScoringMatrix } from './analytics';
  import { loadingPage, year, format, scoringMatrix, OPTIONS, filterOptions, filterSelections, ordering } from './store';

	let display;
	let year_value = 'Year';
	let format_value = 'Format';
  let matrix_value;
	let isLoading;
  $: matrix = defaultScoringMatrix;
  let availableOptions = {
    genres: [],
    language: [],
    country: []
  };
  let sortFunc = val => val.points;
  let selectedOptions = {};

  filterSelections.subscribe((val) => selectedOptions = val);

	year.subscribe(value => {
		year_value = value;
	});
	format.subscribe(value => {
		format_value = value;
  });
  const changeYear = (e) => {
    year.update(() => e.target.value);
		if (
			OPTIONS.formats.includes(format_value)
			&& OPTIONS.years.includes(e.target.value)
		) {
			loadPage(`/${format_value}/${e.target.value}`)
			window.scroll(0, 0);
		}
	};

	const changeFormat = (e) => {
    format.update(() => e.target.value);
		if (
			OPTIONS.years.includes(year_value)
			&& OPTIONS.formats.includes(e.target.value)
		) {
			loadPage(`/${e.target.value}/${year_value}`);
		}
	}

	loadingPage.subscribe(value => {
		isLoading = value;
	});
	const loadPage = (page) => {
		loadingPage.update(() => true);
		push(page);
		window.scroll(0, 0);
	}


	const toggle = () => {
		display = !display;
	}
	scoringMatrix.subscribe(value => {
		matrix_value = value;
	});
	const updateMatrix = key => e => {
		matrix = {
			...matrix,
			[key]: +e.target.value,
		}
	}
	const saveNewMatrix = () => {
		scoringMatrix.update(() => matrix);
		toggle();
	}
	scoringMatrix.subscribe(value => {
		matrix_value = value;
  });
  // filterData.subscribe(value => filterOptions = value);

  filterOptions.subscribe(val => {
    availableOptions = val;
  });

	const getOptions = () => {
    console.log(availableOptions);
    return [
		{
			title: "Sort by",
			type: 'sort',
			options: [
        { title: 'Points', key: (val) => val.score },
				{ title: 'Box Office', key: (val) => val.boxOffice },
				{ title: 'Length', key: (val) => val.runtime },
				// { title: '# lists', key: (val) => val.critics ? val.critics.length : 0 },
				// { title: '# firsts', key: (val) => val.firsts ? val.firsts.length  : 0 },
				{ title: 'IMDb rating', key: (val) => val.imdb ? +val.imdb.rating : 0 }
			],
			default: 'Points',
		},
		...['genres', 'country', 'language'].map(key => ({
			title: key,
			type: 'filter',
			options: Object.entries(availableOptions[format_value][key]),
		})),
	]}

  // let optionValue = options.reduce((acc, opt) => ({ ...acc, [opt.title]: null }));

  const updateOptions = (key, type) => e => {
    console.log(selectedOptions);
    selectedOptions = {
      ...selectedOptions,
      [key]: e.target.value,
    }

    filterSelections.update(() => selectedOptions)
  }
  const updateSort = (o) => {
    console.log(o);
    sortFunc = o.key;
    ordering.update(() => sortFunc);
  };

</script>

<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	
	<div class="nav">
		<select value={year_value} on:change={changeYear}>
			{#each ['Year', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'] as year}
				<option value={year} disabled={year === 'Year'}>
					{ year }
				</option>
			{/each}
		</select>
		<select value={format_value} on:change={changeFormat}>
			{#each ['Format', 'film', 'tv', 'album'] as format}
				<option value={format} disabled={format === 'Format'}>
					{ format }
				</option>
			{/each}
		</select>
		<button on:click={toggle}>
			...
		</button>
		{#if display}
			<div class="nav__options">
				<ul>
					{#each getOptions() as opt}
						<li>
              {#if opt.type === 'sort'}
                <div class="nav__options__title">
                  {opt.key || opt.title}
                </div>
                <select class="nav__options__select" on:change={(e) => updateSort(opt.options[e.target.value])} value={selectedOptions[opt.key || opt.title] || null}>
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
                  <option value={null}>
                    All
                  </option>
                  {#each opt.options as selectOption}
                    <option value={selectOption.title || selectOption[0]} >
                      {selectOption.toString()}
                    </option>
                  {/each}
                </select>
              {/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
<!-- 
	{#if (display)}
		<Modal onclose={toggle}>
			<p>Update the values to recalculate lists across the site</p>
			<div class="matrix">
				{#each [1,2,3,4,5,6,7,8,9,10,'_'] as entry}
					<div class={`matrix__option ${entry === '_' ? 'matrix__option--unranked':''}`}>
						{#if entry === '_'}
							<span class="matrix__rank ">Unranked</span>
						{:else}
							<span class="matrix__rank">{entry}</span>
						{/if}
						<input max="100" class="matrix__input" type="number" on:change={updateMatrix(entry)} bind:value={matrix[entry]}/>
					</div>
				{/each}
			</div>
			<button style="float:right;" on:click={saveNewMatrix}>Update</button>
		</Modal>
	{/if} -->