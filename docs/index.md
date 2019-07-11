---
home: true
heroImage: /nuxt-press.png
heroText: nuxt-press
tagline: Publishing the Nuxt way
actionText: Get Started →
actionLink: /guide/
sidebar: true
footer: MIT License
---

<div style="margin: 0 auto; max-width: 700px;">

**NuxtPress** is a multi-mode natural extension to Nuxt.js.

_Adds magical **Markdown publishing abilities** to your Nuxt app_ ✨✨✨

⚡ Works in `universal` and `spa` modes, as well as with `nuxt generate`.

⚡ `nuxt generate` is **automatic**: no need to provide generate routes yourself.

⚡ **No `__NUXT__` payload** is used for rendering Markdown (zero bloat).

⚡ Batteries included: **docs**, **blog** and **slides** bundled apps.

⚡ Ejectable styles and Vue templates (granular shadowing of built-in templates).

⚡ Parses **YAML metadata** and supports Vue **markup and interpolation**.

⚡ Fully **configurable** **data sources** and **Markdown preprocessing**.

</div>

## Markdown pages

At its core, **NuxtPress** enables you to use Markdown files as [Nuxt pages][np]:

[np]: https://nuxtjs.org/guide/views/#pages

<table>
<tr>
<td><code>pages/index.md</code></td>
<td><code>/</code></td>
</tr>
<tr>
<td><code>pages/foo/index.md</code></td>
<td><code>/foo</code></td>
</tr>
<tr>
<td><code>pages/foo/bar.md</code></td>
<td><code>/foo/bar</code></td>
</tr>
</table>

Not only will NuxtPress transform Markdown files into working routes, it will also parse YAML metadata via [gray-matter][gm], if available.

[gm]: https://github.com/jonschlinkert/gray-matter

Here's a snippet from [`examples/pages`][pages-example]:

[pages-example]: https://github.com/nuxt/press/tree/master/examples/pages

```md
---
someText: hey, this works
someOtherText: hey, this works too
---

# Hello world

Go to [/subpage](/subpage)

Go to [/subpage/other](/subpage/other)

Msg: {{ $press.source.someText }}

Msg: **{{ $press.source.someOtherText }}**
```

You can also use the YAML metadata to specify the [Nuxt layout][nlayout]:

[nlayout]: https://nuxtjs.org/api/pages-layout/

```md
---
layout: yourLayout
---
```
