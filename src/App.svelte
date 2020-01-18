<script>
	import ComponentA from './ComponentA.svelte';
	import ComponentB from './ComponentB.svelte';
	import ListBreakdown from './ListBreakdown.svelte';
	import Router from 'svelte-spa-router';
	import axios from 'axios';
	import { processListsWithRankings } from './analytics';
	import data from '../data/2010-film.json';

	const routes = {
		'/:format': ComponentA,
		'/:format/:year': ListBreakdown,
    '*': ComponentA,
	}
	let jso = JSON.stringify(processListsWithRankings(data.critics));
	let jso2;

	const handleClick = () => {
		axios.get('/2017-film.json').then(({data}) => {
			jso2 = JSON.stringify(
				processListsWithRankings(
					data.critics
				)
			);
		});
	}

</script>

<body>
<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	
	<div style="display: flex;">
		<strong>Title</strong>
		<a href="#/CompA/">Other Component A to see that it works going from A to B </a><br/>
		<a href="#/film/2015/">Films 2015</a><br/>
		<a href="#/film/2016/">Films 2016</a><br/>
		<a href="#/album/2010s/">Album 2010s</a><br/>
	</div>
	
	<Router {routes}/>
	<!-- <div>
		{jso2 || jso}
	</div> -->
	
</body>