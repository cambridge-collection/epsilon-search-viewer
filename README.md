# Epsilon Search Result Viewer

Epsilon Search Result Viewer is a Vue3 Single-Page Application (SPA) that displays results from the Epsilon Search API.

The repository contains a separate release branch for each of Epsilon’s release environments:

- `epsilon-editorial`: (editorial release)
- `epsilon-staging`: (staging release)
- `epsilon-production`: (production release) 

## Installation

1. **Clone the Repository:**

       git clone git@github.com:cambridge-collection/epsilon-search-viewer.git
       cd epsilon-search-viewer
       git switch epsilon-editorial # Or whatever branch you want

2. **Install Dependencies:**

       npm install

## Configuration

The runtime configuration is handled via the `src/implementationConfig.ts` file. This file contains key settings that are used throughout the application, including:

- **Debug Flag:**  
  A boolean (`debug`) that controls whether detailed logging is output to the console to aid development and troubleshooting.

- **API URL:**  
  The `api_url` variable specifies the endpoint for the search API. When developing against a local instance of the Epsilon Solr/Epsilon Search API, it should be set to `http://localhost`. **This is currently the only way to test protected environments.**
  
  **When building for deployment be sure to change this `api_url` to the actual endpoint for the environment.**
  
- **Facets Definition:**  
  The `facet_key` object defines the facets available for filtering search results in that environment. These will be different for the Editorial and Staging/Production instances.
  
  Each facet or subfacet definition includes:

  - The `name` of the URL parameter **[REQ]**,
  - `count` (not currently used) **‌[REC]**

If the facet is contains a nested facet, the following are required **‌[REQ]**:
  - `subfacet` contains the subfacet object of the facet
  - `alias` contains the alias used by the subfacet. This will be usually be set to match the name of the root facet.


Example snippet from `src/implementationConfig.ts`:

       /* Debug flag to control console logging */
       const debug: boolean = true
       
       /* API URL for the search backend */
       const api_url: string = 'https://epsilon-editorial-search.cudl-sandbox.net'
       
       /* Facet definitions for the handling and display of URL facet parameters to UI facets */
       type Facet = {
         name: string;
         alias?: string;
         count: number;
         subfacet?: Record<string, Facet>;
       };
       
       const facet_key: Record<string, Facet> = {
         // Facet definitions go here...
         'f1-document-type': { name: 'Document type', count: 5 },
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
         'f1-repository': { name: 'Repository', count: 5 },
              }
              
       export default {
         debug,
         api_url,
         facet_key
       }

## Development

To run the application in development mode with hot-reloading:

       npm run dev

Once running, open your browser and navigate to `http://localhost:5173` (or the configured port) to view the application.

## Build

**Be sure that you change the `api_url` in `implementationConfig.ts` to the proper server before building.**

To build the application for production, run:

       npm run build

The production-ready files will be generated in the `dist/` directory.

## Project Structure

       epsilon-search-viewer-epsilon-editorial/
       ├── public/                         # Contains assets used by SPA
       └── src/                            # Contains SPA source
           ├── App.vue                     # Root Vue component
           ├── main.ts                     # Application entry point
           ├── implementationConfig.ts     # Search and configuration settings
           ├── router/
           │   └── index.ts               # Routing configuration
           ├── views/
           │   └── SearchResults.vue      # Main view for displaying search results
           ├── components/
           │   ├── ContributorDetails.vue # Output contributor details
           │   ├── FacetBlock.vue         # Output facet block
           │   ├── FacetItem.vue          # Individual facet item
           │   ├── FacetItem.d.ts         # TypeScript declarations for facet items
           │   ├── ResultList.vue         # List container for search 
           │   │                            # results
           │   ├── ResultItem.vue         # Component for a single search result
           │   ├── NoResults.vue          # Component displayed when no results are found
           │   └── campl-page-header.vue  # Page header component
           └── lib/
               └── collections.ts          # Get Contributor data
               └── utils.ts                # Utility functions used
                                             # throughout the application

