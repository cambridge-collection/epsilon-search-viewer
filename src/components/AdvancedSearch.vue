<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import {
  advanced_params,
  params_to_remove,
  section_type_options,
  correspondent_role_options,
  date_type_options,
  collection_options,
} from '@/implementationConfig'

const props = defineProps({
  params: { type: Array as () => { key: string; value: string }[], required: true },
  title: { type: String, default: 'Search within these results' },
})

const route = useRoute()
const router = useRouter()

const correspondentKeys = correspondent_role_options.map(o => o.value)

function first(key: string): string {
  return props.params.find(p => p.key === key)?.value ?? ''
}

function joined(key: string): string {
  return props.params.filter(p => p.key === key).map(p => p.value).join(' ')
}

function freshAdv() {
  return {
    text: '',
    sectionType: '',
    role: 'search-correspondent',
    name: '',
    year: '',
    month: '',
    day: '',
    yearMax: '',
    monthMax: '',
    dayMax: '',
    dateType: 'on',
    excludeWide: 'No',
    collections: [] as string[],
  }
}

function advFromParams() {
  const activeCorrespondent = correspondentKeys.find(k => first(k))
  return {
    text: joined('text') || joined('keyword'),
    sectionType: first('sectionType'),
    role: activeCorrespondent ?? 'search-correspondent',
    name: activeCorrespondent ? first(activeCorrespondent) : '',
    year: first('year'),
    month: first('month'),
    day: first('day'),
    yearMax: first('year-max'),
    monthMax: first('month-max'),
    dayMax: first('day-max'),
    dateType: first('search-date-type') || 'on',
    excludeWide: first('exclude-widedate') === 'Yes' ? 'Yes' : 'No',
    // The advanced search page sends the collections as one space-separated list of quoted names
    collections: [...joined('collection').matchAll(/"([^"]+)"/g)].map(m => m[1]),
  }
}

const adv = reactive(advFromParams())

watch(() => props.params, () => Object.assign(adv, advFromParams()))

const has_search_params = computed<boolean>(() => props.params.some(p => p.key === 'keyword' || advanced_params.includes(p.key)))

const collection_summary = computed<string>(() => adv.collections.length ? adv.collections.join(', ') : 'All collections')

function baseQuery(): LocationQueryRaw {
  const q: LocationQueryRaw = { ...route.query }
  for (const k of params_to_remove) delete q[k]
  for (const k of advanced_params) delete q[k]
  delete q.keyword
  return q
}

function onReset(): void {
  if (has_search_params.value) {
    router.push({ name: 'search', query: { ...baseQuery(), page: 1 } })
    return
  }
  Object.assign(adv, freshAdv())
}

function onSubmit(): void {
  const q = baseQuery()

  // `keyword` and an unsectioned `text` search are equivalent; keyword keeps the header search box in step
  const term = adv.text.trim()
  if (term) {
    if (adv.sectionType) {
      q.text = term
      q.sectionType = adv.sectionType
    } else {
      q.keyword = term
    }
  }
  if (adv.name.trim()) q[adv.role] = adv.name.trim()

  const dates: Record<string, string> = {
    year: adv.year,
    month: adv.month,
    day: adv.day,
  }
  if (adv.dateType === 'between') {
    dates['year-max'] = adv.yearMax
    dates['month-max'] = adv.monthMax
    dates['day-max'] = adv.dayMax
  }
  let hasDate = false
  for (const [k, v] of Object.entries(dates)) {
    if (v.trim()) {
      q[k] = v.trim()
      hasDate = true
    }
  }
  if (hasDate) {
    q['search-date-type'] = adv.dateType
    q['exclude-widedate'] = adv.excludeWide
  }

  // The API ANDs the quoted names unless collection-join is 'or'
  if (adv.collections.length) {
    q.collection = adv.collections.map(c => `"${c}"`).join(' ')
    q['collection-join'] = 'or'
  }

  q.page = 1
  router.push({ name: 'search', query: q })
}
</script>

