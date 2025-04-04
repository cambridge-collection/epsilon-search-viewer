<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import { getContributorDetails } from '@/lib/collections';

const props = defineProps({
  contributor: {
    type: String,
    required: true,
  },
});

const expanded = ref(false);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

const fullBlurb = computed(() => getContributorDetails(props.contributor)?.blurb || '');
const fullThumbnail = computed(() => getContributorDetails(props.contributor)?.thumbnail || '');

const thumbnail = computed(() => {
  let result: string = '';
  if (fullThumbnail.value) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullThumbnail.value, 'text/html');
    const elems = doc.getElementsByTagName('img');
    if (elems.length > 0) {
      result = elems[0].outerHTML;
    }
  }

  return result;
});

const firstParagraph = computed(() => {
  let result:string = ''
  if (fullBlurb.value) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullBlurb.value, 'text/html');
    const pElements = doc.getElementsByTagName('p');
    if (pElements.length > 0) {
      result = pElements[0].outerHTML;
    }
  }
  return result;
});

const remainingParagraphs = computed(() => {
  let result: string = ''
  if (fullBlurb.value) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullBlurb.value, 'text/html');
    const pElements = Array.from(doc.getElementsByTagName('p'));
    if (pElements.length > 1) {
      result = pElements.slice(1).map(p => p.outerHTML).join('');
    }
  }
  return result;
});
</script>

<template>
  <div class="row my-2">
    <div class="col border mx-3 fold py-3 project-logo">
    <p class="h5">{{contributor}}</p>
      <div class="float-right" v-if="thumbnail" v-html="thumbnail"></div>
      <div v-if="firstParagraph" v-html="firstParagraph"></div>
      <transition name="slide-fade">
        <div v-if="expanded && remainingParagraphs" v-html="remainingParagraphs"/>
      </transition>

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
