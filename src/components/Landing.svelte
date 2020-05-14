<script>
	import { OPTIONS, SOURCE } from '../store';
</script>

<svelte:head>
  <title>Critics Lists: Intro</title>
</svelte:head>
<div class="Landing">
	<p>This site collects data from a whole load of year end lists from over the last decade for the following purposes:</p>

	<ul>
		<li>Gathering and presenting additional data than has been provided by other aggregators</li>
		<li>Allow custom rating metrics and modifications (e.g. omitting lists)</li>
		<li>Quick searching of the listed entries (links only lead to searches on other sites, not direct links, sorry...)</li>
		<li>Make it easier for me to scroll down through it for some oddities</li>
		<li>Excuse to use Svelte kinda recklessly (I've done about 95% of this offline so been kinda guessing stuff from READMEs and the library source code)</li>
	</ul>

	<p>
		With respect to the data gathering, I'm mostly making it up as a go along.
		The key one I want to do is a an aggregated list of all the end of year lists to compare directly with the decade list, I also might try and weigh things in different ways (e.g. average out critics from publications with more than one list)
		As it stands there are a few metrics pulled from each list which I found interesting:
	</p>

	<ul>
		<li><strong># Unique Entries</strong> Obvious enough?</li>
		<li><strong>Highest ranked with no #</strong> Seems like a solid bet for an easy pleaser that potentially has slipped a bit under the radar? Alternatively it's just something people like to include in their list</li>
		<li><strong>Lowest ranked with a #1</strong> includes a validator for entries that only make a few lists. Not sure there's any one way to interpret this one.</li>
		<li><strong>Highest ranked pair that share no list</strong> Just a kinda cool contrast, potentially a means of signalling the biggest split in trends with mainstream critics</li>
		<li><strong>Most contrarian critic</strong> Person who's list matches up least with the overall weighted list, not sure there's anything of value from this, contains a validator for people who have totally obscure lists</li>
	</ul>

	<p>
		Other suggestions are extremely welcome, bear in mind that I only have access to the names and their rankings on lists here at the moment.<br/>
		Some of the data points could undoubtedly be cleaned up but I have no real interest in trying to (e.g. "<em>[Rock list]View metal albums list [not included in combined standings]</em>" is obviously not a critic)
	</p>

	<p>
		Lists display amount of number ones, amount of mentions, amount of awards won and nominations without an award.
	</p>

	<p>
		Film data is pulled from OMDb, some of it is going to be inaccurate and it was not all grabbed at the same time. It's mostly about giving some extra info without having to search.
	</p>

	<p>
		Oh, and sorry about the obnoxious marquee element on the side. If you're on mobile you cant see it so here are the links.
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
	</p>

	<p>Also sorry about the styles, I was mostly just messing around with stuff to see what I could make work, wanted to limit myself to two colors as well, for no reason whatsoever.</p>


	<div>
		The full collection of lists available are
		{#each OPTIONS.formats as format}
			<p>{format.toUpperCase()}</p>
			<ul>
				{#each OPTIONS.years as year}
					<li>
						<a  tyle={{ fontVariantNumeric: 'tabular-number' }} href={`/#/${format}/${year}`}>
							{year}
						</a> – [<a href={`/${format}/${year}.json`}>JSON</a>,
						<a href={SOURCE[format][year]} target="_blank">Source</a>]
					</li>
				{/each}
			</ul>
		{/each}
	</div>
</div>
