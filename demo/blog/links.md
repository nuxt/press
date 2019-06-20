June 20, 2019

-

# Adding sidebar links

> This content comes from the `docs` suite. It used here to exemplify
> a blog entry from **June 20, 2019**.

NuxtPress' default blog template makes it easy to automatically include
sidebar text links, and also includes some predefined SVG icons for common
links like *RSS feed*, *Twitter*, *GitHub* and *LinkedIn*.

```js
export default {
  press: {
    blog: {
      meta: {
        links: [
          {Home: '/blog'},
          {Archive: '/blog/archive'},
          {About: '/blog/about'},
        ],
        icons: [
          {github: 'http://github.com/nuxt/nuxt.js'},
          {twitter: 'https://twitter.com/nuxt_js'}
        ]
      }
    }
  }
}
```

Currently the **feed**, **twitter**, **github** and **linkedin** icons are available.

You can also completely customize your blog template, and define your very own 
configuration properties and use them in your custom templates.

See more about customization.
