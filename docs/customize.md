# Customize

This section covers all **NuxtPress** customization options.

## Custom stylesheets

If you're only using NuxtPress for Markdown pages, you can just add CSS to the default layout. Learn more about Nuxt layouts [here][nuxt-layouts].

[nuxt-layouts]: https://nuxtjs.org/guide/views#layouts

For customizing the bundled apps, you can use `npx nuxt-press eject`:

```
$ npx nuxt-press eject <mode>/theme
```

There are four ejectable stylesheets:

```
$ npx nuxt-press eject common/theme
$ npx nuxt-press eject docs/theme
$ npx nuxt-press eject blog/theme
$ npx nuxt-press eject slides/theme
```

Running any of these commands will append the specified stylesheet to the `<srcDir>/nuxt.press.css` file. It will also be created automatically the first time if does not exist yet. Note that `docs`, `blog` and `slides` all depend on the `common` theme. So remember to always eject the common theme first:


```
$ npx nuxt-press eject common/theme
$ npx nuxt-press eject blog/theme
```

> Beware: this command doesn't check if the stylesheet has been previously ejected, so running it multiple times will keep adding to `nuxt.press.css`.

NuxtPress default stylesheets are written using [css-preset-env stage-0 features][stage-0].

[stage-0]: https://preset-env.cssdb.org/

When detecting the presence of `nuxt.press.css`, NuxtPress will skip adding the built-in stylesheets internally and will use this file instead.

## Ejectable templates

If overriding stylesheets isn't enough for your needs, you can eject NuxtPress bundled app templates for low-level modifications.

The _concept_ of _ejecting_ is [taken from VuePress][vuepress-eject]. NuxtPress gives you the same functionality, with a little more control: if all you need is to customize a blog sidebar, you can eject that particular template (`blog/sidebar`) and have it shadow the built-in one. NuxtPress in this regards behaves similarly to Gatsby's [component shadowing][gatsby-components], in a more streamlined fashion.

[vuepress-eject]: https://vuepress.vuejs.org/default-theme-config/#ejecting
[gatsby-components]: https://www.gatsbyjs.org/blog/2019-04-29-component-shadowing/

Eject with `npx`:

```shell
$ npx nuxt-press eject blog/sidebar
```

> See NuxtPress source code for bundled apps [here][source-code].

[source-code]: https://github.com/nuxt/press/tree/master/src/blueprints

Below is a list of ejectable templates for each of NuxtPress bundled apps:

<table>
<tr>
<td>Key</td>
<td>Path</td>
</tr>
<tr>
<td>
<code>docs/plugin</code><br>
<code>docs/header</code><br>
<code>docs/index</code><br>
<code>docs/layout</code><br>
<code>docs/sidebar</code><br>
<code>docs/topic</code>
</td>
<td>
<code>press/docs/plugin.js</code><br>
<code>press/docs/pages/components/header.vue</code><br>
<code>press/docs/pages/index.vue</code><br>
<code>press/docs/layout.vue</code><br>
<code>press/docs/components/sidebar.vue</code><br>
<code>press/docs/components/topic.vue
</td>
</tr>
<tr>
<td>
<code>blog/plugin</code><br>
<code>blog/index</code><br>
<code>blog/layout</code><br>
<code>blog/sidebar</code><br>
<code>blog/entry</code>
</td>
<td>
<code>press/blog/plugin.js</code><br>
<code>press/blog/pages/index.vue</code><br>
<code>press/blog/layout.vue</code><br>
<code>press/blog/components/sidebar.vue</code><br>
<code>press/blog/components/entry.vue
</td>
</tr>
<tr>
<td>
<code>slides/plugin</code><br>
<code>slides/layout</code><br>
<code>slides/index</code><br>
<code>slides/slides</code>
</td>
<td>
<code>press/slides/plugin.js</code><br>
<code>press/slides/layout.vue</code><br>
<code>press/slides/pages/index.vue</code><br>
<code>press/slides/components/slides.vue
</td>
</tr>
</table>

If you're customizing **_everything_**, running `npx nuxt-press eject <mode>` will eject **all** templates associated with the specified mode.

Every bundled app is written as a regular Nuxt app: they make use of _middleware_, _plugins_ and _layouts_. All bundled apps depend on the `common` app bundle, which populates `$press` and `$press.source`. The `common` app bundle also includes the main source route, which in turns loads the right components for the specified source path. You'll rarely need to edit the common app bundle templates, but they're also ejectable:

