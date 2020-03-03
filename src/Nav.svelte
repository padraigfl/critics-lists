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
	let selectedOptions = {};
	let listener;
	let order = 'score';
	let options = [];

	const onClickOutside = (e) => {
		const nav = document.querySelector('.nav');
		if (!nav.contains(e.target)) {
			toggle();
		}
	}

  filterSelections.subscribe((val) => selectedOptions = val);

	year.subscribe(value => {
		year_value = value;
	});
	format.subscribe(value => {
		format_value = value;
		if (value !== 'film') {
			display = false
		}
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
		if (display) {
			document.removeEventListener('click', listener);
		} else {
			listener = document.addEventListener('click', onClickOutside);
		}
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

	const getOptions = () => {
		if (format_value !== 'film') {
			return [];
		}
    return [
		{
			title: "Sort by",
			type: 'sort',
			options: [
        { title: 'Points', key: 'score' },
				{ title: 'Box Office', key: 'boxOffice' },
				{ title: 'Length', key: 'runtime' },
				// { title: '# lists', key: (val) => val.critics ? val.critics.length : 0 },
				// { title: '# firsts', key: (val) => val.firsts ? val.firsts.length  : 0 },
				{ title: 'IMDb rating', key: 'imdb.rating' }
			],
			default: 'Points',
		},
		...['genres', 'country', 'language'].map(key => ({
			title: key,
			type: 'filter',
			options: Object.entries(availableOptions[format_value][key]),
		})),
	]}

  filterOptions.subscribe(val => {
		availableOptions = val;
		options = getOptions();
  });



  // let optionValue = options.reduce((acc, opt) => ({ ...acc, [opt.title]: null }));

  const updateOptions = (key, type) => e => {
    selectedOptions = {
      ...selectedOptions,
      [key]: e.target.value,
    }

    filterSelections.update(() => selectedOptions)
    toggle();
	}
	ordering.subscribe(val => {
    console.log(val);
		order = val;
	})
  const updateSort = (o) => {
		ordering.update(() => o.key);
    toggle();
  };

</script>

<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	
	<div class="nav">
		<div class="nav__main">
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
			<button
				on:click={toggle}
				class={`nav__button ${display ? "nav__button--active" : ''}`}
				disabled={format_value !== 'film'}
			>
				...
			</button>
		</div>
		{#if display}
			<div class="nav__options">
				<ul>
					{#each options as opt}
						<li>
              {#if opt.type === 'sort'}
                <div class="nav__options__title">
                  {opt.key || opt.title}
                </div>
                <select class="nav__options__select" on:change={(e) => updateSort(opt.options[e.target.value])} value={opt.options.findIndex(v => v.key === order)}>
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
									{#each opt.options.sort((a, b) => a[0] > b[0] ? 1 : -1).filter(a => a[1] > 1) as selectOption}
                    <option value={selectOption.title || selectOption[0]} >
                      {`${selectOption[0]} (${selectOption[1]})`}
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