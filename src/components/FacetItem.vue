<script lang="ts" setup>
import { computed } from 'vue'
import escape from 'core-js/actual/regexp/escape'
import { _bucket_to_param_name, _get_subfacet_bucket_name, _params_to_query_structure, cancel_link, _query_param_sort } from '@/lib/utils';
import * as implementation from '@/implementationConfig'

const props = defineProps({
  facet: { type: Object as () => { val: string; count: number }, required: true },
  param_name: { type: String, required: true },
  params: {type: Array as () => { key: string; value: string }[], required: true},
  current_selections: {type: Array as () => string[], required: true},
  subfacets: { type: Object, required: true },
  is_subgroup: { type: Boolean, required: true },
})

const current_subfacet_selections = computed<string[]>(() => props.params
  .filter((item: { key: string; value: string }) => facet_name.value === item.key)
  .map((item: { key: string; value: string }) => item.value))

const is_selected = computed<boolean>(() => {
  const value: string = props.facet.val
  return (current_subfacet_selections.value.some(
      (e: string) => {
        const para_val: string = String(e).replaceAll(/^"(.+?)"$/g, '$1')
        const re = new RegExp("^"+ escape(value) +'::')

        return para_val == value || re.test(para_val)
      }
    ))
  })

const new_facet_params = computed<Record<string, string[]>>(() => {
  //console.log(facet_name.value)
  const param_array: { key: string; value: string }[] = [...props.params]
  param_array.push({key: facet_name.value, value: props.facet.val})

  param_array.sort((a, b) => {
    // First compare by key
    const keyComparison = _query_param_sort(a.key).localeCompare(_query_param_sort(b.key));
    if (keyComparison !== 0) return keyComparison;

    // If keys are the same, compare by value
    return a.value.localeCompare(b.value);
  });

  const result: Record<string, string[]>  = _params_to_query_structure(param_array)
  result['page'] = ['1']
  return result
})

const subgroupName = computed<string | null>(() => _get_subfacet_bucket_name(props.param_name) );
const facet_name = computed(() =>  _bucket_to_param_name(props.param_name))

const get_subgroup = computed(() => {
  const tidied_val = props.facet.val.replaceAll(/^"(.+?)"$/g, '')
  const val_pattern = new RegExp('^' + tidied_val + '::')
  let result: { val: string; count: number }[] = []
  if (subgroupName.value && subgroupName.value in props.subfacets) {
    result = (props.subfacets[subgroupName.value] as { val: string; count: number }[]).filter(subfacet => val_pattern.test(subfacet.val))
  }
  return result
})

const name = computed(() => {
  let value = props.facet.val.split('::').slice(-1)[0]
  if (
    props.param_name == 'f1-year-month' &&
    /^(0[1-9]|1[0,1,2])$/.test(value)
  ) {
    const date = new Date(2009, parseInt(value) - 1, 10) // 2009-11-10
    value = date.toLocaleString('default', { month: 'long' })
  }
  return value
})

</script>

<template>
  <li class="list-group-item facet-item">
    <router-link
      :to="{ name: 'search', query: cancel_link(facet_name, facet.val, params) }" class="d-flex justify-content-between align-items-center"
      v-if="is_selected && subgroupName"
    >
      <span class="col1 text-danger"><i class="fa fa-minus-square" aria-hidden="true"></i></span>
      <span class="col collapse2">{{ name }}</span>
      <span class="col text-right"></span>
    </router-link>

    <router-link
      :to="{ name: 'search', query: cancel_link(facet_name, facet.val, params) }" class="d-flex justify-content-between align-items-center"
      v-if="is_selected && !subgroupName"
    >
      <span class="col"><i>{{ name }}</i></span>
      <span class="badge text-danger"><i class="fas fa-window-close" aria-hidden="true"></i></span>
    </router-link>
    <router-link :to="{ name: 'search', query: new_facet_params }" class="d-flex justify-content-between align-items-center" v-else>
      <span class="col">{{ name }}</span>
      <span class="badge badge-info badge-pill">({{ props.facet.count }})</span>
    </router-link>
  </li>

    <li class="list-group-item child-group" v-if="is_selected && subgroupName">
      <ul class="facetSubGroup list-group">
        <facetItem
          v-for="sub in get_subgroup"
          :facet="sub"
          :param_name="subgroupName"
          :params="params"
          :current_selections="current_subfacet_selections"
          :subfacets="subfacets"
          :is_subgroup="true"
          :key="JSON.stringify(sub)"
        />
        </ul>
    </li>

</template>

<style scoped>
.dcpNew .facet table tr:nth-child(2n) {
  background-color: rgba(255, 255, 255, 0.8);
}

.dcpNew .facet table td {
  background-color: transparent;
}

.dcpNew .facet table td.col2 {
  padding-left: 5px;
}

.dcpNew .facet table td.col3 {
  text-align: right;
  padding-right: 5px;
}

.dcpNew .facet table td a {
  color: #506436;
}

.dcpNew .facet .material-icons {
  font-size: 1rem;
  vertical-align: bottom;
}

.dcpNew .facet tbody {
  border-top: none !important;
}

.dcpNew .facet table {
  border: none !important;
  border-collapse: collapse;
}
.dcpNew .facet .facetGroup .facetSubGroup table {
  width: 100%;
  border-top: none;
}
.dcpNew .facet .facetGroup .facetSubGroup {
  padding-left: 1em;
}
</style>
