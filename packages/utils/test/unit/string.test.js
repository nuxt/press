import {
  stripParagraph,
  trimStart,
  trimEnd,
  trimSlashStart,
  trimSlashEnd,
  escapeChars,
  slugify,
  markdownToText
} from '../../src/string'

test('stripParagraph', () => {
  expect(stripParagraph('Normal Title')).toBe('Normal Title')
  expect(stripParagraph('<p>P Title</p>')).toBe('P Title')
  expect(stripParagraph('<p>P Invalid 01 Title')).toBe('P Invalid 01 Title')
  expect(stripParagraph('P Invalid 02 Title</p>')).toBe('P Invalid 02 Title')
})

test('trimStart', () => {
  expect(trimStart('   Long Start')).toBe('Long Start')
  expect(trimStart('## Long Start', '## ')).toBe('Long Start')
})

test('trimEnd', () => {
  expect(trimEnd('Long End     ')).toBe('Long End')
  expect(trimEnd('Long End >', ' >')).toBe('Long End')
})

test('trimSlashStart', () => {
  expect(trimSlashStart('suppa/pow')).toBe('suppa/pow')
  expect(trimSlashStart('//franky/the/cyborg')).toBe('franky/the/cyborg')
  expect(trimSlashStart('no/start/slash')).toBe('no/start/slash')
})

test('trimSlashEnd', () => {
  expect(trimSlashEnd('/suppa/pow/')).toBe('/suppa/pow')
  expect(trimSlashEnd('franky/the/cyborg//')).toBe('franky/the/cyborg')
  expect(trimSlashEnd('no/end/slash')).toBe('no/end/slash')
})

test('escapeChars', () => {
  expect(escapeChars('time to "work"')).toBe('time to \\"work\\"')
  expect(escapeChars(`time to 'work'`, `'`)).toBe("time to \\'work\\'") // force coverage
  expect(escapeChars(`moore's law`, `'`)).toBe(`moore\\'s law`)
  expect(escapeChars('I still `alive`', '`')).toBe('I still \\`alive\\`')
  expect(escapeChars(`moore's law is "death"`, [`'`, `"`])).toBe(`moore\\'s law is \\"death\\"`)
})

test('slugify', () => {
  expect(slugify('time to "work"')).toBe('time-to-work')
  expect(slugify('Suppaman, help-me!!')).toBe('suppaman-help-me')
})

test('markdownToText', () => {
  const entry = `
# Main Title
<code>x => x * x</code>
<pre>y => y * y</pre>
  `
  const output = `
# Main Title

y => y * y
  `
  expect(markdownToText(entry)).toBe(output)
})
