<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  keywords: { type: String, required: true },
})

</script>

<template>
  <div
    class="navbar navbar-dark navbar-expand bg-info justify-content-between text-light mb-4 shadow">
    <div class="container-fluid">
      <ul class="navbar-nav">
        <li class="nav-item navbar-brand"><a class="nav-link" href="/">Ɛpsilon</a></li>
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link"
                                href="/search?browse-all=yes&amp;sort=date">Browse
          All</a></li>
      </ul>
      <ul class="navbar-nav">
        <li class="nav-item"><form class="search-widget" method="get"
                                   action="/search"><div
          class="form-row d-flex justify-content-end">
          <div class="col-3">
            <input class="form-control form-control" type="text"
                   name="keyword" size="70" :value="keywords" />
            <p class="text-small text-muted text-center"><a class="nav-link"
                                                            href="/advanced-search"
            >Advanced Search</a></p>
          </div>
          <input class="col-auto btn btn-light btn-sm" type="submit"
                 value="Search" />
        </div></form></li>
      </ul>
    </div>
  </div>
</template>
