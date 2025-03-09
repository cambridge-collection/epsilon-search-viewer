<script lang="ts" setup>
import FacetItem from '../components/FacetItem.vue'
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const route = useRoute()
const props = defineProps({
  desired_facet: { type: String, required: true },
  facets: { type: Object, required: true },
  facet_key: { type: Object, required: true },
  query_params: { type: Object, required: true },
  q_params_tidied: { type: Object, required: true },
})

const fullPath = ref(route.fullPath)
const expandedName = ref('expand' in route.query ? route.query['expand'] : null)
const name = ref<string>(
  props.facet_key[props.desired_facet].name.replace(/(^"|"$)/g, ''),
)

const target_facets = computed(() => {
  return props.facets[props.desired_facet]
})

const has_entries = computed<boolean>(() => {
  return (
    props.desired_facet in props.facets &&
    props.facets[props.desired_facet].length > 0
  )
})

const subfacets = computed(() => {
  return {
    'f1-year-month': props.facets['f1-year-month'],
    'f1-year-month-day': props.facets['f1-year-month-day'],
  }
})

const is_expandible = computed<boolean>(() => {
  return [
    'author',
    'addressee',
    'correspondent',
    'repository',
    'volume',
  ].includes(name.value.toLowerCase())
})

const is_expanded = computed(() => {
  return (
    'expand' in route.query && expandedName.value == name.value.toLowerCase()
  )
})

const unexpand_link = computed(() => {
  const { expand, ...unexpand_obj } = route.query
  return unexpand_obj
})

const expand_link = computed(() => {
  const expand_obj = {...route.query}
  expand_obj['expand'] = name.value.toLowerCase()
  return expand_obj
})
</script>

<template>
  <div class="facet" v-if="has_entries">
    <div class="facetName">
      {{ name }}
      <div class="facetMore" v-if="is_expandible">
        <i v-if="target_facets.length >= 5">
          <router-link :to="{ name: 'search', query: unexpand_link}" v-if="is_expanded">less <span>-</span></router-link>
          <router-link :to="{ name: 'search', query: expand_link}" v-else>more <span>+</span></router-link>
        </i>
      </div>
    </div>
    <div class="facetGroup">
      <table>
        <tbody>
          <facetItem
            v-for="facet in target_facets"
            :facet="facet"
            :param_name="desired_facet"
            :query_params="query_params"
            :subfacets="subfacets"
            v-bind:is_subgroup="false"
            v-bind:q_params_tidied="props.q_params_tidied"
            :key="JSON.stringify(facet) + fullPath"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.dcpNew .facet .facetName {
  font-weight: bold;
  background-color: transparent;
  color: #111;
  padding-bottom: 0.5em;
  overflow: hidden;
}

.dcpNew .facet table {
  width: 100%;
  border-bottom: 2px solid #57831a;
}

.dcpNew .facet {
  margin-bottom: 2em;
}

.dcpNew .facet tbody {
  border-top: none !important;
}

.dcpNew .facet .facetSubGroup table {
  width: 90%;
  margin-left: 10%;
  border-top: none;
}

.facetMore {
  float: right;
}

.facetMore a,
.facetLess a {
  font-style: normal;
  font-weight: bold;
  font-size: 0.8em;
  color: #666;
  text-transform: uppercase;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px 4px 4px 4px;
  padding: 2px 8px;
}
</style>
