/* Define implementation settings */

// Dev: https://mscat-dev-search.cudl-sandbox.net
// Prod:  https://search.darwinproject.ac.uk
const api_url: string = "http://localhost"

// Specify facets to be shown in the sidebar, displayed in array order.
const desired_facets: string[] = ['f1-document-type',
  'f1-author',
  'f1-addressee',
  'f1-correspondent',
  'f1-year',
  'f1-repository',
  'f1-volume',
  'f1-entry-cancelled',
  'f1-document-online',
  'f1-letter-published',
  'f1-translation-published',
  'f1-footnotes-published',
  'f1-has-tnotes',
  'f1-has-cdnotes',
  'f1-has-annotations',
  'f1-linked-to-cudl-images',
  'f1-darwin-letter',
  's-commentary',
  's-key-stage',
  's-ages',
  's-topics',]

// A translation table to generate the nice title/fieldnames. I don't believe count is being used.
const facet_key: Record<string, { name: string; count: number }> = {
  'f1-document-type': { name: 'Document type', count: 5 },
  'f1-author': { name: 'Author', count: 5 },
  'f1-addressee': { name: 'Addressee', count: 5 },
  'f1-correspondent': { name: 'Correspondent', count: 5 },
  'f1-year': { name: 'Date', count: 999 },
  'f1-repository': { name: 'Repository', count: 5 },
  'f1-volume': { name: 'Volume', count: 5 },
  'f1-entry-cancelled': { name: 'Entry cancelled', count: 5 },
  'f1-document-online': { name: 'Document online', count: 5 },
  'f1-letter-published': { name: 'Letter published', count: 5 },
  'f1-translation-published': { name: 'Translation published', count: 5 },
  'f1-footnotes-published': { name: 'Footnotes published', count: 5 },
  'f1-has-tnotes': { name: 'Has tnotes', count: 5 },
  'f1-has-cdnotes': { name: 'Has cdnotes', count: 5 },
  'f1-has-annotations': { name: 'Has annotations', count: 5 },
  'f1-linked-to-cudl-images': { name: 'Linked to CDL images', count: 5},
  'f1-darwin-letter': { name: 'Darwin letter', count: 5},
  's-commentary': { name: 'Commentary', count: 5 },
  's-key-stage': { name: 'Key Stage', count: 5 },
  's-ages': { name: 'Learning Band', count: 5 },
  's-topics': { name: 'Topics', count: 5 },
}

// Define which variables are from the advanced search.
// These can be used to output a 'Modify search' button.
// This is not implemented in ms cat and likely will be removed from this iteration after the base code is committed.
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
]

const debug:boolean = true;

export {api_url, desired_facets, facet_key, advanced_params, debug}
