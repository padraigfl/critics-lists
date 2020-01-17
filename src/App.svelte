<script>
	import ComponentA from './ComponentA.svelte';
	import ComponentB from './ComponentB.svelte';
	import Router from 'svelte-spa-router';

	const routes = {
    '/CompA/': ComponentA,
    '/CompB/:bound': ComponentB,
    '*': ComponentA,
}


</script>

<body>
<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	<a href="#/CompA/">Other Component A to see that it works going from A to B </a><br/>
	<a href="#/CompB/7/">Component B: Roll a die with 7 sides</a><br/>
	<a href="#/CompB/15/">Component B: Roll a die with 15 sides</a><br/>
	Component, given by router below:<br/><br/>
	
	
	<Router {routes}/>
	
</body>