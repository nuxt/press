<template>
  <div class="sidebar">
    <% if (options.blog.meta.avatar) { %>
    <a href="/">
      <img class="icon avatar" src="<%= blog.meta.avatar %>">
    </a>
    <% } %>
    <a href="http://github.com/galvez">
      <img class="icon" src="../../assets/blog/icons/github.svg">
    </a>
    <a href="http://linkedin.com/in/jonasgalvez">
      <img class="icon" src="../../assets/blog/icons/linkedin.svg">
    </a>
    <a href="http://hire.jonasgalvez.com.br/atom.xml">
      <img class="icon" src="../../assets/blog/icons/feed.svg">
    </a>
    <a href="https://twitter.com/anothergalvez">
      <img class="icon" src="../../assets/blog/icons/twitter.svg">
    </a>
  </div>
</template>

<script>
export default {

}
</script>

<style>
.sidebar {
  top: 30px;
  position: fixed;
  width: calc(18%);
  border-right: 1px solid #f6f6f6;
  margin: 0px;
  margin-right: 10px;
  padding-top: 20px;
  padding-left: 15px;
  padding-right: 15px;
  height: calc(100% - 20px);
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  & a {
    display: block;
    margin: 0px;
    margin-bottom: 5px;
    padding: 0px;
  }
}
.h1 {
  font-size: 17px;
  margin-left: 10px;
}
.h2 {
  font-size: 16px;
  margin-left: 20px;
}
.h3 {
  font-size: 15px;
  margin-left: 30px;
}

</style>
