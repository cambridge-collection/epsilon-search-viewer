/* Define implementation settings */


/* Boolean toggle controlling whether _tracer_bullet should output to console log */
const debug: boolean = false

const api_url: string = 'https://search.epsilon.ac.uk'

type Facet = {
  name: string;
  alias?: string;
  count: number;
  subfacet?: Record<string, Facet>;
};

/* Translation table for facets
   keys contains the parameter bucket names. These will also be the url param name for facets without subfacets or parent facets
   alias contains the param name to use on a facet with subfacets. All subfacets of that item will use alias as their param name
   subfacet contains subfacet information (bucket name, etc)
   count is not used at present, but will eventually to control how many facets are displayed in unexpanded lists
*/
const facet_key: Record<string, Facet> = {
  'f1-document-type': { name: 'Record type', count: 5 },
  'f1-author': { name: 'Author', count: 5 },
  'f1-addressee': { name: 'Addressee', count: 5 },
  'f1-correspondent': { name: 'Correspondent', count: 5 },
  'f1-decade': {
    name: 'Date', alias: 'f1-date', count: 999,
    subfacet: {
      'f1-decade-year': {
        name: 'Date', count: 999,
        subfacet: {
          'f1-decade-year-month': {
            name: 'Date', count: 999,
            subfacet: {
              'f1-decade-year-month-day': { name: 'Date', count: 999 }
            }
          }
        }
      }
    }
  },
  'f1-repository': { name: 'Holders', count: 5 },
  'f1-contributor': { name: 'Contributor', count: 99 },
  'f1-transcription-available': { name: 'Transcription available', count: 5 },
  'f1-cdl-images-linked': { name: 'CDL images linked', count: 5 },
}

/*  An ordered array of the facet buckets to be displayed in the sidebar */
const desired_facets: string[] = ['f1-author',
  'f1-addressee',
  'f1-correspondent',
  'f1-decade',
  'f1-document-type',
  'f1-repository',
  'f1-contributor',
  'f1-transcription-available']

/* Facets that are expandable */
const expandable: string[] = [
  'author',
  'addressee',
  'correspondent',
  'repository',
]

/* Search params used in the advanced search page */
const advanced_params = [
  'text',
  'sectionType',
  'search-addressee',
  'search-author',
  'search-correspondent',
  'year',
  'month',
  'day',
  'year-max',
  'month-max',
  'day-max',
  'search-date-type',
  'exclude-widedate',
  'search-repository',
  'exclude-cancelled',
  'collection',
  'collection-join'
]

const section_type_options = [
  { value: '', label: 'All' },
  { value: 'transcribed', label: 'Transcriptions' },
  { value: 'footnote', label: 'Footnotes' },
  { value: 'summary', label: 'Summaries' },
]

const correspondent_role_options = [
  { value: 'search-correspondent', label: 'To & from' },
  { value: 'search-addressee', label: 'To' },
  { value: 'search-author', label: 'From' },
]

