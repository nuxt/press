---
date: April 20, 2019
---

# Publishing blogs

> This content comes from the `docs` suite. It used here to exemplify
> a blog entry from **April 20, 2019**.

To publish a blog, add your Markdown files to the `blog/` folder. You can 
structure them in however many subdirectories you want (for grouping posts by
year of publication for, for instance). What determines the publishing date of 
each blog entry is actually their Markdown source header. 

By default, NuxtPress uses a simple format where the first line is parsed out 
as the publication date. **Titles** and **slugs** are automatically generated
from the first heading (`#`) of your Markdown sources:

```
June 20, 2019

# Blog Entry's Title

```

If your Markdown sources however start with a `---`, NuxtPress will try and
parse it via [gray-matter][gm] and will look for `title`, `slug` and `date`.

[gm]: https://github.com/jonschlinkert/gray-matter

```markup
---
title: Blog Entry's Title
date: June 20, 2019
slug: blog-entry-slug
---

# This Heading Is Not Used As Title

```
