<script lang="ts" setup>
import FacetItem from '../components/FacetItem.vue'
import { computed, ref } from 'vue'
import { _params_to_query_structure } from '@/lib/utils';
import * as implementation from '@/implementationConfig'

const props = defineProps({
  desired_facet: { type: String, required: true },
  facets: { type: Object, required: true },
  facet_key: { type: Object, required: true },
  params: {type: Array as () => { key: string; value: string }[], required: true},
})

const name = computed<string>(() => props.facet_key[props.desired_facet].name.replace(/(^"|"$)/g, ''))

const target_facets = computed<{ val: string; count: number; }[]>(() => {
  return props.facets[props.desired_facet]
})

const has_entries = computed<boolean>(() => {
  return (
    props.desired_facet in props.facets &&
    props.facets[props.desired_facet].length > 0
  )
})

// Refactor to generic function using implementation.facet (with subfacets)
// All subfacets for a given key have to be included, regardless of depth
const subfacets = computed(() => {
  return {
    'f1-year-month': props.facets['f1-year-month'],
    'f1-year-month-day': props.facets['f1-year-month-day'],
  }
})

const is_expandable = computed<boolean>(() => implementation.expandable.includes(name.value.toLowerCase()))

const is_expanded = computed<boolean>(() => props.params.filter(item => item.key == 'expand')[0]?.value.toLowerCase() === name.value.toLowerCase())

const unexpand_link = computed<Record<string, string[]>>(() => _params_to_query_structure(props.params.filter(item => item.key !== 'expand')))

const expand_link = computed<Record<string, string[]>>(() => ({ ...unexpand_link.value, expand: [name.value.toLowerCase()] }));

const current_facet_selections = computed<string[]>(() => props.params
  .filter((item: { key: string; value: string }) => item.key === props.desired_facet)
  .map((item: { key: string; value: string }) => item.value))

</script>

<template>
  <div class="facet" v-if="has_entries">
    <div class="facetName">
      {{ name }}
      <div class="facetMore" v-if="is_expandable">
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
            v-for="facet in facets[desired_facet]"
            :facet="facet"
            :param_name="desired_facet"
            :params="params"
            :current_selections="current_facet_selections"
            :subfacets="subfacets"
            v-bind:is_subgroup="false"
            :key="JSON.stringify(facet)"
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
