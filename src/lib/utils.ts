import * as implementation from '@/implementationConfig'
import { computed } from 'vue'

type Facet = {
  name: string;
  count: number;
  alias?: string;
  subfacet?: Record<string, Facet>; // Optional nested subfacet structure
};

/*const _bucket_to_param_name2 = (
  facetKey: string,
  facets: Record<string, Facet> = implementation.facet_key
): string => {
 // console.log('Checking '+facetKey)
  //console.log(facets)
  let result: string = '';

  // Check at the current (root) level.
  if (facetKey in facets) {
    result = facets[facetKey].alias ? facets[facetKey].alias : facetKey;
  } else {
    for (const key in facets) {
      const facet = facets[key];
      if (facet.subfacet) {
        const subResult = _bucket_to_param_name2(facetKey, facet.subfacet);
        if (subResult) {
          result = facets[key].alias ?? key;
          break; // Stop looping once a match is found.
        }
      }
    }
  }
  return result;
};*/

const _bucket_to_param_name = (facetKey: string): string => {
  const found = facet_lookup.value.find(item => item.key === facetKey);
  return found ? found.value : '';
}

/* Create lookup table to get param name from bucket_name */
const facet_lookup = computed<Array<{ key: string; value: string }>>((): Array<{ key: string; value: string }> => {
  const computeFacets = (
    facets: Record<string, Facet> = implementation.facet_key,
    topAlias?: string
  ): Array<{ key: string; value: string }> => {
    let arr: Array<{ key: string; value: string }> = [];
    for (const key in facets) {
      const facet = facets[key];
      const effectiveValue = topAlias ?? facet.alias ?? key;
      arr.push({ key, value: effectiveValue });
      if (facet.subfacet) {
        const newTopAlias = topAlias ?? facet.alias;
        arr = arr.concat(computeFacets(facet.subfacet, newTopAlias));
      }
    }
    return arr;
  };

  return computeFacets();
});

/* Rewrite this into another lookup table */
/*const _get_subfacet_bucket_name2 = (facetKey: string, facets: Record<string, Facet> = implementation.facet_key): string | null => {
  console.log(facetKey)
  if (facetKey in facets) {
    return facets[facetKey].subfacet ? Object.keys(facets[facetKey].subfacet!)[0] : null;
  }

  for (const key in facets) {
    const subfacets = facets[key].subfacet;
    if (subfacets) {
      const found = _get_subfacet_bucket_name2(facetKey, subfacets);
      if (found) return found;
    }
  }

  return null;
}*/

function _get_subfacet_bucket_name(facetKey: string, facets: Record<string, Facet> = implementation.facet_key): string | null {
  const found = subfacet_lookup.value.find(item => item.key === facetKey);
  return found ? found.value : null;
}
const subfacet_lookup = computed<Array<{ key: string; value: string }>>((): Array<{ key: string; value: string }> => {
  const lookup: Array<{ key: string; value: string }> = [];

  const processFacets = (facets: Record<string, Facet>) => {
    for (const key in facets) {
      const facet = facets[key];
      if (facet.subfacet) {
        const subKeys = Object.keys(facet.subfacet);
        if (subKeys.length > 0) {
          const immediateSubfacetKey = subKeys[0];
          lookup.push({ key, value: immediateSubfacetKey });
        }
        processFacets(facet.subfacet);
      }
    }
  };

  processFacets(implementation.facet_key);
  return lookup;
});
//console.log(subfacet_lookup.value)
const _find_facet_hierarchy = (facetKey: string, facets: Record<string, Facet> = implementation.facet_key, path: string[] = []): string[] | null => {
  for (const key in facets) {
    const facet = facets[key];

    // If the current key matches, return the path + key
    if (key === facetKey) {
      return [...path, key];
    }

    // If subfacet exists, recursively search deeper
    if (facet.subfacet) {
      const foundPath = _find_facet_hierarchy(facetKey, facet.subfacet, [...path, key]);
      if (foundPath) return foundPath;
    }
  }

  return null; // Key not found
};

const _is_hierarchical = (searchKey: string, facets: Record<string, Facet> = implementation.facet_key): boolean => {
  for (const key in facets) {
    const facet = facets[key];

    // If searchKey matches the key or alias, return whether it has a subfacet
    if (key === searchKey || facet.alias === searchKey) {
      return !!facet.subfacet; // Converts subfacet existence to boolean
    }

    // If subfacet exists, recursively search deeper
    if (facet.subfacet && _is_hierarchical(searchKey, facet.subfacet)) {
      return true;
    }
  }

  return false; // If not found, return false
};


function _params_to_query_structure(param_array: { key: string; value: string }[]) {
  const result: Record<string, string[]> = {};
  param_array.forEach((item) => {
    if (result[item.key]) {
      result[item.key].push(item.value);
    } else {
      result[item.key] = [item.value];
    }
  });
  return result
}

const cancel_link = (keyToRemove: string, valueToRemove: string, all_params: { key: string; value: string }[]): Record<string, string[]> => {
  const child_vals = new RegExp('^"*'+ valueToRemove+'::.*$')
  const filteredArr = all_params.filter(
    (item) => !(item.key === keyToRemove && item.value.replace(/(^"|"$)/g, '') === valueToRemove.replace(/(^"|"$)/g, '') ||
      child_vals.test(item.value.replace(/(^"|"$)/g, ''))
      )
  );
  // Remove date children.


  return _params_to_query_structure(filteredArr);
};

function _is_equal_to(variable: string | string[] | null, targetValue: string): boolean {
  return (typeof variable === "string" && variable === targetValue) ||
    (Array.isArray(variable) && variable.length === 1 && variable[0] === targetValue) ||
    (variable === null && targetValue === "");
}

function _get_first_value(param: unknown): string | null {
  let result: string = ''
  if (Array.isArray(param)) {
    result= String(param[0]);
  } else {
    result = String(param)
  }
  return result
}

function _query_param_sort(key: string) {
  /* Sort facet params by facet title (if facet) or param name (if search term).
     Search terms are prefixed with 000_ to ensure they come first in the search
     terms display
   */
  return (key in implementation.facet_key) ? implementation.facet_key[key].name : "000_"+key
}

function _tracer_bullet(msg: string): void {
  if (implementation.debug) { console.log(msg)}
}

export { _bucket_to_param_name, _get_subfacet_bucket_name, _find_facet_hierarchy, _is_hierarchical, _params_to_query_structure, cancel_link, _is_equal_to, _get_first_value, _query_param_sort, _tracer_bullet};
