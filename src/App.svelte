<script>
	import ComponentA from './ComponentA.svelte';
	import ComponentB from './ComponentB.svelte';
	import ListBreakdown from './ListBreakdown.svelte';
	import Modal from './Modal.svelte';
	import Router, { push } from 'svelte-spa-router';
	import axios from 'axios';
	import { processListsWithRankings } from './analytics';
  import { year, format } from './store';
	import data from '../data/2010-film.json';
	import smallData from '../data/small/2010-film.json';

	const routes = {
		'/': ComponentB,
		'/:format': ComponentA,
		'/:format/:year': ListBreakdown,
    '*': ComponentA,
	}
	let display;
	let year_value;
	let format_value;
	const defaultMatrix = {
		1: 10,
		2: 1,
		3: 1,
		4: 1,
		5: 1,
		6: 1,
		7: 1,
		8: 1,
		9: 1,
		10: 1,
		'_': 1,
	};
	$: matrix = defaultMatrix;

	window.smallData = smallData;

	const handleClick = () => {
		axios.get('/2017-film.json').then(({data}) => {
			jso2 = JSON.stringify(
				processListsWithRankings(
					data.critics
				)
			);
		});
	}

	year.subscribe(value => {
		year_value = value;
	});
	format.subscribe(value => {
		format_value = value;
	});

	const changeYear = (e) => {
		push(`/${format_value}/${e.target.value}`);
	};

	const changeFormat = (e) => {
		push(`/${e.target.value}/${year_value}`);
	}

	const toggle = () => {
		display = !display;
		$: matrix = defaultMatrix;
	}

	const update = key => e => {
		matrix = {
			...matrix,
			[key]: e.target.value,
		}
	}

	const saveNewMatrix = () => {
		defaultMatrix = matrix;
		close();
	}
</script>

<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	
	<div style="display: flex; height: 40px;">
		<strong>Title</strong>
		<select value={year_value} on:change={changeYear}>
			{#each ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'] as year}
				<option value={year}>
					{ year }
				</option>
			{/each}
		</select>
		<select value={format_value} on:change={changeFormat}>
			{#each ['film', 'tv', 'album'] as year}
				<option value={year}>
					{ year }
				</option>
			{/each}
		</select>
		<button on:click={toggle}>
			Scoring Metric
		</button>
	</div>

	{#if display}
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

	<marquee>
		Thanks for checking this out.
		{#each [
			{ link: 'github.com/padraigfl', text: 'My Github' },
			{ link: 'github.com/padraigfl/critic-lists', text: 'Source code'},
			{ link: 'packard-belle.netlify.com', text: 'another thing I made' },
			{ link: 'react-coursebuilder.netlify.com', text: 'aand another' },
		] as {link, text}, i}
			{#if i > 0}
				{' '}—
			{/if}
			<a href={`https://${link}`} _target="_blank">{text}</a>
		{/each}
	</marquee>
	
	<Router {routes}/>
	<!-- <div>
		{jso2 || jso}
	</div> -->
	