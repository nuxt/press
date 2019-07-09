---
title: Intro
---

![nuxt-press][logo]

[logo]: https://user-images.githubusercontent.com/904724/59497906-a2d9d680-8e94-11e9-8fac-a7172827f349.png

# Publishing the Nuxt way

**NuxtPress** is a multi-mode natural extension to Nuxt.js.

_Adds magical **Markdown publishing abilities** to your Nuxt app_ ✨✨✨

⚡Works in `universal` and `spa` modes, as well as with `nuxt generate`.

⚡`nuxt generate` is **automatic**: no need to provide generate routes yourself.

⚡**No `__NUXT__` payload** is used for rendering Markdown (zero bloat).

⚡Batteries included: **docs**, **blog** and **slides** bundled apps.

⚡Ejectable styles and Vue templates (granular shadowing of built-in templates).

⚡Parses **YAML metadata** and supports Vue **markup and interpolation**.

⚡Fully **configurable** **data sources** and **Markdown preprocessing**.

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
