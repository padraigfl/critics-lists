<script>
	import ComponentA from './ComponentA.svelte';
	import Landing from './Landing.svelte';
	import ListBreakdown from './ListBreakdown.svelte';
	import Modal from './Modal.svelte';
	import Router, { push } from 'svelte-spa-router';
	import axios from 'axios';
	import { processListsWithRankings, defaultScoringMatrix } from './analytics';
  import { loadingPage, year, format, scoringMatrix, OPTIONS } from './store';

	const routes = {
		'/': Landing,
		'/:format': ComponentA,
		'/:format/:year': ListBreakdown,
    '*': ComponentA,
	}
	let display;
	let year_value = 'Year';
	let format_value = 'Format';
	let matrix_value;
	let isLoading;
	$: matrix = defaultScoringMatrix;


	year.subscribe(value => {
		year_value = value;
	});
	format.subscribe(value => {
		format_value = value;
	});

	scoringMatrix.subscribe(value => {
		matrix_value = value;
	});

	loadingPage.subscribe(value => {
		isLoading = value;
	});

	const loadPage = (page) => {
		loadingPage.update(() => true);
		push(page);
		window.scroll(0, 0);
	}

	const changeYear = (e) => {
		console.log(format_value, e.target.value);
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
		console.log(year_value, e.target.value);
    format.update(() => e.target.value);
		if (
			OPTIONS.years.includes(year_value)
			&& OPTIONS.formats.includes(e.target.value)
		) {
			loadPage(`/${e.target.value}/${year_value}`);
		}
	}

	const toggle = () => {
		display = !display;
	}

	const update = key => e => {
		matrix = {
			...matrix,
			[key]: +e.target.value,
		}
	}

	const saveNewMatrix = () => {
		scoringMatrix.update(() => matrix);
		toggle();
	}
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
			Scoring Metric
		</button>
	</div>

	<div class="wasAMarquee">
		{#each [
			{ link: 'github.com/padraigfl', text: 'Github' },
			{ link: 'github.com/padraigfl/critic-lists', text: 'Source code'},
			{ link: 'packard-belle.netlify.com', text: 'Windows98 Clone' },
			{ link: 'react-coursebuilder.netlify.com', text: 'Youtube App thing' },
		] as {link, text}, i}
			{#if i > 0}
				{' '}—
			{/if}
			<a href={`https://${link}`} target="_blank">{text}</a>
		{/each}
	</div>

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
						<input max="100" class="matrix__input" type="number" on:change={update(entry)} bind:value={matrix[entry]}/>
					</div>
				{/each}
			</div>
			<button style="float:right;" on:click={saveNewMatrix}>Update</button>
		</Modal>
	{/if}
	
	<Router {routes}/>
	<!-- <div>
		{jso2 || jso}
	</div> -->
	