# Publishing docs

The docs mode of NuxtPress provides similar functionality as VuePress. NuxtPress even borrows config syntax and some components from VuePress, but although NuxtPress aims to provide similar functionality its not meant to be a one to one replacement.

## Path prefix

As you saw before, the URL prefix is automaticaly determined by whether you're running docs mode in NuxtPress standalone or default mode (`/` vs `/docs`).  You can override this by manually setting `docs.prefix` in the configuration:


```json
{
  "docs": {
    "prefix": "/custom-docs-prefix/"
  }
}
```

NuxtPress has full support for Markdown via [`@nuxt/markdown`](https://github.com/nuxt/markdown).

## Home page

NuxtPress will automatically detect the presence of a **`README.md`** file or an **`index.md`** file in the configured lookup directory and make that the *introductory page* of your docs suite.

NuxtPress provides a default home page layout similar to VuePress which can be configured by a YAML meta data section in your markdown index.

```yaml
---
home: true
heroImage: /hero.png
actionText: Get Started →
actionLink: /guide/
features:
- title: Simplicity First
  details: Minimal setup with markdown-centered project structure helps you focus on writing.
- title: Nuxt-Powered
  details: Enjoy the dev experience of Nuxt.js and Vue
- title: Performant
  details: Because Nuxt.js
footer: MIT Licensed
---
```

All additional markdown content will be rendered after the features sections (but before the footer).

## Navbar

Currently the NuxtPress navbar only supports a links section. E.g. the links you see on the top right corner of this page are added via NuxtPress configuration. Use the `docs.nav` configuration key, as follows:

NuxtPress does not (yet) support dropdown menus.

```json
{
  "docs": {
    "nav": [
      {
        "text": "Home",
        "link": "/"
      },
      {
        "text": "Internals",
        "link": "/internals"
      },
      {
        "text": "GitHub",
        "link": "https://github.com/nuxt/press"
      }
    ]
  }
}
```

You can also use a shorthand syntax as follows:

```json
{
  "docs": {
    "nav": [
      {"Home": "/"},
      {"Internals": "/internals"},
      {"GitHub": "https://github.com/nuxt/press"}
    ]
  }
}
```

## Sidebar

The docs bundled app also includes a sidebar component that can automatically scroll topics into view when you click them, and highlights which topic is currently into view. A basic sidebar expects an Array of links:

```
{
  "docs": {
    "sidebar": [
      "/",
      "/guide",
      ["/customize", 'Customize the app']
    ]
  }
}
```

You can omit the `.md` extension, and paths ending with `/` are inferred as */README.md or */index.md. The text for the link is automatically inferred (either from the first header in the page or explicit title in YAML meta data). If you wish to explicitly specify the link text, use an Array in form of [link, text].

### Nested Header Links

The sidebar automatically displays links for headers in the current active page, nested under the link for the page itself. You can customize this behavior using `docs.sidebarDepth`. The default depth is 1, which extracts the h2 headers. Setting it to 0 disables the header links, and the max value is 2 which extracts both h2 and h3 headers.

A page can also override this value via YAML front matter:

```yaml
---
sidebarDepth: 2
---
```

### Sidebar Groups

You can divide sidebar links into multiple groups by using objects:

```json
{
  "docs": {
    "sidebar": [
      {
        "title": "Group 1",
        "children": [
          "/"
        ]
      },
      {
        "title": "Group 2",
        "children": [ /* ... */ ]
      }
    ]
  }
}
```
### Multiple Sidebars

If you wish to display different sidebars for different sections of content, first organize your pages into directories for each desired section:

```
.
├─ README.md
├─ contact.md
├─ about.md
├─ foo/
│  ├─ README.md
│  ├─ one.md
│  └─ two.md
└─ bar/
   ├─ README.md
   ├─ three.md
   └─ four.md
```

Then, update your configuration to define your sidebar for each section.

```json
{
  "docs": {
    "sidebar": {
      "/": [
        "",        /* / */
        "contact", /* /contact.html */
        "about"    /* /about.html */
      ],

      "/foo/": [
        "",     /* /foo/ */
        "one",  /* /foo/one.html */
        "two"   /* /foo/two.html */
      ],

      "/bar/": [
        "",      /* /bar/ */
        "three", /* /bar/three.html */
        "four"   /* /bar/four.html */
      ]
    }
  }
}
```

###  Auto Sidebar for Single Pages

If you wish to automatically generate a sidebar that contains only the header links for the current page, you can use YAML meta data for that page:

```yaml
---
sidebar: auto
---
```


See the full configuration for this documentation suite [here][docs-config].

[docs-config]: https://github.com/nuxt/press/blob/master/docs/nuxt.press.json
