<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, stringifyQuery, type LocationQueryValue } from 'vue-router'
import ResultItem from '@/components/ResultItem.vue';
import FacetBlock from '@/components/FacetBlock.vue';
import CamplPageHeader from '@/components/campl-page-header.vue';
import NoResults from '@/components/NoResults.vue';
import 'vue-awesome-paginate/dist/style.css';
import { CSpinner } from '@coreui/vue';
import { _is_hierarchical, cancel_link, _get_first_value, _query_param_sort, _params_to_query_structure, _tracer_bullet } from '@/lib/utils';
import * as implementation from '@/implementationConfig'

// Use this to check for the existence of methods and to run them
const implementationSafe = implementation as Record<string, unknown>;

const router = useRouter();
const route = useRoute();

const commits = ref<Array<{ id: PropertyKey; [key: string]: unknown }>>([]);
const facets = ref<Record<string, unknown>>({});
const is_loading = ref<boolean>(true);
const is_error = ref<{ bool: boolean; message: string }>({ bool: false, message: "" });
const items_per_page = 20
const total = ref<number>(0);
const currentPage = ref<number>(get_current_page());

const core = computed<'pages' | 'items'>(() => _get_first_value(route.query?.tc ?? null) === 'pages' ? 'pages' : 'items' )
const sort = computed<string>(() => {
  const sort_val: string = _get_first_value(route.query.sort) ?? 'score'
  return implementation.sort_fields.includes(sort_val)? sort_val : 'score'
})

const fullpath_uriencoded = computed<string>(() => encodeURIComponent(route.fullPath) )

const paginate_results = computed<boolean>(() => total.value >= items_per_page )

function get_current_page(): number {
  return ('page' in route.query && /^\d+$/.test(String(route.query['page']))) ? Number(route.query['page']): 1;
}

function add_missing_hierarchical_ancestor_values(key: string, values: string[]): string[] {
  let result: string[] = [...values];
  if (_is_hierarchical(key) && values.length) {
    result= [...new Set(
      values.flatMap(d => {
        const d_clean = d.replace(/(^"|"$)/g, '');
        return d.includes('::')
          ? d_clean.split('::').map((_, i, arr) => arr.slice(0, i + 1).join('::'))
          : [d_clean];
      })
    )].sort();
  }
  return result;
}

const remove_unused_params = (params: Array<{ key: string; value: string }>): Array<{ key: string; value: string }> => {
  // Define params to remove by default from processed param store
  const unused_params: string[] = implementation.params_to_remove ?? ['page']

  let newParams = [...params].filter(item => !unused_params.includes(item.key))

  if (typeof implementationSafe._remove_unused_params === 'function') {
    newParams = implementationSafe._remove_unused_params(newParams)
  }

  return newParams;
};

const toStringArray = (val: LocationQueryValue | LocationQueryValue[] | null): string[] =>
  Array.isArray(val) ? val.filter((v): v is string => v !== null) : val !== null ? [val] : [];

const all_params = computed<Array<{ key: string; value: string }>>(() => {
  let result: { key: string; value: string }[] = []
  for (const [key, value] of Object.entries(route.query)) {
    const tidiedKey = (typeof implementationSafe._tidy_facet_paramname === 'function') ? implementationSafe._tidy_facet_paramname?.(key): key;
    const filteredValues = toStringArray(value).filter(val => val.trim().length > 0);
    if (filteredValues.length > 0) {
      add_missing_hierarchical_ancestor_values(tidiedKey, filteredValues).forEach((val: string) => result.push({ key: tidiedKey, value: val }));
    }
  }
  result = remove_unused_params(result)

  result.sort((a, b) => {
  const keyComparison = _query_param_sort(a.key).localeCompare(_query_param_sort(b.key));
  if (keyComparison !== 0) return keyComparison;
  return a.value.localeCompare(b.value);
});

  return result;
});

const filtering_params = computed<Array<{ key: string; value: string }>>(() => {
  const keysToDelete: string[] = implementation.non_filtering_keys ?? ['sort']
  return all_params.value.filter(item => !keysToDelete.includes(item.key))
})

