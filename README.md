![nuxt-press](https://user-images.githubusercontent.com/904724/59497906-a2d9d680-8e94-11e9-8fac-a7172827f349.png)

This is a **work in progress**.

Current alpha release: **0.0.1-alpha.40**

Package currently used for development purposes only.

## Publishing the Nuxt way

**NuxtPress** is a multi-mode natural extension to Nuxt.js.

_Adds magical **Markdown publishing abilities** to your Nuxt app_ ✨✨✨

Works in `universal` and `spa` modes, as well as with `nuxt generate`.

# Markdown pages

At its core, **NuxtPress** enables you to use Markdown files as Nuxt pages. A
directory layout like the one below (left column) would result in the routes
from the right column being made available (just like you'd expect if 
they were .vue files):

<table>
<tr>
<td>
<code>
pages/index.md<br>
pages/foo/index.md<br>
pages/foo/bar.md<br>
</code>
</td>
<td>
<code>
/<br>
/foo<br>
/foo/bar<br>
</code>
</td>
</tr>
</table>

## Bundled apps

**NuxtPress** comes with three bundled **apps** that can preprocess Markdown 
files in different ways and are only added to your app's build if enabled.

See the Internals section to learn more about how it works under the hood.

## Publishing docs

To enable the `docs` bundled app, place your Markdown files in your Nuxt app's 
`srcDir` or `srcDir/docs`. In `docs` mode, tables of contents are automatically
generated and can be displayed in a sidebar via configuration. You get all core
features of [VuePress][vp], but in a minimalistic Nuxt app.

[vp]: https://vuepress.vuejs.org

## Publishing blogs

To enable the `blog` bundled app, place your Markdown files in your Nuxt app's 
`srcDir/blog` dir. In `blog` mode, Markdown entry metadata is loaded via 
[gray-matter][gm] and used to sort entries by date. Learn more.

[gm]: https://github.com/jonschlinkert/gray-matter

## Publishing slides

To enable the `slides` bundled app, place your Markdown files in your Nuxt app's 
`srcDir/slides` dir. In `slides` mode, Markdown is especially processed to
generate slideshows. Similar to [mdx-deck][]. Learn more.

[mdx-deck]: https://github.com/jxnblk/mdx-deck

## Highly customizable

- All bundled apps have clean stylesheets which **can be easily themed**.

- All bundled apps use a simple REST API which **can be overriden**.

- Loading of Markdown files can be customized **with custom functions**.

- The actual source templates for each bundled app **can be ejected**.

- Can be added to any existing Nuxt app.
