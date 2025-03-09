import * as implementation from '@/implementationConfig'

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
  // Filter the array to remove the object with the matching key and value
  const filteredArr = all_params.filter(
    (item) =>
      !(item.key === keyToRemove && item.value.replace(/(^"|"$)/g, '') === valueToRemove.replace(/(^"|"$)/g, ''))
  );

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

export { _params_to_query_structure, cancel_link, _is_equal_to, _get_first_value, _query_param_sort, _tracer_bullet};
