<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  total: number
  itemsPerPage: number
  currentPage: number
  allParamsUri: string
  paginateResults: boolean
}>()

const emit = defineEmits<{ (e: 'navigate', page: number): void }>()

const totalPages = computed<number>(() => Math.max(1, Math.ceil(props.total / props.itemsPerPage)))
const modelPage = ref<number>(props.currentPage)
const pageInput = ref<number>(props.currentPage)

function navigate(page: number): void {
  emit('navigate', page)
}

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  navigate(page)
}

function jumpToPage(): void {
  let page = Math.floor(Number(pageInput.value))
  if (!Number.isFinite(page) || page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  pageInput.value = page
  goToPage(page)
}

function selectAll(event: Event): void {
  (event.target as HTMLInputElement).select()
}
</script>

<template>
  <div :class="'row justify-content-center pagination-row ' + paginateResults">
    <vue-awesome-paginate
      :totalItems="total"
      :itemsPerPage="itemsPerPage"
      :maxPagesShown="5"
      v-model="modelPage"
      @click="navigate"
      type="link"
      :linkUrl="'/search?page=[page]&' + allParamsUri"
      paginationContainerClass="pagination justify-content-center"
      paginateButtonsClass="page-link"
    />
    <div class="pagination-compact" v-if="totalPages > 1">
      <button type="button" class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" aria-label="Previous page">&lt;</button>
      <span class="pagination-compact-label">Page
        <input type="number" min="1" :max="totalPages" v-model.number="pageInput" @focus="selectAll" @click="selectAll" @keyup.enter="jumpToPage" @change="jumpToPage" aria-label="Jump to page" />
        of {{ totalPages }}</span>
      <button type="button" class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" aria-label="Next page">&gt;</button>
    </div>
  </div>
</template>
