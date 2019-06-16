<template>
  <div class="docs-wrapper">
    <toc />
    <nuxt class="content" />
  </div>
</template>

<script>
import toc from '../components/docs/toc'

export default {
  components: { toc }
}
</script>

<style>
code {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.8em;
  color: #669900;
  font-weight: bold;
}
/* prismjs override */
code[class*="language-"],
pre[class*="language-"] {
  font-size: 0.9em;
}
table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #999;
}
table th,
table td {
  padding: 5px;
  border: 1px solid #999;
}
* {
  color: #555;
}
html {
  margin: 0px auto;
  width: 80%;
}
body, #__nuxt, #__layout {
  font-family: sans-serif;
  width: 100%;
  height: 100%;
  margin: 0px auto;
  padding: 0px;
}
a, a:active, a:visited {
  color: #555;
  text-decoration: none;
}
a:hover {
  color: #999;
}
.docs-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
}
.docs-wrapper .content {
  width: calc(60% - 20px);
  padding: 20px;
  margin-bottom: 40px;
  margin-left: calc(30%);
}
</style>
