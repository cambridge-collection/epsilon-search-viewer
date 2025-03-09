<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const props = defineProps({
  facet: { type: Object, required: true },
  param_name: { type: String, required: true },
  query_params: { type: Object, required: true },
  subfacets: { type: Object, required: true },
  q_params_tidied: { type: Object, required: true },
  is_subgroup: { type: Boolean, required: true },
})

const params = computed(() => {
  return props.query_params
})

const mapped_param_name = computed<string>(() => {
  let result = props.param_name
  if (/f\d+-(year|year-month|year-month-day)$/.test(props.param_name)) {
    result = 'f1-date'
  }
  return result
})

function is_selected<boolean>(value: string) {
  const name_root = mapped_param_name.value.replace(/^f\d+-/, '')
  const facetRegex = new RegExp('^f\\d+-'+ name_root, 'g')
  const keys: Array<string> = Object.keys(params['value']).filter((i) => (i == mapped_param_name.value || facetRegex.test(i)) )
  return  keys.some((key: string) => {
    return (params['value'][key]['details'].some(
      (e: any) => {
        const para_val: string = String(e.value).replaceAll(/^"(.+?)"$/g, '$1')
        const re = new RegExp("^"+ value +'::')

        return para_val == value || re.test(para_val)
      }
    ))
  })
}

const uri = computed(() => {
  const n: Record<string, unknown> = {}

  // Copy unaffected params
  for (const key of Object.keys(params['value'])) {
    if (mapped_param_name.value != key) {
      const val_list: any = []
      params['value'][key]['details'].forEach(function (obj: any) {
        val_list.push(obj['value'])
      })
      val_list.sort()
      n[key] = val_list
    }
  }
  // deal with affected param
  const new_param = '"' + props.facet.val + '"'
  if (mapped_param_name.value in params['value']) {
    const ar = []
    params['value'][mapped_param_name.value]['details'].forEach(function (
      obj: any,
    ) {
      ar.push(obj['value'])
    })
    ar.push(new_param)
    n[mapped_param_name.value] = ar
  } else {
    n[mapped_param_name.value] = new_param
  }
  return n
})

const url_reset_page = computed(() => {
  return { ...uri.value, ...{ page: 1 } }
})

const subgroupName = computed(() => {
  let result = null
  switch (props.param_name) {
    case 'f1-year':
      result = 'f1-year-month'
      break
    case 'f1-year-month':
      result = 'f1-year-month-day'
      break
    default:
  }
  return result
})

const get_subgroup = computed(() => {
  const tidied_val = props.facet.val.replaceAll(/^"(.+?)"$/g, '')
  const val_pattern = new RegExp('^' + tidied_val + '::')
  let result = []
  if (subgroupName.value && subgroupName.value in props.subfacets) {
    result = props.subfacets[subgroupName.value].filter((subfacet: any) =>
      val_pattern.test(subfacet.val),
    )
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

const cancel_link = computed(() => {
  const p = props.param_name
  const v = props.facet.val
  // Need to clear child params if parent is deselected -- ie.
  // facet down to a specific day - then remove the month
  // both day and month should not appear in the cancel link

  // Remove object for key 'p' from param list
  const qpt: Record<string, unknown> = props.q_params_tidied
  const ps_tidied = Object.fromEntries(
    Object.entries(qpt).filter(([k, v]) => k !== p)
  )
  const current_param: any = {}
  const qs: Record<string, Array<string>> = {}
  if (Object.keys(qpt).length == 0) {
    qs['keyword']= [] // Should be browse-all=yes
  } else {
    for (const key in qpt) {
      qs[key] = []
      let vals: any[] = []
      if (Array.isArray(qpt[key])) {
        vals = vals.concat(qpt[key])
      } else {
        vals.push(qpt[key])
      }
      vals.forEach(function (val, index) {
        if (!(key == p && val.replace(/(^"|"$)/g,'') == v)) {
          qs[key].push(val)
        }
      })
    }
    // Add any relevant values for the current param that would NOT
    // be cancelled by current cancellation

      const key: string = mapped_param_name.value //Object.keys(current_param)
      let vals: string[] = []
      if (Array.isArray(qs[key])) {
        vals = vals.concat(qs[key])
      } else if (typeof qs[key] == 'string') {
        vals.push(qs[key])
      }
      const new_vals = []
      for (const val of vals) {
        if (!remove_vals(key, props.facet.val, key, val)) {
          new_vals.push(val)
        }
      }
      qs[key] = new_vals
  }
  return {...qs, 'page': 1}
})

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
</script>

<template>
  <tr>
    <td class="col2">
      <span v-if="is_selected(props.facet.val)">{{ name }}</span>
      <router-link :to="{ name: 'search', query: url_reset_page }" v-else>
        {{ name }}
      </router-link>
    </td>
    <td class="col3">
      <router-link
        :to="{ name: 'search', query: cancel_link }"
        v-if="is_selected(props.facet.val)"
      >
        <span class="material-icons">disabled_by_default</span>
      </router-link>
      <span v-else>({{ props.facet.count }})</span>
    </td>
  </tr>
  <tr v-if="is_selected(props.facet.val) && subgroupName">
    <td colspan="2">
      <div
        class="facetSubGroup"
        v-if="is_selected(props.facet.val) && subgroupName"
      >
        <table>
          <tbody>
            <facetItem
              v-for="sub in get_subgroup"
              :facet="sub"
              :param_name="subgroupName"
              :query_params="query_params"
              :subfacets="subfacets"
              v-bind:is_subgroup="true"
              v-bind:q_params_tidied="props.q_params_tidied"
              :key="JSON.stringify(route.fullPath) + JSON.stringify(sub)"
            />
          </tbody>
        </table>
      </div>
    </td>
  </tr>
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
