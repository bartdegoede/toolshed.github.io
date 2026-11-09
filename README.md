# toolshed.run

The website for [toolshed](https://github.com/bartdegoede/toolshed), at
<https://toolshed.run>. A [Hugo](https://gohugo.io) site with its own theme,
made to look and work like the toolshed TUI: the same colours and layout, and
the same keys (`↑↓`/`j k`, `enter`, `/`, `?`), on top of ordinary links.

## Where the content comes from

The docs pages are **not** in this repo. They're the `docs/*.md` files of the
toolshed repo, pulled in as a Hugo module (see `module` in `hugo.yaml`), so
the docs live next to the code and can't drift. `content/docs/_content.gotmpl`
turns each file into a page: the `# Title` line becomes the title, and the
`<!-- summary: … -->` line the summary in the page list. Render hooks in
`layouts/_markup/` point the files' GitHub-style links (`secrets.md`,
`../registry.yaml`) at the right places. The page order is `params.docs` in
`hugo.yaml`.

CI builds against the latest toolshed release. The daily run picks up a new
release; to publish one straight away, run the Deploy workflow by hand.

This repo has the theme (`layouts/`, `assets/`) and the home page
(`layouts/index.html`).

## Working on it

```sh
# against your local toolshed checkout, to see docs changes before a release
HUGO_MODULE_REPLACEMENTS="github.com/bartdegoede/toolshed -> $PWD/../toolshed" hugo server

# against the pinned release
hugo server
```
