---
title: Intro
---

![nuxt-press][logo]

# Publishing the Nuxt way

[logo]: https://user-images.githubusercontent.com/904724/59497906-a2d9d680-8e94-11e9-8fac-a7172827f349.png

**NuxtPress** is a multi-mode natural extension to Nuxt.js.

* Want a documentation suite?<br>Simply drop a bunch of md files in srcDir or srcDir/docs.
* Want to publish a blog?<br>Simply drop a bunch of entry.md files in srcDir/blog.
* Want to present some slides?<br>Simply drop your presentation.md file in srcDir/slides.

## Setup

```shell
$ npm install @nuxt/press --save
```

This will also install Nuxt if you haven't yet. If you haven't defined a 
`scripts` section in your package.json file, one will automatically be added 
with all `@nuxt/press` commands.

If you haven't created a `nuxt.config.js` file yet, one will be created with 
`modules` filled out for you:

```js
export default {
  modules: ['@nuxt/press']
}
```