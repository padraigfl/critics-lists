<script>
	import ComponentA from './components/ComponentA.svelte';
	import Landing from './components/Landing.svelte';
	import ListBreakdown from './components/ListPage.svelte';
	import InterestedPage from './components/InterestedPage.svelte';
	import Nav from './components/Nav/Nav.svelte';
	import Router, { push } from 'svelte-spa-router';
	import axios from 'axios';
	import './styles.scss';

	const routes = {
		'/': Landing,
		'/interested/:format': InterestedPage,
		'/:format': ComponentA,
		'/:format/:year': ListBreakdown,
    '*': ComponentA,
	}

</script>

<!-- In either case, if you go from Component A to Component B, it will randomly roll the die. With the 2nd method, it'll also randomly roll it if you go from component B with one parameter to component B with a different parameter. But neither way will it re-roll if you go from component B with parameter 7 back to the same exact route. -->
	
	<Nav />
	<!-- <div class="nav">
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
			...
		</button>
		{#if display}
			<div class="nav__options">
				<ul>
					{#each options as opt}
						<li>
							<select on:change={updateOptions(opt.key, opt.type)} value={optionValue[opt.key]}>
								{#each opt.options as selectOption}
									<option value={selectOption.title} >
										{selectOption.title}
									</option>
								{/each}
							</select>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div> -->

	<div class="wasAMarquee">
		{#each [
			{ link: 'github.com/padraigfl', text: 'Github' },
			{ link: 'github.com/padraigfl/critic-lists', text: 'Source code'},
			{ link: 'packard-belle.netlify.com', text: 'Windows98 Clone' },
			{ link: 'react-coursebuilder.netlify.com', text: 'Youtube App thing' },
			{ link: 'dvd-rom.netlify.app/', text: 'DVD menu recreations' }
		] as {link, text}, i}
			{#if i > 0}
				{' '}—
			{/if}
			<a href={`https://${link}`} target="_blank">{text}</a>
		{/each}
	</div>
	
	<Router {routes}/>
	<!-- <div>
		{jso2 || jso}
	</div> -->
	