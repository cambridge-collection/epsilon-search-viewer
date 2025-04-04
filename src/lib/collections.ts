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
 * Get inner XML as a string from an Element
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
 * Parses the XML string to build a dictionary for the collection data
 */
function buildCollectionDictionary(xmlString: string): CollectionDictionary {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const ns = "http://www.w3.org/1999/xhtml";

  const collectionDataElem = xmlDoc.getElementsByTagNameNS(ns, "collection-data")[0];
  if (!collectionDataElem) {
    throw new Error("No <collection-data> element found in the XML.");
  }

  const collectionElems = collectionDataElem.getElementsByTagNameNS(ns, "collection");
  const dictionary: CollectionDictionary = {};

  for (let i = 0; i < collectionElems.length; i++) {
    const collectionElem = collectionElems[i];

    // Get child elements
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
    const img = imgElem ? imgElem.outerHTML.trim() : undefined;

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

// Build  dictionary from the imported XML content when the module loads
const collectionDictionary = buildCollectionDictionary(xmlContent);

/**
 * Get details of given contributor.
 * @param contributor - The unique contributor name.
 * @returns A JSON object with properties "blurb" and "thumbnail" (if they contain a value).
 */
export function getContributorDetails(contributor: string): { blurb?: string; thumbnail?: string } {
  const collectionData = collectionDictionary[contributor];
  if (!collectionData) return {};

  const result: { blurb?: string; thumbnail?: string } = {};
  if (collectionData.blurb && collectionData.blurb.trim() !== "") {
    result.blurb = collectionData.blurb;
  }
  if (collectionData.img && collectionData.img.trim() !== "") {
    result.thumbnail = collectionData.img;
  }
  return result;
}
