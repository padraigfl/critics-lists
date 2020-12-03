<script>
	import { SCORING_MATRICES } from '../analytics';
	import { OPTIONS, SOURCE } from '../utils/constants';
</script>

<svelte:head>
  <title>Critics Lists: Intro</title>
</svelte:head>
<div class="Landing">
	<h1>Aggregated End-of-Year Lists 2010-2010s</h1>
	<p>Select a year and format from the list above to see the aggregated end-of-year critics lists for a given year (list data derived from Metacritic)</p>

	<h2>What does it do?</h2>
	<p>
		Metacritic gathers up all these lists every year and makes a pretty basic top 20 out of it.
		This site presents a longer list from the same data with some additional data points to make it easier to unearth some gems.
	</p>

	<h2>Features</h2>

	<h3>Interested List</h3>
	<p>By clicking <img src="/icons/list-add.svg" alt="interested icon" style="margin-bottom:-5px;" /> you add that entry to a list viewable from the "List" option in the year filter (I should probably improve that) or via the following links</p>
	<ul style="list-style-type: none;">
		<li><a href="/#/list/film">Films</a></li>
		<li><a href="/#/list/album">Albums</a></li>
		<li><a href="/#/list/tv">TV Series</a></li>
	</ul>

	<h3>Filters</h3>
	<p>Each list offers limited generated feature options (e.g. genre, language)</p>
	<p>Additional custom filter options are achievable via three clickable icons on each entry. Asides from the list one, you can assign whatever meaning you deem appropriate.</p>

	<h3>Sorting</h3>
	<p>Sorting options are generated via additional data derived from OMDb for TV and Film and Spotify for Music. The Spotify data is highly unreliable but hopefully of some use.</p>
	<p><em>NOTE: When using sorting any entries which do not contain data to meet the sorting requirements will be removed (e.g. sorting by IMDb rating and a film has no IMDb rating associated with it)</em></p>

	<h3>Aggregated list scoring options</h3>
	<p>I tried to think of a few different means of scoring the aggregation to see if it could pull out some interesting results. The primary goal here is to try and make the top end of the lists contain things that perhaps got a bit forgotten or ignored in favour of bigger releases at the time.</p>
	<ul>
		{#each Object.entries(SCORING_MATRICES) as [name, { description }]}
			<li><strong>{name}</strong>: {description}</li>
		{/each}
	</ul>

	<h3>Generated list data</h3>
	<p>Err... this was causing performance issues and needs a rethink.</p>

	<hr />

	<h2>Motive</h2>
	<p>
		If you're a pretty obsessive film snob you probably know the bulk of stuff in Metacritic's aggregated top 20, and have probably seen most of them.
		The really interesting stuff are the things that maybe only 3 critics even saw yet one of them deemed worthy of their
		top 10, hidden away on Rotten Tomatoes with a 90% average from 10 reviews, and on page 6 of Letterbox'd by the overload of very softly graded
		music docs.
	</p>
	<p>
		Each year I'd trawl through endless top 10s looking for names I didn't recognise, Googling every one and usually unearthing a couple of neat indies at the very least...
		It was pretty tedious stuff when you could dismiss half of them with just a few other data points
		(e.g. by a filmmaker I don't like; or had already dismissed but forgotten the name). Finding it increasingly hard to
		find new interesting things to watch and having to trawl through all the noise in lists on Letterbox'd, I decided to try
		and make something from this data on metacritic aggregated with a movie database
	</p>
	<p>...and, er, I also wanted to see how far I could push a 2 color style (#eeeeee and #111111). This, combined with it being my first Svelte project, has left it an unmaintainable mess.</p>

	<h2>Still to do</h2>
	<ul>
		<li>Aggregation of the individual year lists (would be a very large file download)</li>
		<li>Performance issue resolutions (removed biggest culprits)</li>
		<li>Data fixes (ongoing, updates welcome)</li>
		<li>Clean up the code, I hadn't a clue how Svelte works at the start and it really shows. The CSS needs to be restructured too (doubt I'll ever bother with this)</li>
	</ul>

	<h2>Things I won't do</h2>
	<ul>
		<li>Display images on load: would involve loading so many assets at once that I'm not hosting, seems douchey</li>
		<li>Save lists between devices: using localStorage feature of web browser, there is no server involved</li>
		<li>Up to date data: Again, due to no server being involved. There is an update script to update the data occasionally.</li>
	</ul>

	<h2>Caveats</h2>
	<ul>
		<li>Filters entirely omit entries which do not have the values to filter, was the easiest way I could think to prevent issues</li>
		<li>Album data from spotify is very dirty, will clean up a little over time but not by loads</li>
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
			{ link: 'packard-belle.netlify.app', text: 'Windows98 Clone' },
			{ link: 'react-coursebuilder.netlify.app', text: 'Youtube App thing' },
			{ link: 'padraig-operator.netlify.app', text: 'Mobile-browser focused music sequencer experiment (very messy)' },
		] as {link, text}, i}
			{#if i > 0}
				{' '}—
			{/if}
			<a href={`https://${link}`} target="_blank">{text}</a>
		{/each}
	</p>

	<p>
		If you're actually using this and have some feedback, I'd love to hear it, try my Github ^.
		and if you just wanna be all encouraging, <a href="https://www.buymeacoffee.com/padraig" target="_blank">I think this thing works</a>
	</p>
</div>
