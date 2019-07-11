# Default mode

The first thing to keep in mind is that **NuxtPress** can be added to and seamlessly extend any existing Nuxt application. **A NuxtPress app is a Nuxt app**. As long as it's the last enabled module, it won't interfere with existing functionality.

To add new routes to a Nuxt application, you can use the **`pages/`** folder. Nuxt will dynamically build your routes based on the hierarchy of this folder.

In **default mode**, in addition to now being able to add Markdown files directly to `pages/`, **you have three new route folders to work with**: **`docs/`**, **`blog/`** and **`slides/`**.  The presence of any of these directories in the **`srcDir`** of a Nuxt project will enable their corresponding NuxtPress modes.

You can customize these directories as follows:

```json
{
  "docs": {
    "dir": "my-custom-docs-dir"
  },
  "blog": {
    "dir": "my-custom-blog-dir"
  },
  "slides": {
    "dir": "my-custom-slides-dir"
  }
}
```

> You can run multiple NuxtPress modes in the same Nuxt app.

