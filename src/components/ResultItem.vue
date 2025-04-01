<script lang="ts" setup>
import { ref } from 'vue'

defineProps({
  item: { type: Object, required: true },
  currentPage: { type: Number, required: true },
  index: { type: Number, required: true },
})

const show_snippets = ref(false)
</script>

<template>
  <div :id="'main_' + index" :class="item['facet-document-type'] + ' docHit border mb-4 ml-2 row'">
    <div class="ribbon released" v-if="item['facet-document-type'] == 'letter' && item['facet-transcription-available'] =='Yes'"><span>Text Online</span></div>
    <div class="col-9">
      <div class="row">
        <div class="col docTitle">
          <h4 class="item-title">
            <a :href="item.path">
              <span v-if="item['facet-document-type'] == 'site'">
                {{ item.title }}
              </span>
              <span v-else-if="item['facet-document-type'] == 'people'">
                {{ item['display-name'].join('; ') }}
              </span>
              <span v-else>{{ item['document-id'] }}</span></a>
          </h4>
        </div>
      </div>
      <div v-if="item['facet-document-type'] == 'letter'">
        <div class="row">
          <div class="col-3 text-right"><b>From:</b></div><div class="col">{{ item['search-author'].join('; ') }}</div>
        </div>
        <div class="row">
          <div class="col-3 text-right"><b>To:</b></div><div class="col">{{ item['search-addressee'].join('; ') }}</div>
        </div>
        <div class="row">
          <div class="col-3 text-right"><b>Date:</b></div><div class="col">{{ item.displayDate }}</div>
        </div>
        <div class="row">
          <div class="col-3 text-right"><b>Source of text:</b></div><div class="col">{{ item['search-classmark'] }}</div>
        </div>

      </div>
      <div v-else-if="item['facet-document-type'] == 'people'">
        <div class="row" v-if="item['search-dates']">
          <div class="col-3 text-right"><b>Date:</b></div><div class="col">{{ item['search-dates'].join('; ') }}</div>
        </div>
        <div class="row">
          <div class="col-3 text-right"><b>Record ID:</b></div><div class="col">{{ item['document-id'] }}</div>
        </div>
      </div>
      <div class="row summary_row" v-if="item['content_summary'] && item['facet-document-type'] == 'letter'">
        <div class="col-3 text-right"><b>Summary:</b></div><div class="col" v-html="item['content_summary']"></div>
      </div>
      <div class="row" v-if="item['contributor']">
        <div class="col-3 text-right"><b>Contributor:</b></div><div class="col">{{ item['contributor'].join('; ') }}</div>
      </div>
    </div>
    <div class="col-3 pt-2 text-right" v-if="item['thumbnail']">
      <a :href="item.path"><img class="img-fluid" alt="thumbnail" :src="item['thumbnail']"></a>
    </div>
    <div class="col-12" v-if="item.highlighting.length > 0">
      <div class="matches row">
        <h3 class="snippet_header">
          {{ item.highlighting.length }}
          snippet{{
            item.highlighting.length == 1 ? '' : 's'
          }}
        </h3>
        <div class="snippet_container">
          <ul class="matches fold">
            <TransitionGroup>
              <li
                :class="
                'snippet count' +
                (index + 1) +
                ' ' +
                (show_snippets || index <= 2)
              "
                v-show="index <= 2 || show_snippets"
                v-for="(snippet, index) in item.highlighting"
                v-html="
                '&#x02026;' +
                snippet
                  .replace(/(^[^<>]*>|<[^>]*$)/g, '')
                  .replace(
                    /(<(h\d|p|li|div|td)( [^>]+)*>|<\/(h\d|p|li|div|td)>)/g,
                    ' ',
                  )
                  .replace(/(<a [^>]+>|<\/a>)/g, '') +
                '&#x02026;'
              "
                :key="JSON.stringify(snippet)"
              />
            </TransitionGroup>
          </ul>
        </div>
        <button
          class="show-more-matches matches-toggle badge badge-light badge-pill border mx-auto mt-2 mb-2"
          @click="() => (show_snippets = !show_snippets)"
          v-if="item.highlighting.length > 3"
        >
          <span class="more" v-show="!show_snippets"><i class="fas fa-angle-double-down"></i> MORE <i class="fas fa-angle-double-down"></i></span>
          <span class="less" v-show="show_snippets"><i class="fas fa-angle-double-up"></i> FEWER <i class="fas fa-angle-double-up"></i></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.summary_row p {
  margin: 0;
}
.docHit .snippet_container {
  width: 100%;
  margin-left: 15px;
  margin-right: 15px;
}

.docHit .snippet br {
  display: none;
}

.docHit .snippet .match {
  color: #d32535;
  font-weight: bold;
  font-style: normal;
}

.snippet_header {
  padding: 1em 0 0.5em 0;
  font-weight: bold;
  font-size: 1rem;
}

.ribbon span {
  box-shadow: 0 3px 3px -5px black;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
