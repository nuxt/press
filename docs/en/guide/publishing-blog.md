# Publishing blogs

You can structure Markdown files for the blog mode (under the configured lookup directory) in however many subdirectories you want (for grouping posts by year of publication for, for instance). What determines the publishing date of each blog entry is actually their Markdown source header.

By default, NuxtPress uses a simple format where the first line is parsed out as the publication date. **Titles** and **slugs** are automatically generated from the first heading (`#`) of your Markdown sources:

```
June 20, 2019

# Blog Entry's Title

```

If your Markdown sources however start with a `---`, NuxtPress will try and parse it via [gray-matter][gm] and will look for `title`, `slug` and `date`.

[gm]: https://github.com/jonschlinkert/gray-matter

```markup
---
title: Blog Entry's Title
date: June 20, 2019
slug: blog-entry-slug
---

# This Heading Is Not Used As Title

```

## Adding sidebar links

NuxtPress' default blog template makes it easy to automatically include sidebar text links.

Here's `nuxt.press.json` from [`examples/blog`][examples-blog].

[examples-blog]:  https://github.com/nuxt/press/tree/master/examples/blog

```json
{
  "blog": {
    "links": [
      {"Home": "/blog"},
      {"Archive": "/blog/archive"},
      {"About": "/blog/about"},
    ]
  }
}
```

This feature is mostly illustrative. You're likely to benefit more from ejecting the entire app bundle and adding your code for the `sidebar` component. Your component can still have access to these options you define under the `blog` configuration key in `nuxt.press.json` or `nuxt.press.js`, making it extremely to customize templates even with your own configuration options.
