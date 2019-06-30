---
title: Intro
---

![nuxt-press][logo]

[logo]: https://user-images.githubusercontent.com/904724/59497906-a2d9d680-8e94-11e9-8fac-a7172827f349.png

# Publishing the Nuxt way

**NuxtPress** is a multi-mode natural extension to Nuxt.js.

_Adds magical **Markdown publishing abilities** to your Nuxt app_ ✨✨✨

Works in `universal` and `spa` modes, as well as with `nuxt generate`.

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

## Bundled apps

**NuxtPress** comes with three bundled apps: **docs**, **blog** and **slides**.

They preprocess Markdown files in different ways and:

- Are only added to your app's build if enabled.

- Have clean stylesheets which **can be easily themed**.

- Use a simple REST API which **can be overriden**.

- Load Markdown files **with overridable functions**.

- Can have templates  **ejected** via **nuxt press eject `<template>`**.

- Can be added to any existing Nuxt app.

See the [**Internals** section](/internals) to learn how it works under the hood.
