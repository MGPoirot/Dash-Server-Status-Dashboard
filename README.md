# Dash Server Status Dashboard
Dash is a lightweight Gatsby-based dashboard. It is a frontend to to monitor a variety of externally logged server states. 

*Dashboard* The main component of Dash is the dashboard shown on its homepage. This homepage shows a tile layout of all "Definitions". Definitions 

Already implemented:
- Tile based homepage showing key "Definition" information and "Latest" values.
- When a tile is clicked, it leads to a dedicated page showing the "Definition", "Latest", and "Series" as raw data.
- Status-based edge colors around tiles on the homepage.
- Dark and light mode theme toggle.
- Mobile and desktop menu bar.

To be implemented
- homepage
- In general, all definitions/tiles should be sorted based on status (Critical, Warning, Stale, Good).
- A "Group" toggle should toggle clustering of tiles from No clustering, to clustering `type` to clustering by `type` and parent and back. When clustered, groups of tiles are shown surrounded by a html fieldset-like grouping.
- The dedicated pages should be formatted as follows:
-- In the head in large all fields should be formatted   

✅ OK 
ℹ️ Info
⚠️ Warning
🚨 Critical
❓ Stale

- On the homepage, tiles should be sorted by status, then by priority

- the `src/pages/data-specifications.md page should be parsed into a page and located at /docs




# Changes for later versions:
- Definition files should be editable from their dedicated page.
- Definition files should be create-able from the frontend
- Integrations files should receive a dedicated page and should be editable.