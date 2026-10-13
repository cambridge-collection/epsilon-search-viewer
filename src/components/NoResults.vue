<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

const props = defineProps({
  keyword: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()

const term = ref(props.keyword)

watch(
  () => props.keyword,
  value => {
    term.value = value
  },
)

function onSubmit(): void {
  const q: LocationQueryRaw = { page: 1 }
  const text = term.value.trim()
  if (text) q.keyword = text
  if (route.query.tc) q.tc = route.query.tc
  router.push({ name: 'search', query: q })
}

function onClear(): void {
  router.push({ name: 'search', query: {} })
}
</script>

<template>
  <table>
    <tbody>
    <tr>
      <td>
        <p>Sorry, no results...</p>
        <p>Try modifying your search:</p>
        <div class="forms">
          <form @submit.prevent="onSubmit">
            <table>
              <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    name="keyword"
                    size="40"
                    v-model="term"
                  />
                  &nbsp;<input
                  type="submit"
                  value="Search"
                />
                  <input
                    type="button"
                    value="Clear"
                    @click="onClear"
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <table class="sampleTable">
                    <tbody>
                    <tr>
                      <td colspan="2">
                        <b>NB:</b> Searches are
                        not case sensitive and
                        will find both singular
                        and plural of any term
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        Examples:
                      </td>
                    </tr>
                    <tr>
                      <td class="sampleQuery">
                        flowering
                      </td>
                      <td class="sampleDescrip">
                        find the word ‘flowering’
                      </td>
                    </tr>
                    <tr>
                      <td class="sampleQuery">
                        flowering plant
                      </td>
                      <td class="sampleDescrip">
                        find documents containing
                        both ‘flowering’ and
                        ‘plant(s)’
                      </td>
                    </tr>
                    <tr>
                      <td class="sampleQuery">
                        "flowering plant"
                      </td>
                      <td class="sampleDescrip">
                        find the phrase ‘flowering
                        plant(s)’
                      </td>
                    </tr>
                    <tr>
                      <td class="sampleQuery">
                        pl*t
                      </td>
                      <td class="sampleDescrip">
                        find any word beginning
                        ‘pl’ followed by zero or
                        more characters, and
                        ending ‘t’
                      </td>
                    </tr>
                    <tr>
                      <td class="sampleQuery">
                        *plant
                      </td>
                      <td class="sampleDescrip">
                        find any word ending with
                        ‘plant(s)’
                      </td>
                    </tr>
                    <tr>
                      <td class="sampleQuery">
                        plant*
                      </td>
                      <td class="sampleDescrip">
                        find any word beginning
                        ‘plant’
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              </tbody>
            </table>
          </form>
        </div>
      </td>
    </tr>
    </tbody>
  </table>
</template>