const date_type_options = [
  { value: 'on', label: 'On' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
]

/* Must match the solr `collection` values exactly */
const collection_options: string[] = [
  'André-Marie Ampère',
  'Thomas Beddoes',
  'Charles Darwin',
  'Darwin Family Letters',
  'Michael Faraday',
  'John Henslow',
  'John Herschel',
  'Joseph Dalton Hooker',
  'Ellen Hutchins',
  'William Kemp',
  'The Linnean Society of London',
  'Ferdinand von Mueller',
  'Royal Society',
  'Mary Somerville',
  'William Henry Fox Talbot',
  'John Tyndall',
  'Alfred Russel Wallace',
]

/* Conditional function that will be run if it exists when first processing all url parameters
*
*  'page' should always be removed and this is the default if this function is not defined in the implementation file
*  The other params in this list are removed because they legacy params that are no longer supported (or needed) in the new
*  site.
*
*/
const params_to_remove: string[] = ['start', 'page', 'tab', 'smode', 'text-exclude', 'tc']

/* Conditional function that will be run if it exists when creating the array containing all params that reflect the
*  choices the user has made to filter the data. It is used to display these choices to the user at the top of the
*  search results (ie. in pills/options that can be cancelled).
*
*  'sort' will be removed if this function is not defined in the implementation file
*  'expand' is removed because it only controls how many values a facet lists
*  'collection-join' is removed because cancelling it on its own would AND the selected collections together
*/
const non_filtering_keys: string[] = ['sort', 'expand', 'collection-join']

/* Define the sort fields
*  Used to create the sort dropdown
*  The current implementation of this site assumes that the fieldname is the
*  as the user-friendly textual representation presented to the user.
*  `Score` is currently hard-coded to display as 'relevance'
*/
const sort_fields: string[] = ['score', 'author', 'addressee', 'date']

/* Conditional function that will be run if it exists when first processing url parameters.
*  It is used to tidy up URL parameters. It will likely only ever be used on former XTF sites
*  XTF used to number facets by the order in which they were sleected by the user. You could consequently have
*  f1-document-type=Letters&f2-date=1868 AND f1-date=1868&f2-document-type
*  Both produce the same ouput but make it more difficult for crawlers to the site.
*  This function standardises all facets to f1-{face-name}.
*/
const _tidy_facet_paramname = (str: string) => {
  return str.replace(/^f\d+-/, 'f1-')
}

// Store the decoded form ('People/Organisations'); all_params_uri encodes values at request time.
const legacy_facet_values: Record<string, Record<string, string>> = {
  'f1-document-type': {
    letter: 'Letters',
    people: 'People/Organisations',
    repository: 'Holders',
  },
}

const _remap_facet_value = (key: string, value: string): string =>
  legacy_facet_values[key]?.[value] ?? value

const date_value_keys: string[] = ['year', 'month', 'day', 'year-max', 'month-max', 'day-max']

/* Conditional function that will be run if it exists when first processing url parameters, and by cancel_link on the
*  params left once a param has been cancelled.
*  It is used to perform more complex removals of parameters.
*/
const _remove_unused_params = (params: Array<{ key: string; value: string }>): Array<{
  key: string;
  value: string
}> => {
  let newParams = [...params]

  if (!date_value_keys.some(key => newParams.some(item => item.key === key))) {
    newParams = newParams.filter(item => item.key !== 'search-date-type')
  }

  if (!newParams.some(item => item.key === 'collection' && item.value)) {
    newParams = newParams.filter(item => item.key !== 'collection-join');
  }

  if (!newParams.some(item => item.key === 'text' && item.value)) {
    newParams = newParams.filter(item => item.key !== 'sectionType');
  }

  return newParams
}

const date_param_order: string[] = [
  'search-date-type',
  'year',
  'month',
  'day',
  'year-max',
  'month-max',
  'day-max',
  'exclude-widedate',
]

/* exclude-widedate goes with the date as the API applies it even without one. _cancel_dependent_params overrides
*  this for between searches.
*/
const cancel_cascade: Record<string, string[]> = {
  'search-date-type': ['year', 'month', 'day', 'year-max', 'month-max', 'day-max', 'exclude-widedate'],
  'year': ['month', 'day', 'year-max', 'month-max', 'day-max', 'search-date-type', 'exclude-widedate'],
  'month': ['day'],
  'year-max': ['month-max', 'day-max'],
  'month-max': ['day-max'],
}

const end_to_start_date: Record<string, string> = { 'year-max': 'year', 'month-max': 'month', 'day-max': 'day' }

/* Conditional function that will be run by cancel_link if it exists.
*  The API treats a between search missing one end as open-ended, so cancelling either end becomes the equivalent
*  before/after search. A before search takes its date from year/month/day, so the end date moves across.
*/
const _cancel_dependent_params = (key: string, params: Array<{ key: string; value: string }>): Array<{
  key: string;
  value: string
}> => {
  const is_range = params.some(item => item.key === 'search-date-type' && item.value === 'between')

  if (key === 'year' && is_range && params.some(item => item.key === 'year-max')) {
    return params
      .filter(item => !['month', 'day'].includes(item.key))
      .map(item => item.key === 'search-date-type'
        ? { ...item, value: 'before' }
        : { ...item, key: end_to_start_date[item.key] ?? item.key })
  }

  const dependents = cancel_cascade[key] ?? []
  const remaining = params
    .filter(item => !dependents.includes(item.key))
    .map(item => key === 'year-max' && is_range && item.key === 'search-date-type'
      ? { ...item, value: 'after' }
      : item)

  if (date_value_keys.includes(key) && !remaining.some(item => date_value_keys.includes(item.key))) {
    return remaining.filter(item => item.key !== 'exclude-widedate')
  }
  return remaining
}

export type { Facet }

export {
  api_url,
  desired_facets,
  facet_key,
  advanced_params,
  section_type_options,
  correspondent_role_options,
  date_type_options,
  collection_options,
  params_to_remove,
  non_filtering_keys,
  sort_fields,
  expandable,
  debug,
  _tidy_facet_paramname,
  _remap_facet_value,
  _remove_unused_params,
  date_param_order,
  _cancel_dependent_params,
}