const filtering_params_string = computed<string>(() => {
  return JSON.stringify(filtering_params.value)
})

const all_params_uri = computed<string>(() =>{
  const result_array: string[] = []
  all_params.value.forEach((item: { key: string; value: string }) => {
    result_array.push(item.key + '=' + encodeURI(String(item.value)))
  })
  return result_array.join('&')
})


const keyword_string = computed<string>(() => {
  return all_params.value.filter(item => item.key === 'keyword')
      .map(item => item.value)
      .join(' ')
})

const advanced_query_string = computed<string>(() => {
  const result: Record<string, string[]> = {}
    all_params.value.filter(item => implementation.advanced_params.includes(item.key)).forEach((item) => {
      if (result[item.key]) {
        result[item.key].push(item.value);
      } else {
        result[item.key] = [item.value];
      }
    });

  return stringifyQuery(result)
})

function get_facet_header(str: string) {
  return (str in implementation.facet_key ) ? implementation.facet_key[str]['name']: str
}

function throw_error(error: string) {
  is_error.value['bool'] = true
  is_error.value['message'] = error
  is_loading.value = false
  console.log(error)
}

const updateURL = async (page: number): Promise<void> => {
  _tracer_bullet('Moving to page ' + page)

  await router.push({
    name: 'search',
    query: { ...route.query, page: page },
  })
}

async function fetchData(start: number) {
  commits.value = []
  const control_params = []
  if (start) {
    control_params.push('page=' + start)
  }

  const url = implementation.api_url + '/' + core.value + '?' + all_params_uri.value + '&' + control_params.join('&')
  _tracer_bullet("Trying " + url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Invalid response');
    }

    const data = await response.json();
    _tracer_bullet(data);

    // Handle highlighting if present
     if (data?.highlighting) {
      for (const doc of data.response.docs) {
        const id = doc.id;
        // Use below if not checking for existence of highlighting before iterating docs
        //const highlights = 'highlighting' in data? data.highlighting[id] : { _text_: [] };
        // Use below instead of above if checking for existence of highlighting before iterating docs
        const highlights = data.highlighting[id] ?? { _text_: [] };
        // Does this update data.response? It appears to.
        doc.highlighting = [
          ...new Set(Object.values(highlights).flat().filter(Boolean)),
        ];
      }
    }

    if (!is_error.value.bool) {
      commits.value = data.response.docs;
      total.value = data.response.numFound;

      // Clean and format facets
      const facetDetails = Object.entries(data.facet_counts.facet_fields) as [string, (string | number)[]][];

      const facetsCleaned = facetDetails.reduce(
        (
          acc: Record<string, { val: string; count: number }[]>,
          [facetName, facetPairs]: [string, (string | number)[]]
        ) => {
          acc[facetName] = [];
          for (let i = 0; i < facetPairs.length; i += 2) {
            acc[facetName].push({
              val: facetPairs[i] as string,
              count: facetPairs[i + 1] as number,
            });
          }
          return acc;
        },
        {} as Record<string, { val: string; count: number }[]>
      );

      facets.value = facetsCleaned;
    }
  } catch (error) {
    throw_error(error instanceof Error ? error.message : String(error));
  }
}

onMounted(async () => {
  window.scrollTo(0, 0)
  await fetchData(currentPage.value).then(() => {
    is_loading.value = false
  })
})
</script>

