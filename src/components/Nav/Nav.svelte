<script>
	import Modal from './Modal.svelte';
	import NavOptions from './NavOptions.svelte';
	import axios from 'axios';
	import { push } from 'svelte-spa-router';
	import { processListsWithRankings, defaultScoringMatrix } from '../../analytics';
  import {
		loadingPage, year, format, scoringMatrix, OPTIONS, filterOptions, filterSelections, ordering, viewUninterested,
	} from '../../store';

	let display;
	let year_value = 'Year';
	let format_value = 'Format';
  let matrix_value;
	let isLoading;
  let availableOptions = {
    genre: [],
    language: [],
    country: []
  };
	let selectedOptions = {};
	let listener;
	let order = 'score';
	let options = [];
	let seeUninterested = false;
  $: matrix = defaultScoringMatrix;

	const onClickOutside = (e) => {
		const nav = document.querySelector('.nav');
		if (!nav.contains(e.target) && !!display) {
			toggle();
		}
	}


	viewUninterested.subscribe((val) => seeUninterested = val);

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
		filterSelections.update(() => ({}));
		if (
			OPTIONS.formats.includes(format_value)
			&& OPTIONS.years.includes(e.target.value)
		) {
			loadPage(`/${format_value}/${e.target.value}`)
			window.scroll(0, 0);
		}
	};

	const toggleUninterested = () => {
		debugger;
		viewUninterested.update(() => !seeUninterested);
	}

	const changeFormat = (e) => {
    format.update(() => e.target.value);
		filterSelections.update(() => ({}));
		ordering.update(() => 'score')
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


	const toggle = (bool) => {
		if (bool === true ||display) {
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
				// { title: 'Box Office', key: 'boxOffice' }, seems to be buggy af
				{ title: 'Length', key: 'runtime' },
				// { title: '# lists', key: 'val.critics.length' },
				// { title: '# firsts', key: 'val.firsts.length' },
				{ title: 'IMDb rating', key: 'imdb.rating' },
				{ title: 'Awards', key: 'awards.wins' },
				{ title: 'Nominations', key: 'awards.combined' },
			],
			default: 'Points',
		},
		...['genre', 'country', 'language'].map(key => ({
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
			<a class="nav__main__home" href="/" on:change={() => push('/')}>
				<span>🏚️</span>
			</a>
			<div class="nav__main__data">
				<div class="nav__data">
					<strong>Order</strong>: {order}
				</div>
				<div class="nav__data">
					{#if Object.keys(selectedOptions).length > 0}
						<strong>Filters: </strong>
						{#each Object.entries(selectedOptions) as [key, val]}
							{#if val.toLowerCase() !== 'all'}
								<span class="nav__data__filter">
									{val}
								</span>
							{/if}
						{/each}
					{/if}
				</div>
			</div>
			<select value={year_value} on:change={changeYear}>
				{#each ['Year', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'] as year}
					<option value={year} disabled={year === 'Year'}>
						{year !== 'Year' ? `'${year.substr(2)}` : 'Year' }
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
				disabled={format_value !== 'film' || isLoading}
			>
				...
			</button>
		</div>
		{#if display}
			<NavOptions
				getOptions={getOptions}
				selectedOptions={selectedOptions}
				updateSort={updateSort}
				updateOptions={updateOptions}
				toggleUninterested={toggleUninterested}
				seeUninterested={seeUninterested}
				order={order}
			/>
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