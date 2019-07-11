# Publishing slides

NuxtPress will parse each slide from Markdown using `#` as the delimiter. If text follows `#`, it's appended as a `<h1>` tag. If not, it's simply used as the delimiter and no `<h1>` tag is added.

The following example represents four slides. It is a single file, but here it is shown divided in sections to illustrate the processing.

```md

My Presentation
(opener, slide 1)

```
```md
# Slide 2 header

Slide 2 text

```
```md
#

Slide 3 text
(slide with no header)

```
```md
# Slide 4 header

Slide 4 text

```

This is a simplification from [MDX][mdx], which uses `---` as delimiter.

[mdx]: https://mdxjs.com/
