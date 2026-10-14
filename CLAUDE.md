# Standing rules

After every completed change, run git add, commit with a clear message, and push to main without asking me first. Cloudflare auto-deploys every push to main. Never edit or delete public/_redirects unless I explicitly ask.

Every new round of changes becomes the next version (version3, version4, ...). Copy the latest version's pages (`public/<page>-versionN/`) and its `public/assets/vN/` folder to the next number, give the copy its own `ROUTES` object so it links only to its own pages, and make the changes there. Earlier versions stay frozen and live: never edit a published version's pages, CSS or JS.
