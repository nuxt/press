A NuxtPress<br>
Presentation

# It's a simple idea

Let's take a Markdown file and use<br>
the `<h1>` headers as slide delimiters

# 

```md
Opener

# Slide 2

- Bullet point
- Bullet pint

# Slide 3

...
```

<style>
.slides-hello .slide-2 pre { font-size: 16px; }
</style>

# Then

We use Vue's [full build][vfb] to<br>
enable runtime **template compilation**.

[vfb]: https://vuejs.org/v2/guide/installation.html#Explanation-of-Different-Builds

# So that

We can have `<style>` tags and `<component>`<br>
tags mixed with Markdown markup.

# Theming

Take this code snippet:

```css
.slides-hello .slide-6 pre {
  background: #f4e398;
}
```

<style>
.slides-hello .slide-6 pre {
  background: #0f0;
}
</style>

# Noticed the background?

```html
<style>
.slides-hello .slide-6 pre {
  background: #f4e398;
}
</style>
```

Yep, that's **inlined**.
