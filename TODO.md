QUICK NOTES FOR 2021
- [] verify new files can be written prior to API request
- [] steps for adding new year of data
- [] scripts (e.g OMDB_KEY=xxxxx node ./scripts/omdb/fetch.js)

Important and/or easy:
- [x] BUG Resolve scroll bug across devices, verify
- [x] Update data script to run one request at a time
- [x] Add data update script (used IMDb IDs for guaranteed matches)
- [x] Multiple scoring systems
- [] Query string holding search values for routing purposes
- [] Link to lists within expanded details
- [x] Add TV data fetch script
- [x] Investigate music API options (using spotify)
- [] resolve loading issues (display from second page stalls processing)
- [x] update film and tv to use same data format
- [] indexedDB for old lists
- [x] Explanation of weighting systems

Fixes:
- [] Clean up scrape scripts
- [] Repair 2020 script hacks
- [] Omdb fetch formatting match omdb update

Nice to have:
- [] Generate weighted decade list 
- [] Custom weighting system
- [] Only display lists containing a specific entry (e.g.if a 2019 list excluded Parasite odds are it'll be using UK release dates, which may add a lot of noise to the list)
- [] Exclude lists containing a specific entry (e.g. same as above, but also I'm not gonna trust a list that thinks Bombshell is top 10 for 2019)
- [] Letterbox'd/IMDb friendly exportable data for watchlists
