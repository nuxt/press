
# Roadmap

Althought NuxtPress' first release packs many useful features, we've got a much bigger vision for it. We've have planned to roll out a series of refactorings and features leading up to its 1.0 release a year from now, i.e., one major release per month as a general goal.

## v0.2

- Core:
  - add basic support for multiple ids/configs per blueprint
  - template definitions can be a function

- Blueprints/Docs:
  - support dynamic loaded configs per locale
  - support multiple folders for a blueprint
  - support multiple ids per blueprint
  - define sidebar items with glob/regex
  - add custom (ie non nuxt/press page) items to sidebar
  - support source folder aliasing

Work on these [has already taken place](https://github.com/nuxt/press/pull/44) and should be released soon.

## v0.3

- Core:
  - Register webpack assets for sources when fully using filesystem
    - Maintain ability to override this with press/common middleware/sources

## v0.4

- Refactor blueprint.js into Nuxt Core (RFC pending)

- Blueprints/Common:
  - Refactor press/common into @nuxt/markdown using Nuxt Core blueprints
  - Refactor docs/blogs/slides using Nuxt Core blueprints