<template>
  <campl-page-header :keywords="keyword_string" :key="keyword_string" />
  <div class="campl-row campl-content campl-recessed-content dcpNew">
    <div class="campl-wrap clearfix">
      <div
        class="campl-column9 campl-main-content"
        id="page-content"
        style="min-height: 100vh"
      >
        <div class="region region-content">
          <div
            id="block-darwin-sharing-darwin-sharing-add"
            class="block block-darwin-sharing campl-content-container"
          >
            <div>
              <div class="social-media-share">
                <a
                  class="icon-sm darwin-facebook"
                  :href="
                    'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.darwinproject.ac.uk' +
                    fullpath_uriencoded
                  "
                  title="Share on Facebook"
                  target="_blank"
                  ><i class="fab fa-facebook-f" aria-hidden="true"></i
                ></a>
                <a
                  class="icon-sm darwin-twitter"
                  :href="
                    'https://twitter.com/intent/tweet?text=Search+results&amp;url=https%3A%2F%2Fwww.darwinproject.ac.uk' +
                    fullpath_uriencoded
                  "
                  title="Share on Twitter"
                  target="_blank"
                  ><i class="fab fa-twitter" aria-hidden="true"></i
                ></a>
                <a
                  class="icon-sm darwin-email"
                  :href="
                    'mailto:?&amp;subject=Search results&amp;body=https%3A%2F%2Fwww.darwinproject.ac.uk' +
                    fullpath_uriencoded
                  "
                  title="Share by email"
                  ><i class="fas fa-envelope" aria-hidden="true"></i
                ></a>
              </div>
              <!-- end social media sharing -->
            </div>
          </div>
          <div id="block-system-main" class="block block-system">
            <div class="darwin-search-results" v-show="is_loading">
              <CSpinner />
            </div>
            <div class="darwin-search-results" v-if="is_error['bool']">
              <p>
                I'm sorry, I'm unable to complete your request ({{
                  is_error['message']
                }})
              </p>
              <p>Please try again in a few minutes</p>
            </div>
            <div v-show="!is_loading && !is_error['bool']">
              <div class="campl-content-container" :key="route.fullPath">
                <ul class="tab-menu">
                  <li>
                    <a
                      :href="implementation.tab_href('cudl-results', core, all_params)"
                      :class="implementation.tab_class('cudl-results', core)"
                      >Letters, people &amp; references</a
                    >
                  </li>
                  <li>
                    <a
                      :href="implementation.tab_href('this-site', core, all_params)"
                      :class="implementation.tab_class('this-site', core)"
                      >Articles</a
                    >
                  </li>
                </ul>
                <div class="darwin-search-results-container">
                  <div class="search-results-page">
                    <div class="darwin-search-results">
                      <div
                        class="cudl-results search-results-list"
                        style="display: block"
                      >
                        <div class="resultsHeader">
                          <div class="query">
                            <div class="label">
                              <b>Search:</b>
                            </div>
                            <div class="subQuery">
                                <div
                                  class="option"
                                  v-for="o in filtering_params"
                                  :key="JSON.stringify(o)"
                                >
                                  <span class="subhit">{{ o.value }}</span>
                                  in <b>{{ get_facet_header(o.key) }}</b
                                  >&nbsp;
                                  <router-link :to="{ name: 'search', query: cancel_link(o.key, o.value, all_params) }">
                                  <span class="material-icons"
                                      >disabled_by_default</span
                                    >
                                  </router-link>
                                </div>
                              <p
                                class="modify_advanced"
                                v-if="advanced_query_string.length > 0"
                              >
                                <a
                                  :href="
                                    '/advanced-search?' + advanced_query_string
                                  "
                                  >Modify search</a
                                >
                              </p>
                            </div>
                          </div>
                          <div class="num_items" v-show="total >= 1">
                            <span id="itemCount">{{ total }}</span> Item{{
                              total != 1 ? 's' : ''
                            }}
                          </div>
                          <div v-if="total >= 1">
                            <div class="sort_by" v-if="core != 'pages'">
                              <form method="get" action="/search">
                                <b>Sorted by:&nbsp;</b>
                                <select size="1" name="sort">
                                  {{
                                    sort
                                  }}
                                  <option
                                    value="score"
                                    :selected="sort == 'score'"
                                  >
                                    relevance
                                  </option>
                                  <option
                                    value="author"
                                    :selected="sort == 'author'"
                                  >
                                    author
                                  </option>
                                  <option
                                    value="addressee"
                                    :selected="sort == 'addressee'"
                                  >
                                    addressee
                                  </option>
                                  <option
                                    value="date"
                                    :selected="sort == 'date'"
                                  >
                                    date
                                  </option>
                                </select>
                                <input
                                  v-for="obj in filtering_params"
                                  type="hidden"
                                  :name="String(obj.key)"
                                  :value="obj.value"
                                  :key="obj.key + obj.value"
                                />
                                <input type="hidden" name="page" value="1" />
                                <input type="hidden" name="tab" value="" />
                                <input type="hidden" name="tc" :value="core" />
                                &nbsp;<input type="submit" value="Go!" />
                              </form>
                            </div>
                            <div :class="'pages ' + paginate_results">
                              <vue-awesome-paginate
                                :totalItems="total"
                                :itemsPerPage="items_per_page"
                                :maxPagesShown="5"
                                v-model="currentPage"
                                @click="updateURL"
                                type="link"
                                :linkUrl="'/search?page=[page]&' + all_params_uri"
                              />
                            </div>
                          </div>
                          <NoResults
                            :keyword="keyword_string"
                            v-else-if="total === 0"
                          />
                        </div>
                        <ResultItem
                          v-for="(item, index) in commits"
                          :item="item"
                          :currentPage="currentPage"
                          :index="index"
                          :key="JSON.stringify(item)"
                        />
                        <div
                          :class="'pages ' + paginate_results">
                          <vue-awesome-paginate
                            :totalItems="total"
                            :itemsPerPage="items_per_page"
                            :maxPagesShown="5"
                            v-model="currentPage"
                            @click="updateURL"
                            type="link"
                            :linkUrl="'/search?page=[page]&' + all_params_uri"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- facets -->

      <div class="campl-column3 campl-secondary-content" id="page-secondary">
        <div class="region-sidebar">
          <div class="srch-sidebar"></div>
          <div class="view-my-sidebar">
            <div class="field-content">
              <h3>Refine your search</h3>
              <div class="cudl-results sidebar-results-list">
                <div class="facet">
                  <facet-block
                    v-for="facet in implementation.desired_facets"
                    :desired_facet="facet"
                    :facets="facets"
                    :facet_key="implementation.facet_key"
                    :params="all_params"
                    :key="filtering_params_string+'::'+facet"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}

