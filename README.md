# Hermes Folio

Three plugins for Hermes Desktop that hand work to each other: a sheet, a report and a board.

**Site:** https://adolanium.github.io/hermes-folio/

| Plugin | What it is | Install |
|---|---|---|
| [Sheets](https://github.com/Adolanium/hermes-sheets) | An agentic spreadsheet | `hermes plugins install Adolanium/hermes-sheets` |
| [Data](https://github.com/Adolanium/hermes-data) | An agentic report page | `hermes plugins install Adolanium/hermes-data` |
| [Whiteboard](https://github.com/Adolanium/hermes-whiteboard) | An agentic whiteboard | `hermes plugins install Adolanium/hermes-whiteboard` |

Each plugin works alone. Installed together, they pass tables and notes to each other on a click:

- **Chart** in Sheets opens the rows on screen as a report in Data.
- **Open in Sheets** in Data opens a report's table as a new grid.
- **Pin to board** in Sheets or Data puts rows or chart findings on your open Whiteboard board as notes.

The pages run in one app window and hand things over with a browser event. No file is written and no backend or model is involved in a handoff, and what arrives always becomes something new. Other Desktop plugins you have switched on share that window and could read such an event.

## This repository

This repository holds the site only: one static page (`index.html`, `site.css`) and its assets. The plugins live in their own repositories, linked above.

To look at the site locally, serve the folder with any static server:

```bash
python3 -m http.server 8080
```

The film on the site runs the real plugins. Hermes' replies in it are scripted so the film can be recorded; every number on screen is worked out by the plugins from the sample rows.

## License

MIT. An independent community project, not affiliated with Nous Research.
