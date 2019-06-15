# Customize

## Custom data source

By default, `@nuxt/press` loads content from the file system. 

For **`docs`** mode, it will load all Markdown files in the current directory 
and sub directories recursively and group them in a _serial list of **topics**_.

Their final URL follows the format:

```
/topic/<slugified-h1-from-markdown-file>
```

For **`blogs`** mode, Markdown files are grouped as a *_chronological list of 
entries_*. 

Their final URL follows the format:

```
/<year>/<month>/<slugified-h1-from-markdown-file>
```

You can **disable filesystem loading** altogether by providing custom API
handlers for retrieving indexes and Markdown source files.

| API method                          | Role                                  |
| ----------------------------------- | ------------------------------------- |
| /api/docs/index                     | Index of documentation topics         |
| /api/blog/index                     | Latest blog entries                   |
| /api/blog/archive                   | Dated archive of blog entries         |
| /api/slides/index                   | Index of slideshows |
| /api/source/:source                 | Retrieve blog entry    |
| /api/archive                        | Retrieve blog archive  |

TODO: detail config options and expected JSON format of API handlers.

## Taildwind CSS theme

TODO: document how to provide custom Tailwind CSS theme.

## Ejecting templates

TODO: detail process of overriding default templates.

### Blog components

```sh
nuxt press eject blog/layout (layout component)
nuxt press eject blog/index (index page route component)
nuxt press eject blog/entry (entry page route component)
nuxt press eject blog/entry/cover (entry cover image template)
nuxt press eject blog/archive (archive page route component)
```

### Docs components

```sh
nuxt press eject docs/layout (layout component)
nuxt press eject docs/toc (sidebar summary component)
nuxt press eject docs/index (index page route)
nuxt press eject docs/entry (entry page route)
```