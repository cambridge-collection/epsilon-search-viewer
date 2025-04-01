function createPageViewer(tileSources, sequenceMode) {
  return OpenSeadragon({
    id: "facsimile_image",
    prefixUrl: "/script/openseadragon/images/",
    tileSources: tileSources,
    sequenceMode: sequenceMode
  });
}
