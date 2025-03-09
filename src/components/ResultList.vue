<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, stringifyQuery } from 'vue-router';
import ResultItem from '@/components/ResultItem.vue';
import FacetBlock from '@/components/FacetBlock.vue';
import CamplPageHeader from '@/components/campl-page-header.vue';
import NoResults from '@/components/NoResults.vue';
import 'vue-awesome-paginate/dist/style.css';
import { CSpinner } from '@coreui/vue';
import { _get_first_value, _tracer_bullet } from '@/lib/utils';
import * as implementation from '@/implementationConfig'

const router = useRouter();
const route = useRoute();

const commits = ref(<any[]>[]);
const facets = ref(<any>{});
const is_loading = ref<boolean>(true);
const is_error = ref<any>({ bool: false, message: "" });
const items_per_page = 20
const total = ref<number>(0);
const currentPage = ref<number>(get_current_page());

const core = computed<'pages' | 'items'>(() => _get_first_value(route.query?.tc ?? null) === 'pages' ? 'pages' : 'items' )
// Update sort
const sort = computed(() => 'sort' in route.query ? route.query['sort'] : 'score')

const fullpath_uriencoded = computed<string>(() => encodeURIComponent(route.fullPath) )

const paginate_results = computed<boolean>(() => total.value >= items_per_page )

function get_current_page(): number {
  return ('page' in route.query && /^\d+$/.test(String(route.query['page']))) ? Number(route.query['page']): 1;
}


// These are the search params
//const q_params_tidied: any = {}
const q_params_tidied = computed(() => {
  const result: any = {}
  for (const key in route.query) {
    if (
      !['start', 'page', 'tab', 'smode', 'text-exclude'].includes(key) &&
      route.query[key]
    ) {
      const new_key = key.replace(/^f\d+-/, 'f1-')
      result[new_key] = [
        route.query[key],
        new_key in result ? result[new_key] : []
      ].flat(Infinity)
    }
  }

  if ('f1-date' in result && result['f1-date']) {
    const vals: Array<string> = result['f1-date']
    const final_vals: Array<string> = []
    vals.forEach(d => {
      const d_clean: string = d.replace(/(^"|"$)/g, '')
      if (d.includes('::')) {
        const tokens = d_clean.split('::')
        for (let j = 1; j <= tokens.length; j++) {
          final_vals.push(tokens.slice(0, j).join('::'))
        }
      } else {
        final_vals.push(d_clean)
      }
    })
    result['f1-date'] = [...new Set(final_vals)].sort()
  }
  return result
})

const facets_key = computed(() => {
  const p = { ...q_params_tidied.value }
  if ('expand' in route.params) {
    p['expand'] = route.params['expand']
  }
  return p
})


// Remove search-date-type if not date query terms are entered
if (
  'search-date-type' in q_params_tidied.value &&
  !Object.keys(q_params_tidied.value).some(ai =>
    ['year', 'month', 'day'].includes(ai),
  )
) {
  delete q_params_tidied.value['search-date-type']
}

const param_strings: string[] = []
for (const key in q_params_tidied.value) {
  param_strings.push(key + '=' + encodeURI(q_params_tidied.value[key]))
}

const params = param_strings.join('&')

const query_key = computed(() => {
  return JSON.stringify(route.query)
})

const keyword_values = computed(() => {
  // Used for :key to determine whether to update the page header
  // because the keyword appears in the search fields
  let result = ''
  if ('keyword' in query_params.value) {
    result = query_params.value['keyword']['details']
      .map((e: any) => e.value)
      .join(' ')
  }
  return result
})

function get_fieldname(p: string) {
  let name: string
  if (p == 'q') {
    name = 'q' //keyword
  } else {
    name = p
  }
  return name
}

function get_term_cancel_link(p: string, v: string) {
  // Need to clear child params if parent is deselected -- ie.
  // facet down to a specific day - then remove the month
  // both day and month should not appear in the cancel link

  // Remove object for key 'p' from param list
  const ps_tidied = Object.fromEntries(
    Object.entries(q_params_tidied.value).filter(([k, v]) => k !== p),
  )
  const current_param = Object.fromEntries(
    Object.entries(q_params_tidied.value).filter(([k, v]) => k == p),
  )
  const qs = []
  if (Object.keys(ps_tidied).length == 0) {
    qs.push('keyword=') // Should be browse-all=yes
  } else {
    for (const key in ps_tidied) {
      let vals: any[] = []
      if (Array.isArray(ps_tidied[key])) {
        vals = vals.concat(ps_tidied[key])
      } else {
        vals.push(ps_tidied[key])
      }
      vals.forEach(function (val, index) {
        if (!(key == p && val == v)) {
          qs.push(get_fieldname(key) + '=' + val)
        }
      })
    }
    // Add any relevant values for the current param that would NOT
    // be cancelled by current cancellation
    for (const key of Object.keys(current_param)) {
      let vals: string[] = []
      if (Array.isArray(current_param[key])) {
        vals = vals.concat(current_param[key])
      } else if (typeof current_param[key] == 'string') {
        vals.push(current_param[key])
      }

      for (const val of vals) {
        if (!remove_vals(p, v, key, val)) {
          qs.push(get_fieldname(key) + '=' + val)
        }
      }
    }
  }
  return qs.join('&') + '&page=1'
}

function remove_vals(
  selected_key: string,
  selected_value: string,
  key: string,
  val: string,
) {
  let matches = key == selected_key && val == selected_value
  if (/^f\d+-date$/.test(selected_key)) {
    const tidied_val = selected_value.replaceAll(/^"(.+?)"$/g, '$1')
    const val_pattern = new RegExp('^' + tidied_val + '::')
    matches =
      val == selected_value ||
      val_pattern.test(val.replaceAll(/^"(.+?)"$/g, '$1'))
  }
  return matches
}

