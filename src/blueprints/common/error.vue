<template>
  <main>
    <h1>error {{ error.statusCode }}</h1>
    <p>// TODO: make it pretty</p>
  </main>
</template>

<script>
export default {
  props: ['error'],
}
</script>