.social-media-share a {
  color: white;
  display: inline-block;
}

.social-media-share a svg {
  color: white;
  vertical-align: text-top;
}

.dcpNew .bibliography .item-title {
  font-style: inherit;
}

.dcpNew em.match {
  color: rgb(42, 127, 189);
  font-weight: bold;
  font-style: inherit;
}

.dcpNew .search-results-page .search-result-item .snippets li {
  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

/*.dcpNew .snippets {
  max-height: 6em;
}*/

.dcpNew .search-results-page .search-result-item .main-icon {
  line-height: 1.75;
}

.dcpNew span.doubleUnderline,
.dcpNew div.doubleUnderline {
  font-weight: normal;
  text-decoration-line: underline;
  text-decoration-style: double;
}

.dcpNew .pagination-container {
  display: flex;
  column-gap: 10px;
}

.dcpNew ul#componentContainer .paginate-buttons {
  font-size: 0.8em;
  height: 2em;
  width: 2em;
  border-radius: 6px;
  cursor: pointer;
  background-color: rgb(240, 240, 240);
  border: 1px solid rgb(217, 217, 217);
  color: black;
}

.dcpNew ul#componentContainer .paginate-buttons:hover {
  background-color: rgb(254, 254, 254);
  border: 1px solid rgb(200, 200, 200);
}

.dcpNew .search-results-page .pages {
  margin: 1em 0;
  font-weight: bold;
  display: flex;
  justify-content: center;
}

.dcpNew .pages ul#componentContainer {
  margin-left: 0;
}

.dcpNew ul#componentContainer a.active-page,
.dcpNew ul#componentContainer a.active-page:hover {
  cursor: default;
  background: rgb(254, 254, 254);
  border-color: rgb(200, 200, 200);
}

.dcpNew .subQuery a {
  display: inline-block;
}

.dcpNew .subQuery a .material-icons {
  display: inline-block;
  vertical-align: bottom;
  font-size: 1rem;
  color: rgb(240, 0, 0);
}

