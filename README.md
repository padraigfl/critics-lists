# Metacritic year-end aggregations aggregator

Every year Metacritic got to the effort of collecting loads of year end lists but asides from giving an aggregated top 20 they don't do anything with the info. I would wind up trawling throught the collection of the lists at the bottom for names I didn't recognise.
This is me attempting to pull something useful out of the script I threw together for myself.

## Why's it a mess?

Well, I decided to use Svelte, and I done almost all of it offline, so I was kinda just blindly figuring out Svelte as I worked through it. This has made it a bit of a nightmare to expand upon tbh... Will try and add some bits and pieces to make filters persist and hide things you don't care about (e.g. things you've already seen/heard).

## What would I do differently?

I probably should've had a runthorugh of how Svelte updates components first. Other than that most of the frustrations revolved around sanitizing the data.

Oh, and I hate the layout, weirdness for weirdness sake and the 2 color restriction I set for myself was really hard to follow.

## Future updates

Lord knows when I'll get to most of these

- End of year lists for 2020
- Hide stuff you don't care about
- Aggregate individual lists from 2010 to 2019, compare against 2010s decade lists
- TV data from omdb
- Fix all the bad Svelte bits (this'll never happen, lets be real)
