# Standing rules

After every completed change, run git add, commit with a clear message, and push to main without asking me first. Cloudflare auto-deploys every push to main. Never edit or delete public/_redirects unless I explicitly ask.

The site is live. Edit the official pages in place. Never break /, the badge QR destination.

Official URLs: / (Home), /schedule/, /breakouts/ (detail ?b=<id>), /map/ (room ?room=<id>), /resources/. Hidden one-off page: /directions/ (no links to the guide, no splash). Version 1 and 2 pages stay live, hidden and untouched. Never create new versions or archives unless explicitly asked.

The official pages' CSS and JS live in public/assets/v3/ and are cached for a year: after editing one, bump its ?v= number in every page that loads it.
