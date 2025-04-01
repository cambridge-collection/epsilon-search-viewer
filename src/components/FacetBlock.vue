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
    'f1-decade-year': props.facets['f1-decade-year'],
    'f1-decade-year-month': props.facets['f1-decade-year-month'],
    'f1-decade-year-month-day': props.facets['f1-decade-year-month-day'],
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
  <div class="facet pb-2 mb-4" v-if="has_entries">
    <h6 class="facetName bg-info pt-2 pb-2 mb-0 text-center text-white">
      {{ name }}
    </h6>
    <ul class="facetGroup list-group list-group-root">
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
      <li class="facetLess list-group-item d-flex justify-content-between align-items-center"  v-if="is_expandable && target_facets.length >= 5">
          <router-link :to="{ name: 'search', query: unexpand_link}" class="badge badge-light badge-pill border mx-auto mt-2 mb-2" v-if="is_expanded" >
            <i class="fas fa-angle-double-up"></i> FEWER <i class="fas fa-angle-double-up"></i>
          </router-link>
          <router-link :to="{ name: 'search', query: expand_link}" class="badge badge-light badge-pill border mx-auto mt-2 mb-2" v-else>
            <i class="fas fa-angle-double-down"></i> MORE <i class="fas fa-angle-double-down"></i>
          </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>
