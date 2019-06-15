function loadSlides(raw) {
  const slides = []
  let c
  let i = 0
  let s = 0
  let escaped = false
  for (i = 0; i < raw.length; i++) {
    c = raw.charAt(i)
    if (c === '\n') {
      if (raw.charAt(i + 1) === '`' && raw.slice(i + 1, i + 4) === '```') {
        escaped = !escaped
        i = i + 3
        continue
      }
      if (escaped) {
        continue
      }
      if (raw.charAt(i + 1) === '#') {
        if (raw.slice(i + 2, i + 3) !== '#') {
          slides.push(raw.slice(s, i).trimStart())
          s = i
        }
      }
    }
  }
  slides.push(slides.length > 0
    ? raw.slice(s, i).trimStart()
    : raw
  )
  console.log(slides)
}

loadSlides(`
# foobar 2

foobar 2

# foobar 3

foobar 3
`)

loadSlides(`

foobar1

# foobar 2

foobar 2

\`\`\`
# example

foobar
\`\`\`

# foobar 3

foobar 3
`)