// Final query param string
const query_params: any = computed(() => {
  const p: any = {}
  for (const key in q_params_tidied.value) {
    const value = q_params_tidied.value[key]

    p[key] = {
      fieldname: get_fieldname(key),
    }
    const details: any[] = []
    let detail: any = {}
    let vals: string[] = []

    if (Array.isArray(value)) {
      vals = vals.concat(value)
    } else {
      vals.push(value)
    }
    vals.forEach(function (val, index) {
      detail = {
        value: val,
        cancel_link: get_term_cancel_link(key, val),
      }
      details.push(detail)
    })
    p[key]['details'] = details
  }
  return p
})

const sp = { ...query_params.value }
delete sp['sort']
delete sp['tc']
delete sp['expand']

const expand = computed(() => {
  return 'expand' in route.query ? route.query['expand'] : null
})

const keyword = computed(() => {
  return 'keyword' in route.query ? route.query['keyword'] : null
})

const advanced_query_string = computed(() => {
  const params: any = {}
  implementation.advanced_params.forEach(p => {
    if (p in q_params_tidied.value && q_params_tidied.value[p]) {
      params[p] = q_params_tidied.value[p]
    }
  })

  return stringifyQuery(params)
})

function tab_active(name: string): boolean {
  return (
    (name == 'this-site' && core.value == 'pages') ||
    (name == 'cudl-results' && core.value != 'pages')
  )
}

function tab_class(name: string) {
  const active_class = tab_active(name) ? 'active' : null
  return [name, active_class].join(' ')
}

function tab_href(name: string) {
  let path = tab_active(name) ? '#' : '/search?'
  const params = { keyword: keyword.value, tc: 'pages', page: 1 }

  if (name != 'this-site') {
    delete (params as { tc?: string }).tc
  }
  if (!tab_active(name)) {
    path += stringifyQuery(params)
  }
  return path
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
  if (sort.value) {
    control_params.push('sort=' + sort.value)
  }
  if (expand.value) {
    control_params.push('expand=' + expand.value)
  }
  const url =
    implementation.api_url + '/' + core.value + '?' + params + '&' + control_params.join('&')
  _tracer_bullet("Trying " + url)
  const nq = await fetch(url, {
    method: 'get',
    mode: 'cors',
    credentials: 'include'})
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      throw new Error('Invalid response')
    })
    .then(responseJson => {
      //console.log(responseJson)
      for (let i = 0; i < responseJson['response']['docs'].length; i++) {
        const id = responseJson['response']['docs'][i].id
        const highlights =
          id in responseJson['highlighting']
            ? responseJson['highlighting'][id]
            : { _text_: [] }
        responseJson['response']['docs'][i]['highlighting'] = [
          ...new Set(
            Object.values(highlights)
              .flat(1)
              .filter(n => n),
          ),
        ]
      }
      return responseJson
    })
    .catch(error => {
      throw_error(error)
    })
  if (!is_error.value['bool'] && nq['response']) {
  commits.value = nq['response']['docs']
  total.value = nq['response']['numFound']
  const facets_cleaned: any = {}
  for (const key of implementation.desired_facets) {
    const facet_details = Object.entries(
      nq['facet_counts']['facet_fields'],
    ) as [string, Array<unknown>][]
    for (const [facet_name, facet_pairs] of facet_details) {
      facets.value[facet_name] = { buckets: [] }
      const buckets = []
      for (let i = 0; i < facet_pairs.length; i += 2) {
        const pair = facet_pairs.slice(i, i + 2)
        buckets.push({ val: pair[0], count: pair[1] })
      }
      facets_cleaned[facet_name] = buckets
    }
  }
  facets.value = facets_cleaned
}
  else {
    // The fetch result wasn't json with a 'response' property
    const msg = (is_error.value['message']) ? is_error.value['message'] : 'Error: Invalid response data'
    throw_error(msg)
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
  <campl-page-header :query_params="query_params" :key="keyword_values" />
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
                      :href="tab_href('cudl-results')"
                      :class="tab_class('cudl-results')"
                      >Letters, people &amp; references</a
                    >
                  </li>
                  <li>
                    <a
                      :href="tab_href('this-site')"
                      :class="tab_class('this-site')"
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
                                v-for="obj in sp"
                                :key="JSON.stringify(obj)"
                              >
                                <div
                                  class="option"
                                  v-for="o in obj['details']"
                                  :key="JSON.stringify(o)"
                                >
                                  <span class="subhit">{{ o.value }}</span>
                                  in <b>{{ obj.fieldname }}</b
                                  >&nbsp;<a :href="'/search?' + o.cancel_link"
                                    ><span class="material-icons"
                                      >disabled_by_default</span
                                    ></a
                                  >
                                </div>
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
                                  v-for="(value, name) in q_params_tidied"
                                  type="hidden"
                                  :name="String(name)"
                                  :value="value"
                                  :key="name + value"
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
                                :linkUrl="'/search?page=[page]&' + params"
                              />
                            </div>
                          </div>
                          <NoResults
                            :keyword="keyword_values"
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
                            :linkUrl="'/search?page=[page]&' + params"
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
                    :params="params"
                    v-bind:facets="facets"
                    v-bind:facet_key="implementation.facet_key"
                    v-bind:query_params="query_params"
                    v-bind:q_params_tidied="q_params_tidied"
                    :key="facets_key + '::' + facet"
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
