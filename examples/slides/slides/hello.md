A NuxtPress
<br>Presentation

# Bullet points

- smart slide delimiters (h1)
- use vue components in markdown
- vue-awesome-swiper under the hood

# Code snippets

Here's a code snippet in a slide:

```js
export default {
  modules: [`@nuxt/press`]
}
```

# Theming

Say you want to display the<br>
previous snippet in a yellow background.

#

Create a `~/assets/my-slides.css`:

```css
.slides-hello .slide-3 pre {
  background: #f4e398 !important;
}
```

#

And include it in `nuxt.config.js`:

```js
export default {
  css: [`~/assets/my-slides.css`]
}
```

#

Then it would look like this:

```js
export default {
  modules: [`@nuxt/press`]
}
```

Get a copy of the default theme [here].

[here]: https://foobar.com
