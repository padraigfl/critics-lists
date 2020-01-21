<script>
	import ComponentA from './ComponentA.svelte';
	import ComponentB from './ComponentB.svelte';
	import ListBreakdown from './ListBreakdown.svelte';
	import Router, { push } from 'svelte-spa-router';
	import axios from 'axios';
	import { processListsWithRankings } from './analytics';
	import data from '../data/2010-film.json';
	import smallData from '../data/small/2010-film.json';

	const routes = {
		'/:format': ComponentA,
		'/:format/:year': ListBreakdown,
    '*': ComponentA,
	}
	let jso = JSON.stringify(processListsWithRankings(data.critics));
	let jso2;
	let year = "2010";
	let format = "film";

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

	const changeYear = (e) => {
		year = e.target.value;
		push(`/${format}/${year}`);
	};

	const changeFormat = (e) => {
		format = e.target.value;
		push(`/${format}/${year}`);
	}

</script>

<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	
	<div style="display: flex;">
		<strong>Title</strong>
		<select value={year} on:change={changeYear}>
			{#each ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'] as year}
				<option value={year}>
					{ year }
				</option>
			{/each}
		</select>
		<select value={format} on:change={changeFormat}>
			{#each ['film', 'tv', 'album'] as year}
				<option value={year}>
					{ year }
				</option>
			{/each}
		</select>
	</div>
	
	<Router {routes}/>
	<!-- <div>
		{jso2 || jso}
	</div> -->
	