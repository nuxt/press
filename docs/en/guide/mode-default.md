# Default mode

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

## Hello world

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

# Beyond pages

Before we move on, keep in mind that **NuxtPress** can be added to and seamlessly extend any existing Nuxt application. **A NuxtPress app is a Nuxt app**. As long as it's the last enabled module, it won't interfere with existing functionality.

In **default mode**, in addition to now being able to add Markdown files directly to `pages/`, **you have three new route folders to work with**: **`docs/`**, **`blog/`** and **`slides/`**.  The presence of any of these directories in the **`srcDir`** of a Nuxt project will enable their corresponding NuxtPress modes.

You can customize these directories as follows:

```json
{
  "docs": {
    "dir": "my-custom-docs-dir"
  },
  "blog": {
    "dir": "my-custom-blog-dir"
  },
  "slides": {
    "dir": "my-custom-slides-dir"
  }
}
```

> You can run multiple NuxtPress modes in the same Nuxt app.
