# Dash Server Status Dashboard
Dash is a lightweight Gatsby-based dashboard. It is a frontend to to monitor a variety of externally logged server states. 

*Dashboard* The main component of Dash is the dashboard shown on its homepage. This homepage shows a tile layout of all metrics.  

Already implemented:
- Tile based homepage showing key "Config" information and "Latest" values.
- When a tile is clicked, it leads to a dedicated page showing the "Config", "Latest", and "Series" as raw data.
- Status-based edge colors around tiles on the homepage.
- Dark and light mode theme toggle.
- Mobile and desktop menu bar.

To be implemented
- homepage
- In general, all configs/tiles should be sorted based on status (ok, stale, info, warning, critical).
- A "Group" toggle should toggle clustering of tiles from No clustering, to clustering `type` to clustering by `type` and `component` and back. When clustered, groups of tiles are shown surrounded by a html fieldset-like grouping.
- The dedicated pages should be formatted as follows:
-- In the head in large all fields should be formatted   



- On the homepage, tiles should be sorted by status, then by priority

- the `src/pages/data-specifications.md page should be parsed into a page and located at /docs




# Changes for later versions:
- Config files should be editable from their dedicated page.
- Config files should be create-able from the frontend
- Integrations files should receive a dedicated page and should be editable.