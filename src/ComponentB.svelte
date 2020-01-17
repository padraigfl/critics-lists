<script>
	import {onMount} from 'svelte';
	export let params;
	let rolled;
	//onMount(()=>rolled=Math.floor(Math.random() * params.bound) + 1);
	//With the onMount instead of the assignment below, when you go from a die with 7 sides to one with 15 or vice-versa, it does not update rolled. With the function below, it does, but it does not re-roll if you route from the 7-sided die back to the 7-sided die.
	
	$: {
		rolled = Math.floor(Math.random() * params.bound) + 1;
	}
	
</script>

Rolled Dice with {params.bound} sides: {rolled}