<template>
  <div class="sidebar">
    <div class="about">
      My NuxtPress Blog
    </div>
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
  border-right: 1px solid #000;
  flex-basis: 25%;
  margin: 0px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  & .about {
    margin: 15px 0px;
    font-size: 28px;
    display: table-caption;
    text-align: right;
  }
  & a {
    display: block;
    margin: 0px;
    margin-bottom: 5px;
    padding: 0px;
    & img {
      transform: scale(0.8);
    }
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
