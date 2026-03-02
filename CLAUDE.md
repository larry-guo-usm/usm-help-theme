# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This project is a Zendesk Help Center theme forked from Copenhagen, customized for US Mobile (a telco company based in New York).

@AGENTS.md

## USM Customizations

These features have been added on top of the base Copenhagen theme:

### Article TOC (`src/article-toc.js`, `styles/_article-toc.scss`)
Generates a "On this page" table of contents for article pages. Scans `.article-body` for h2/h3/h4 headings, builds a sticky right-side TOC panel with scroll-spy. Hidden if fewer than 2 headings. On mobile, renders as a bottom-sheet modal triggered by a button before `.article-info`.

### Sections Sub-nav (`src/sections-subnav.js`, `styles/_sub-nav.scss`)
Horizontal sub-navigation bar for section pages listing sibling sections.

### Mobile Search (`src/mobile-search.js`)
Search toggle behavior for mobile viewports.

### Home Section Links (`src/home-section-links.js`)
Enhances section link behavior on the home page.

### Custom SCSS files added (not in base Copenhagen)
- `styles/_article-toc.scss` — TOC sidebar + mobile modal
- `styles/_home-page.scss` — Home page layout customizations
- `styles/_hero.scss` — Hero section styles
- `styles/_article.scss` — Article page layout
- `styles/_collapsible-sidebar.scss` — Collapsible sidebar for section/category pages
- `styles/_sub-nav.scss` — Section sub-navigation bar
