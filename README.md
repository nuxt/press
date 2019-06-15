![nuxt-press](https://user-images.githubusercontent.com/904724/59497906-a2d9d680-8e94-11e9-8fac-a7172827f349.png)

This is a **work in progress**. No usable package is available yet.

## Publishing the Nuxt way

**`@nuxt/press`** is a multi-mode natural extension to Nuxt.js.

- Want a **documentation suite**?
  Simply drop a bunch of **`md`** files in **`rootDir`** or **`rootDir/docs`**.

- Want to publish a **blog**?
  Simply drop a bunch of **`entry.md`** files in **`srcDir/blog`**.

- Want to present some **slides**?
  Simply drop your **`presentation.md`** file in **`srcDir/slides`**.

## Markdown + Vue components

**`@nuxt/press`** uses a [specially curated version][nmd] of 
[`@dimerapp/markdown`][md] (**huge thanks to** [Harminder Virk][virk]), which 
features modifications to retain custom tags (i.e., Vue components) and 
automatically render Markdown links as **`<nuxt-link>`**.

[md]: https://github.com/dimerapp/markdown
[nmd]: https://github.com/nuxt/markdown
[virk]: https://github.com/thetutlage

## Static or otherwise

Each of **`@nuxt/press`**'s modes (`docs`, `blog` and `slides`) have their own 
simple HTTP API endpoints which can be overriden via [serverMiddleware][sm]. By
default, **`@nuxt/press`** will load Markdown files via static JSON `fetch()`.

[sm]: https://nuxtjs.org/api/configuration-servermiddleware/

## And more ⭐

<table>
<tr>
<td>
&nbsp;
<ul>
<li>
Supports <code>universal</code> and <code>spa</code> Nuxt.js modes
</li>
<li>
Supports build via <code>nuxt generate</code>
</li>
</ul>
</td>
<td>
&nbsp;
<ul>
<li>
Automatic injection of <b>Markdown Nuxt.js pages</b>
</li>
<li>
Easy <b>theming</b> and <b>template customization</b>
</li>
</ul>
</td>
</tr>
</table>
