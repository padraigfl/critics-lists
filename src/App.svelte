<script>
	import Landing from './components/Landing.svelte';
	import ListBreakdown from './components/ListPage.svelte';
	import InterestedPage from './components/InterestedPage.svelte';
	import Nav from './components/Nav/Nav.svelte';
	import FourOhFour from './components/404.svelte';
	import FAQ from './components/FAQ.svelte';
	import Router, { push } from 'svelte-spa-router';
	import axios from 'axios';
	import './styles.scss';

	const routes = {
		'/': Landing,
		'/interested/:format': InterestedPage,
		'/l/:format/:year': ListBreakdown,
		'/faq': FAQ,
    '/*': FourOhFour,
	}

</script>
<Nav />
<div class="wasAMarquee">
	{#each [
		{ link: 'github.com/padraigfl', text: 'Github' },
		{ link: 'github.com/padraigfl/critic-lists', text: 'Source code'},
		{ link: 'packard-belle.netlify.com', text: 'Windows98 Clone' },
		{ link: 'react-coursebuilder.netlify.com', text: 'Youtube App thing' },
		{ link: 'dvd-rom.netlify.app/', text: 'DVD menu recreations (Shrek, Matrix)' }
	] as {link, text}, i}
		{#if i > 0}
			{' '}—
		{/if}
		<a href={`https://${link}`} target="_blank">{text}</a>
	{/each}
</div>

<Router {routes}/>
	