<template>
  <div class="advanced-search mb-4">
    <h6 v-if="title" class="facetName bg-info pt-2 pb-2 mb-0 text-center text-white">
      {{ title }}
    </h6>
    <form :class="{ 'border border-top-0 p-2': title }" @submit.prevent="onSubmit">
      <div class="field mb-2">
        <select v-model="adv.sectionType" class="custom-select custom-select-sm prefix" aria-label="Search in">
          <option v-for="opt in section_type_options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input v-model="adv.text" type="text" class="form-control form-control-sm" placeholder="Search..." aria-label="Search terms" />
      </div>

      <div class="field mb-2">
        <select v-model="adv.role" class="custom-select custom-select-sm prefix" aria-label="Correspondent role">
          <option v-for="opt in correspondent_role_options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input v-model="adv.name" type="text" class="form-control form-control-sm" placeholder="Correspondent" aria-label="Correspondent name" />
      </div>

      <div class="field mb-2">
        <select v-model="adv.dateType" class="custom-select custom-select-sm prefix" aria-label="Date match">
          <option v-for="opt in date_type_options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <span class="date-parts" :class="{ between: adv.dateType === 'between' }">
          <input v-model="adv.year" type="text" class="form-control form-control-sm yyyy" placeholder="yyyy" aria-label="Year" />
          <input v-model="adv.month" type="text" class="form-control form-control-sm" placeholder="mm" aria-label="Month" />
          <input v-model="adv.day" type="text" class="form-control form-control-sm" placeholder="dd" aria-label="Day" />
          <template v-if="adv.dateType === 'between'">
            <span>&ndash;</span>
            <input v-model="adv.yearMax" type="text" class="form-control form-control-sm yyyy" placeholder="yyyy" aria-label="End year" />
            <input v-model="adv.monthMax" type="text" class="form-control form-control-sm" placeholder="mm" aria-label="End month" />
            <input v-model="adv.dayMax" type="text" class="form-control form-control-sm" placeholder="dd" aria-label="End day" />
          </template>
        </span>
      </div>

      <div class="small mb-2" role="radiogroup" aria-labelledby="adv-exclude-widedate">
        <span id="adv-exclude-widedate">Exclude letters with a possible date-range greater than two years:</span>
        <div v-for="opt in ['Yes', 'No']" :key="opt" class="custom-control custom-radio custom-control-inline">
          <input :id="'adv-exclude-widedate-' + opt" v-model="adv.excludeWide" :value="opt" type="radio" name="exclude-widedate" class="custom-control-input" />
          <label :for="'adv-exclude-widedate-' + opt" class="custom-control-label">{{ opt }}</label>
        </div>
      </div>

      <div id="adv-collection-label" class="small mb-1">Limit by collection:</div>
      <details class="collections mb-2">
        <summary id="adv-collection-summary" class="custom-select custom-select-sm text-truncate" aria-labelledby="adv-collection-label adv-collection-summary">
          {{ collection_summary }}
        </summary>
        <div class="collection-list border border-top-0 px-2 py-1 small">
          <div v-for="(c, i) in collection_options" :key="c" class="custom-control custom-checkbox">
            <input :id="'adv-collection-' + i" v-model="adv.collections" :value="c" type="checkbox" class="custom-control-input" />
            <label :for="'adv-collection-' + i" class="custom-control-label">{{ c }}</label>
          </div>
        </div>
      </details>

      <div class="text-right">
        <button type="button" class="btn btn-sm btn-outline-info mr-2" @click="onReset">Clear</button>
        <button type="submit" class="btn btn-sm btn-info">Search</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.field .prefix {
  flex: 0 0 7.5rem;
}

.field > .form-control,
.date-parts {
  flex: 1 1 8em;
  min-width: 0;
}

.date-parts {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}

/* Narrowest a 'between' range gets before its placeholders clip */
.date-parts.between {
  flex-basis: 11.5em;
}

.date-parts .form-control {
  flex: 1 1 0;
  min-width: 0;
  padding-left: 1px;
  padding-right: 1px;
  text-align: center;
}

.date-parts .form-control.yyyy {
  flex-grow: 1.15;
  min-width: 2.2em;
}

.collections summary {
  cursor: pointer;
  list-style: none;
}

.collections summary::-webkit-details-marker {
  display: none;
}

.collection-list {
  max-height: 12rem;
  overflow-y: auto;
}
</style>
