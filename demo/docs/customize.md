# Customize

## Basics

TODO

TODO

TODO

TODO

TODO

TODO

TODO
TODO

TODO

TODO
TODO

TODO

TODO

## Templates

TODO

TODO

TODO

TODO

TODO

TODO

TODO
TODO

TODO

TODO
TODO

TODO

TODO

## Data sources

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
| /api/slides/index                   | Index of slideshows                   |
| /api/source/:source                 | Retrieve blog entry                   |
| /api/archive                        | Retrieve blog archive                 |
