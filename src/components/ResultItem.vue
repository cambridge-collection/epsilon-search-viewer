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
  <div
    :id="'main_' + index"
    :class="
      item['facet-document-type'] + ' docHit search-result-item has-summary'
    "
  >
    <div v-if="item['facet-document-type'] == 'site'">
      <div v-if="item['og_image.content']" class="this-site key-image">
        <img
          class="campl-scale-with-grid"
          :src="item['og_image.content']"
          :alt="item['og_image_alt.content']"
        />
      </div>
      <div
        :class="'this-site-result-wrap ' + (item['og_image.content'] != null)"
      >
        <h2 class="item-title">
          <a :href="item.path">{{ item.title }}</a>
        </h2>
        <div class="summary">
          <p v-html="item['content.summary']"></p>
        </div>
      </div>
    </div>
    <div v-else>
      <h2 class="item-title">
        <span
          v-if="item['facet-document-type'] == 'bibliography'"
          v-html="item['content_bibl-citation']"
        />
        <a :href="item.path" v-else>{{ item.title }}</a>
      </h2>
      <div class="main-icon" v-if="item['facet-document-type'] == 'letter'">
        <i class="material-icons">mail</i><span>Letter</span>
      </div>
      <div
        class="main-icon"
        v-else-if="item['facet-document-type'] == 'people'"
      >
        <i class="material-icons">person</i><span>Person</span>
      </div>
      <div
        class="main-icon"
        v-else-if="item['facet-document-type'] == 'bibliography'"
      >
        <i class="material-icons">library_books</i><span>Reference</span>
      </div>
      <div class="clear" v-if="item['facet-document-type'] == 'letter'"></div>
      <div class="floatLeft" v-if="item['facet-document-type'] == 'letter'">
        <div class="thumbnail" v-if="item['preview-tile']">
          <a :href="item.path">
            <img alt="thumbnail" :src="item['preview-tile']"
          /></a>
        </div>
        <div
          class="summary"
          v-html="item['content_summary']"
          v-if="item['content_summary']"
        />
      </div>
      <table>
        <tbody v-if="item['facet-document-type'] == 'letter'">
        <tr>
          <td class="col2"><b>Filename:&nbsp;&nbsp;</b></td>
          <td class="col3">{{ item['filename'] }}</td>
        </tr>
          <tr>
            <td class="col2"><b>Author:&nbsp;&nbsp;</b></td>
            <td class="col3">
              {{ item['search-author'].join('; ') }}
            </td>
          </tr>
          <tr>
            <td class="col2"><b>Addressee:&nbsp;&nbsp;</b></td>
            <td class="col3">
              {{ item['search-addressee'].join('; ') }}
            </td>
          </tr>
          <tr>
            <td class="col2"><b>Date:&nbsp;&nbsp;</b></td>
            <td class="col3">{{ item.displayDate }}</td>
          </tr>
          <tr>
            <td class="col2"><b>Classmark:&nbsp;&nbsp;</b></td>
            <td class="col3">{{ item['search-classmark'] }}</td>
          </tr>
          <tr>
            <td class="col2"><b>Letter no:&nbsp;&nbsp;</b></td>
            <td class="col3">{{ item['document-id'] }}</td>
          </tr>
          <tr>
            <td class="col2"><b>Log:&nbsp;&nbsp;</b></td>
            <td class="col3">{{ item['lognum'] }}</td>
          </tr>
          <tr>
            <td class="col2"><b>Document Online:&nbsp;&nbsp;</b></td>
            <td class="col3">{{ item['facet-document-online'] }}</td>
          </tr>
        </tbody>
        <tbody v-if="['people','bibliography'].includes(item['facet-document-type'])">
        <tr>
          <td class="col2"><b>Filename:&nbsp;&nbsp;</b></td>
          <td class="col3">{{ item['filename'] }}</td>
        </tr>
        <tr>
          <td class="col2"><b>ID:&nbsp;&nbsp;</b></td>
          <td class="col3">{{ item['document-id'] }}</td>
        </tr>
        <tr>
          <td class="col2"><b>Status:&nbsp;&nbsp;</b></td>
          <td class="col3">{{ item['facet-status'] }}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="matches" v-if="item.highlighting.length > 0">
      <h3>
        {{ item.highlighting.length }}
        snippet{{
          item.highlighting.length == 1 ? '' : 's'
        }}
      </h3>
      <div class="snippets">
        <ul>
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
        class="show-more-matches"
        @click="() => (show_snippets = !show_snippets)"
        v-if="item.highlighting.length > 3"
      >
        <span class="more" v-show="!show_snippets">More matches +</span>
        <span class="less" v-show="show_snippets">– Less</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-results-page .search-result-item .snippets {
  transition: none;
  overflow: auto;
}

.search-results-page .search-result-item .show-more-matches .less {
  display: block;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
.search-results-page .search-result-item h2.item-title {
  display: inline-block;
  float: none;
}


.site.search-result-item div.key-image.this-site {
  float: right;
  width: 25%;
}

.this-site-result-wrap {
  width: 70%;
  float: left;
}
div.darwin-search-results-container .search-result-item .summary {
  float: none;
  width: 100%;
}
</style>