.dcpNew .resultsHeader .query {
  margin-bottom: 1.5em;
}

.dcpNew .campl-column3.campl-secondary-content {
  display: block;
  position: relative !important;
}

#page-content .modify_advanced a,
#page-content .modify_advanced a:visited {
  color: #fff;
  background-color: #4b701c;
  padding: 3px 12px;
  border-radius: 24px;
  margin-top: 10px;
  box-shadow: rgba(0, 0, 0, 0.27) 1px 1px 5px;
}

#page-content .search-results-page .search-result-item h2 a {
  color: #111;
}

/* CSS for spinner from coreui - https://github.com/coreui/coreui.
   It's compatible bootstrap 5 and loading up the full CSS disrupts the current
   fragile CSS. Once migration to bootstrap is complete, the main css file can
   be used, which will be a more robust solution.
 */

.visually-hidden,
.visually-hidden-focusable:not(:focus):not(:focus-within) {
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
.visually-hidden:not(caption),
.visually-hidden-focusable:not(:focus):not(:focus-within):not(caption) {
  position: absolute !important;
}

.spinner-grow,
.spinner-border {
  display: inline-block;
  width: var(--cui-spinner-width);
  height: var(--cui-spinner-height);
  vertical-align: var(--cui-spinner-vertical-align);
  border-radius: 50%;
  animation: var(--cui-spinner-animation-speed) linear infinite
    var(--cui-spinner-animation-name);
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg) /* rtl:ignore */;
  }
}
.spinner-border {
  --cui-spinner-width: 2rem;
  --cui-spinner-height: 2rem;
  --cui-spinner-vertical-align: -0.125em;
  --cui-spinner-border-width: 0.25em;
  --cui-spinner-animation-speed: 0.75s;
  --cui-spinner-animation-name: spinner-border;
  border: var(--cui-spinner-border-width) solid currentcolor;
  border-right-color: transparent;
}

.spinner-border-sm {
  --cui-spinner-width: 1rem;
  --cui-spinner-height: 1rem;
  --cui-spinner-border-width: 0.2em;
}

@keyframes spinner-grow {
  0% {
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: none;
  }
}
.spinner-grow {
  --cui-spinner-width: 2rem;
  --cui-spinner-height: 2rem;
  --cui-spinner-vertical-align: -0.125em;
  --cui-spinner-animation-speed: 0.75s;
  --cui-spinner-animation-name: spinner-grow;
  background-color: currentcolor;
  opacity: 0;
}

.spinner-grow-sm {
  --cui-spinner-width: 1rem;
  --cui-spinner-height: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  .spinner-border,
  .spinner-grow {
    --cui-spinner-animation-speed: 1.5s;
  }
}

.spinner-border {
  margin: 5em auto 0 auto;
  text-align: center;
  display: block;
}

div.pages.false .pagination-container li:has(a.back-button),
div.pages.false .pagination-container li:has(a.next-button) {
  display: none;
}
div.pages.false .pagination-container li:has(a.number-buttons) {
  display: inherit;
}

@media (max-width: 767px) {
  li:has(a.paginate-buttons.number-buttons) {
    display: none;
  }
  #page-content li:has(a.paginate-buttons.number-buttons.active-page) {
    display: inherit;
  }

  /*  li:has(a.paginate-buttons.number-buttons):nth-last-child(2), li:has(a.paginate-buttons.number-buttons):nth-child(2) {
    display: inherit;
  }*/

  .dcpNew ul#componentContainer .paginate-buttons {
    font-size: 0.7em;
    height: 1.5em;
    width: 1.5em;
    border-radius: 6px;
    cursor: pointer;
    background-color: rgb(240, 240, 240);
    border: 1px solid rgb(217, 217, 217);
    color: black;
  }

  #page-content .search-results-page .pages a {
    margin: 0 4px 0 4px;
    padding: 2px 7px;
    background-color: #f8f8f8;
    border: 1px solid #eee;
  }
}
</style>
