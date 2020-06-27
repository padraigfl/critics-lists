<script>
	import { OPTIONS, SOURCE } from '../store';
</script>

<svelte:head>
  <title>Critics Lists: Intro</title>
</svelte:head>
<div class="Landing">
	<h1>Aggregated End-of-Year Lists 2010-2010s</h1>

	<h2>What does it do?</h2>
	<p>
		Metacritic gathers up all these lists every year and makes a pretty basic top 20 out of it.
		This site presents a longer list from the same data with some additional data points (film only) to make it easier to unearth some gems.
		There's some basic means of sorting and filtering results too so you can find stuff for a particular mood more quickly.
	</p>

	<h2>Features</h2>

	<ol>
		<li>Year Lists aggregated using a custom weighting scheme (#1 gets 10 points, #2 gets 9, etc), this will be customisable in the future</li>
		<li>Genre, country and language filters</li>
		<li>Sorting options</li>
		<li>A custom list for each format to track items you've flagged, which is then viewable at <a href="/#/interested/film">Film</a>, <a href="/#/interested/tv">TV</a> and <a href="/#/interested/album">Music</a></li>
		<li>Three customisable filter options to reduce list size (options are icon based, other than the list one you can interpret them as you like)</li>
		<li>Some generated factoids about the content of the lists, I don't think I've gotten much of interest from these tbh</li>
	</ol>

	<h2>Motive</h2>
	<p>
		If you're a pretty obsessive film snob you probably know the bulk of stuff in Metacritic's aggregated top 20, and have probably seen most of them.
		The really interesting stuff are the things that maybe only 3 critics even saw yet one of them deemed worthy of their
		top 10, hidden away on Rotten Tomatoes with a 90% average from 10 reviews, and on page 6 of Letterbox'd by the overload of very softly graded
		music docs.
	</p>
	<p>
		Each year I'd trawl through endless top 10s looking for names I didn't recognise, Googling every one and usually unearthing a couple of neat indies at thevery least...
		It was pretty tedious stuff when you could dismiss half of them with just a few other data points
		(e.g. by a filmmaker I don't like; or had already dismissed but forgotten the name). Finding it increasingly hard to
		find new interesting things to watch and having to trawl through all the noise in lists on Letterbox'd, I decided to try
		and make something from this data on metacritic aggregated with a movie database
	</p>
	<p>...and, er, I also wanted to see how far I could push a 2 color style (#eeeeee and #111111)</p>

	<h2>Still to do</h2>
	<ul>
		<li>Multiple points weighting systems</li>
		<li>Aggregation of the individual year lists (would be a very large file download)</li>
		<li>Extra data for TV shows</li>
		<li>Style improvements (e.g. cleaner navigation)</li>
		<li>Performance issue resolutions</li>
		<li>Data fixes</li>
		<li>Clean up the code, I hadn't a clue how Svelte works at the start and it really shows. The CSS needs to be restructured too</li>
	</ul>

	<h2>Things I won't do</h2>
	<ul>
		<li>Album data: the hassle in sanitizing the data would be absolutely huge due to only having a string to work from</li>
		<li>Display images on load: would involve loading so many assets at once that I'm not hosting, seems douchey</li>
		<li>Save lists between devices: using local storage of browser, there is no server involved</li>
		<li>Up to date data: Again, due to no server being involved. Although I might be able to throw together a script to occasionally update this.</li>
	</ul>

	<h2>Sources</h2>

	<p>The full collection of lists available are</p>
	{#each OPTIONS.formats as format}
		<div class="yearList">
			<h3>{format.toUpperCase()}</h3>
			<ul >
				{#each OPTIONS.years as year}
					<li>
						<a class="yearLink" href={`/#/${format}/${year}`}>
							{year}
						</a> – [<a href={`/${format}/${year}.json`}>JSON</a>,
						<a href={SOURCE[format][year]} target="_blank">Source</a>]
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	<h2>Bye</h2>
	<p>
		Oh, and sorry about the obnoxious marquee element on the side. If you're on mobile you cant see it so here are the links.
		{#each [
			{ link: 'github.com/padraigfl', text: 'Github' },
			{ link: 'github.com/padraigfl/critic-lists', text: 'Source code'},
			{ link: 'dvd-rom.netlify.app', text: 'DVD Menu Simulator' },
			{ link: 'packard-belle.netlify.com', text: 'Windows98 Clone' },
			{ link: 'react-coursebuilder.netlify.com', text: 'Youtube App thing' },
		] as {link, text}, i}
			{#if i > 0}
				{' '}—
			{/if}
			<a href={`https://${link}`} target="_blank">{text}</a>
		{/each}
	</p>

	<p>If you're actually using this and have some feedback, I'd love to hear it, try my Github ^</p>
</div>
