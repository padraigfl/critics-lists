<script>
	import Modal from './Modal.svelte';
	import NavOptions from './NavOptions.svelte';
	import axios from 'axios';
	import { push } from 'svelte-spa-router';
	import { processListsWithRankings, SCORING_MATRICES } from '../../analytics';
  import {
		loadingPage,
		year,
		format,
		scoringMatrix,
		filterOptions,
		filterSelections,
		ordering,
		viewUninterested,
		viewKnown,
		viewInterested,
	} from '../../store';
  import { OPTIONS, FILM, FORMATS, YEARS, ALBUM, TV } from '../../utils/constants';

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
	let seeUninterested = true;
	let seeInterested = true;
	let seeKnown = true;
	$: matrix = SCORING_MATRICES.default;

	const onClickOutside = (e) => {
		const nav = document.querySelector('.nav');
		if (!nav.contains(e.target) && !!display) {
			toggle();
		}
	}

	viewUninterested.subscribe((val) => seeUninterested = val);
	viewKnown.subscribe((val) => seeKnown = val);
	viewInterested.subscribe((val) => seeInterested = val);

	filterSelections.subscribe((val) => selectedOptions = val);

	year.subscribe(value => {
		year_value = value;
	});
	format.subscribe(value => {
		format_value = value;
		if (value !== FILM) {
			display = false
		}
  });
  const changeYear = (e) => {
		year.update(() => e.target.value);
		filterSelections.update(() => ({}));
		if (!OPTIONS.formats.includes(format_value)) {
			return;
		}
		if (OPTIONS.years.includes(e.target.value)) {
			loadPage(`/l/${format_value}/${e.target.value}`)
		} else if (e.target.value === 'List') {
			loadPage(`/interested/${format_value}`)
		}
		window.scroll(0, 0);
	};

	const toggleUninterested = () => {
		viewUninterested.update(() => !seeUninterested);
	}
	const toggleInterested = () => {
		viewInterested.update(() => !seeInterested);
	}
	const toggleKnown = () => {
		viewKnown.update(() => !seeKnown);
	}

	const changeFormat = (e) => {
    format.update(() => e.target.value);
		filterSelections.update(() => ({}));
		ordering.update(() => ({ key: 'score' }))
		if (year_value === 'List' 
			&& OPTIONS.formats.includes(e.target.value)
		) {
			loadPage(`/interested/${e.target.value}`);
			return;
		}
		if (
			OPTIONS.years.includes(year_value)
			&& OPTIONS.formats.includes(e.target.value)
		) {
			loadPage(`/l/${e.target.value}/${year_value}`);
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

	const getFilmFilters = () => ['genre', 'country', 'language'].map(key => ({
			title: key,
			type: 'filter',
			options: Object.entries(availableOptions[format_value][key]),
		}));

	const orderMusicFilters = (filters) => {
		if (!filters) { return []; }
		const entries = Object.entries(filters);
		// NOTE: Spotify genres are crazy specific, list is huge without filtering smaller entries
		return entries.filter(([,number]) => number >= 4);
	}

	const getMusicFilters = () => ['genre'].map(key => ({
			title: key,
			type: 'filter',
			options: format_value !== 'Format'
				? orderMusicFilters(availableOptions[format_value][key])
				: [],
		}));

	const getOptions = () => {
		console.log('options');
		if (format_value !== TV && format_value !== FILM) {
			return [{
				title: 'Sort by',
				type: 'sort',
				options: year_value !== 'List'
					? [
						{ title: 'Score', key: 'score' },
						{ title: 'Popularity', key: 'popularity' },
						{ title: 'Longest', key: 'length' },
					]
					: [],
			}, ...getMusicFilters()];
		}
		const options = [
			{
				title: "Sort by",
				type: 'sort',
				options: year_value !== 'List'
					? [
						{ title: 'Points', key: 'score' },
						// { title: 'Box Office', key: 'boxOffice' }, seems to be buggy af
						// { title: '# lists', key: 'val.critics.length' },
						// { title: '# firsts', key: 'val.firsts.length' },
						{ title: 'IMDb votes', key: 'imdbVotes' },
						{ title: 'IMDb rating', key: 'imdbRating' },
						{ title: 'Awards', key: 'awards.wins' },
						{ title: 'Awards+Noms', key: 'awards.combined' },
					] : [
						{ title: 'Release', key: 'release' },
					],
				default: year_value !== 'List' ? 'Points' : 'Release',
			}
		];
		if (format_value === FILM && options[0] && options[0].options) {
			options[0].options.push({ title: 'Length', key: 'runtime' })
		}
    return [
			...options,
			...getFilmFilters(),
		]
	}

  filterOptions.subscribe(val => {
		availableOptions = val;
		console.log(availableOptions);
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
		ordering.update(() => o);
    toggle();
  };
 
</script>
	
	<div class="nav">
		<div class="nav__main">
			<a class="nav__main__home" href="/" on:change={() => loadPage('/')}>
				<span>🏚️</span>
			</a>
			<div class="nav__main__data">
				{#if format_value !== 'Format' && year_value !== 'Year'}
					<div class="nav__data">
						<strong>Order</strong>: {order.key} { order.invert ? 'reverse' : ''}
					</div>
					{#if !seeKnown || !seeInterested || !seeUninterested || (Object.keys(selectedOptions).length > 0  && Object.values(selectedOptions).every(v => v.toLowerCase() !== 'all'))}
						<div class="nav__data">
							<strong>Filters: </strong>
							{#each Object.entries(selectedOptions).filter(v => v[1].toLowerCase() !== 'all') as [key, val]}
								<span class="nav__data__filter">
									{val}
								</span>
							{/each}
							{#if  !seeKnown || !seeInterested || !seeUninterested}
								Hide
								{#if !seeKnown}
									<div class="nav__data__filter nav__data__filter--known" />
								{/if}
								{#if !seeInterested}
									<div class="nav__data__filter nav__data__filter--interested" />
								{/if}
								{#if !seeUninterested}
									<div class="nav__data__filter nav__data__filter--uninterested" />
								{/if}
							{/if}
						</div>
					{/if}
				{/if}
			</div>
			<select value={year_value} on:change={changeYear}>
				{#each ['Year', ...YEARS, 'List'] as year}
					<option value={year} disabled={year === 'Year'}>
						{year.match(/\d{4}/) ? `'${year.substr(2)}` : year }
					</option>
				{/each}
			</select>
			<select value={format_value} on:change={changeFormat}>
				{#each ['Format', ...FORMATS] as format}
					<option value={format} disabled={format === 'Format'}>
						{ format }
					</option>
				{/each}
			</select>
			<button
				on:click={toggle}
				class={`nav__button ${display ? "nav__button--active" : ''}`}
				disabled={year_value === 'List'}
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
				order={order}
				checkboxes={
					year_value !== 'List'
					? [
						{ goal: 'Hide', title: 'yep', toggle: toggleKnown, checked: !seeKnown },
						{ goal: 'Hide', title: 'ooh', toggle: toggleInterested, checked: !seeInterested },
						{ goal: 'Hide', title: 'meh', toggle: toggleUninterested, checked: !seeUninterested },
					]
					: []
				}
			/>
		{/if}
	</div>