<table>
<tr>
<td>Key</td>
<td>Path</td>
</tr>
<tr>
<td>
<code>common/middleware</code><br>
<code>common/nuxt</code><br>
<code>common/observer</code><br>
<code>common/plugin</code><br>
<code>common/scroll</code><br>
<code>common/source</code>
</td>
<td>
<code>press/common/middleware.js</code><br>
<code>press/common/components/nuxt-template.js</code><br>
<code>press/common/components/observer.js</code><br>
<code>press/common/plugin.js</code><br>
<code>press/common/plugins/scroll.js</code><br>
<code>press/common/pages/source.vue</code><br>
</td>
</tr>
</table>

This makes NuxtPress nearly fully customizable. The rest of it is really just the module code that bootstraps all bundled apps if enabled into your Nuxt app.

## Using components

To use custom Vue components in your Markdown sources, just create a plugin to import and register the component globally:

```js
import ColorPicker from '@radial-color-picker/vue-color-picker'

Vue.component('color-picker', ColorPicker)
```

Since NuxtPress operates under the assumption all Markdown is provided by the author (and not via third-party user submission), sources are processed in full (tags included), with a couple of caveats from [rehype-raw][rehype-raw]:

1. Can't use self-closing tags, i.e., **this won't work**:

```markup
<color-picker />
```

But **this will**:

```markup
<color-picker></color-picker>
```

2. When placing Markdown inside a component, it must be preceded and followed by an empty line, otherwise the whole block is treated as custom HTML.

**This won't work**:

```markup
<div class="note">
*Markdown* and <em>HTML</em>.
</div>
```

But **this will**:

```markup
<div class="note">

*Markdown* and <em>HTML</em>.

</div>
```

As will **this**:

```markup
<span class="note">*Markdown* and <em>HTML</em>.</span>
```

This last example works because `<span>` is not a block-level tag.

[rehype-raw]: https://github.com/rehypejs/rehype-raw


## Markdown loader

By default, **NuxtPress** loads content from the file system.

For **`docs`** mode, it will load all Markdown files in the current directory and sub directories recursively and group them in a _serial list of **topics**_.

Their final URL follows the format:

```
/topic/<slugified-h1-from-markdown-file>
```

For **`blogs`** mode, Markdown files are grouped as a *_chronological list of entries_*.

Their final URL follows the format:

```
/<year>/<month>/<slugified-h1-from-markdown-file>
```

For **`slides`** mode, Markdown files are treated as individual slideshows.

Their final URL follows the format:

```
/<slugfied-file-name>
```

You can override Markdown loading functions using `nuxt.press.js`:

```js
export default {
  docs: {
    source: {
      markdown(rawSource) {
        const { data, body } = yourMarkdownProcessor(rawSource)
        return { ...data, body }
      }
    }
  }
}
```

In general, NuxtPress expects `<mode>.source.markdown()` to return an object with `title`, `path` and `body`. Depending on the mode, additional properties may be used. See the [configuration object for each bundled app][source-code]  to learn more about them.

## Server middleware

You can **disable filesystem loading** altogether by providing your own custom  API handlers for retrieving indexes and Markdown source files.

| API method                          | Configuration key                     |
| ----------------------------------- | ------------------------------------- |
| `/api/docs/index`                   | `docs.api.index`                      |
| `/api/blog/index`                   | `blog.api.index`                      |
| `/api/blog/archive`                 | `blog.api.archive`                    |
| `/api/slides/index`                 | `slides.api.index`                    |
| `/api/source/:source`               | `common.api.source`                   |

Note however that when overriding API handlers, all API handlers must be provided. If your using NuxtPress docs bundled app, you can't for instance override `docs.api.index` and not also override `common.api.source`.

For overriding API handlers, use `nuxt.press.js`:

```js
import mdProcessor from 'your-own-markdown-preprocessor'

const dummyEntry = {
  path: '/this-is/used-as-a-route',
  title: 'hello world',
  body: mdProcessor('# hello world\n\n`)
}

export default {
  common: {
    api: {
      source(source, req, res, next) {
        if (source === 'this-is/used-as-a-route') {
          res.json(dummyEntry)
        }
      }
    }
  },
  docs: {
    api: {
      index(req, res, next) {
        res.json([dummyEntry])
      }
    }
  }
}
```

The example uses very simple logic for clarity. Note that the signature for the `source()` handler has 4 parameters, the first being the **source path**.  This is for your convenience, because NuxtPress expects a API request matching the URL accessed in your Nuxt app:

URL accessed    | API request
--------------- | --------------------
/               | /api/source/index
/foobar         | /api/source/foobar
/foobar/xyz     | /api/source/foobar/xyz

In other words, if a HTTP request fails to be captured by Nuxt's route handlers, it will land at a **final source handler** that tries to retrieve it **from the API**. If you don't provide your own API handlers, NuxtPress uses built-in API handlers that deliver the pregenerated files from the default filesystem loader.
