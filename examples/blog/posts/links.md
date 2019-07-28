June 20, 2019

# Adding sidebar links

> This content comes from the `docs` suite. It used here to exemplify a blog entry from **June 20, 2019**.

NuxtPress' default blog template makes it easy to automatically include sidebar text links.

Here's `nuxt.press.json` from [`examples/blog`][examples-blog].

[examples-blog]:  https://github.com/nuxt/press/tree/master/examples/blog

```json
{
  "blog": {
    "links": [
      {"Home": "/blog"},
      {"Archive": "/blog/archive"},
      {"About": "/blog/about"},
    ]
  }
}
```

This feature is mostly illustrative. You're likely to benefit more from ejecting
the entire app bundle and adding your code for the `sidebar` component. Your
component can still have access to these options you define under the `blog`
configuration key in `nuxt.press.json` or `nuxt.press.js`, making it extremely
to customize templates even with your own configuration options.
