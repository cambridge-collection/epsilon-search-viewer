// Import the XML file as raw text (using Vite)
import xmlContent from './epsilon-brand.xml?raw';

interface CollectionData {
  id: string;
  name: string;
  contributor: string;
  date?: {
    notBefore?: string;
    notAfter?: string;
  };
  url?: string;
  img?: string;
  blurb?: string;
}

type CollectionDictionary = { [contributor: string]: CollectionData };

/**
 * Helper function to extract inner XML as a string from an Element.
 */
function getInnerXML(element: Element): string {
  const serializer = new XMLSerializer();
  let innerXML = "";
  Array.from(element.childNodes).forEach(child => {
    innerXML += serializer.serializeToString(child);
  });
  return innerXML;
}

/**
 * Parses the XML string and builds a dictionary keyed by the unique <contributor>.
 */
function buildCollectionDictionary(xmlString: string): CollectionDictionary {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  // Our XML defines a default namespace
  const ns = "http://www.w3.org/1999/xhtml";

  const collectionDataElem = xmlDoc.getElementsByTagNameNS(ns, "collection-data")[0];
  if (!collectionDataElem) {
    throw new Error("No <collection-data> element found in the XML.");
  }

  const collectionElems = collectionDataElem.getElementsByTagNameNS(ns, "collection");
  const dictionary: CollectionDictionary = {};

  for (let i = 0; i < collectionElems.length; i++) {
    const collectionElem = collectionElems[i];

    // Extract attributes and child elements
    const id = collectionElem.getAttribute("xml:id") || "";
    const nameElem = collectionElem.getElementsByTagNameNS(ns, "name")[0];
    const name = nameElem ? nameElem.textContent?.trim() || "" : "";
    const contributorElem = collectionElem.getElementsByTagNameNS(ns, "contributor")[0];
    const contributor = contributorElem ? contributorElem.textContent?.trim() || "" : "";

    const dateElem = collectionElem.getElementsByTagNameNS(ns, "date")[0];
    const date = dateElem ? {
      notBefore: dateElem.getAttribute("notBefore") || undefined,
      notAfter: dateElem.getAttribute("notAfter") || undefined,
    } : undefined;

    const urlElem = collectionElem.getElementsByTagNameNS(ns, "url")[0];
    const url = urlElem ? urlElem.textContent?.trim() || undefined : undefined;

    const imgElem = collectionElem.getElementsByTagNameNS(ns, "img")[0];
    const img = imgElem ? imgElem.getAttribute("src") || undefined : undefined;

    const blurbElem = collectionElem.getElementsByTagNameNS(ns, "blurb")[0];
    // Use XMLSerializer to preserve any embedded HTML in <blurb>
    const blurb = blurbElem ? getInnerXML(blurbElem).trim() : undefined;

    const collectionData: CollectionData = {
      id,
      name,
      contributor,
      date,
      url,
      img,
      blurb,
    };

    if (contributor) {
      dictionary[contributor] = collectionData;
    }
  }

  return dictionary;
}

// Build the dictionary from the imported XML content when the module loads
const collectionDictionary = buildCollectionDictionary(xmlContent);

/**
 * Retrieves the blurb HTML for the collection with the given contributor.
 * @param contributor - The unique contributor name.
 * @returns The blurb HTML string, or undefined if not found.
 */
export function getBlurbByContributor(contributor: string): string | undefined {
  return collectionDictionary[contributor]?.blurb;
}
