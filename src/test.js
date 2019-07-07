

console.log(escapeVueInMarkdown(`
\`\`\`
{{ foobar }}
\`\`\`

{{ foobar }}

\`{{ foobar }}\`
`)
)