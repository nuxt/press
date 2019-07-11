![nuxt-press](https://user-images.githubusercontent.com/904724/59497906-a2d9d680-8e94-11e9-8fac-a7172827f349.png)

This is a **work in progress**.

Current alpha release: **0.0.1-alpha.68**

Package currently used for development purposes only.

# Publishing the Nuxt way

**NuxtPress** is a multi-mode natural extension to Nuxt.js.

_Adds magical **Markdown publishing abilities** to your Nuxt app_ ✨✨✨

⚡Automatic Markdown routes: `pages/foo/bar.md` → `/foo/bar`

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
