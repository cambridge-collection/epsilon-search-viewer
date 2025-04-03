<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import { getBlurbByContributor } from '@/lib/collections';

const props = defineProps({
  contributor: {
    type: String,
    required: true,
  },
});

// Reactive flag to control whether additional paragraphs are shown
const expanded = ref(false);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

// Retrieve the full blurb using the contributor name
const fullBlurb = computed(() => getBlurbByContributor(props.contributor) || '');

// Extract the first paragraph from the full blurb
const firstParagraph = computed(() => {
  if (!fullBlurb.value) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullBlurb.value, 'text/html');
  const pElements = doc.getElementsByTagName('p');
  if (pElements.length > 0) {
    return pElements[0].outerHTML;
  }
  // Fallback: if no <p> tags exist, return the full blurb
  return fullBlurb.value;
});

// Extract all paragraphs except the first one as the remaining content
const remainingParagraphs = computed(() => {
  if (!fullBlurb.value) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullBlurb.value, 'text/html');
  const pElements = Array.from(doc.getElementsByTagName('p'));
  if (pElements.length > 1) {
    // Join all paragraphs except the first into a single HTML string
    return pElements.slice(1).map(p => p.outerHTML).join('');
  }
  return '';
});
</script>

<template>
  <div class="row my-2">
    <div class="col border mx-3 fold py-3 project-logo">
    <p class="h5">{{contributor}}</p>

    <div v-if="firstParagraph" v-html="firstParagraph"></div>
    <transition name="slide-fade"><div v-if="expanded && remainingParagraphs" v-html="remainingParagraphs"/></transition>

    <button class="matches-toggle badge badge-light badge-pill border mx-auto mt-2 mb-2" v-if="remainingParagraphs" @click="toggleExpanded">
      <template v-if="!expanded">
        <i class="fas fa-angle-double-down"></i> MORE <i class="fas fa-angle-double-down"></i>
      </template>
      <template v-else>
        <i class="fas fa-angle-double-up"></i> LESS <i class="fas fa-angle-double-up"></i>
      </template>
    </button>
  </div>
  </div>
</template>

<style scoped>
/* Transition styles for the slide-fade effect */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

</style>
