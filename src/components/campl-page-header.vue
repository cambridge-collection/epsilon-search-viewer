<script lang="ts" setup>
import { ref } from 'vue'

defineProps({
  keywords: { type: String, required: true },
})

const menuOpen = ref(false)
</script>

<template>
  <div
    class="navbar navbar-dark navbar-expand bg-info text-light mb-4 shadow">
    <div class="container-fluid header-bar">
      <div class="header-row">
        <a class="navbar-brand" href="/">Ɛpsilon</a>

        <button class="menu-toggler" type="button"
                @click="menuOpen = !menuOpen" :aria-expanded="menuOpen"
                aria-label="Toggle menu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <ul class="navbar-nav menu-nav" :class="{ 'is-open': menuOpen }">
          <li class="nav-item"><a class="nav-link"
                                  href="/search?f1-document-type=Letters&amp;sort=date">Letters</a></li>
          <li class="nav-item"><a class="nav-link"
                                  href="/search?f1-document-type=People%2FOrganisations">People/Organisations</a></li>
          <li class="nav-item"><a class="nav-link"
                                  href="/search?sort=date">All records</a></li>
          <li class="nav-item"><a class="nav-link"
                                  href="/contributing-your-collection">Contributing your collection</a></li>
        </ul>
      </div>

      <ul class="navbar-nav search-nav" :class="{ 'is-open': menuOpen }">
        <li class="nav-item">
          <form class="search-widget" method="get" action="/search">
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
              </div>
              <input class="form-control" type="text" name="keyword"
                     placeholder="Search records..." :value="keywords" />
            </div>
            <p class="text-small text-muted text-center"><a class="nav-link"
                                                            href="/advanced-search"
            >Advanced Search</a></p>
          </form>
        </li>
      </ul>
    </div>
  </div>
</template>
