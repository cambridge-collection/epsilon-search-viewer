<script setup lang="ts">
import AdvancedSearch from '@/components/AdvancedSearch.vue'

defineProps({
  params: { type: Array as () => { key: string; value: string }[], required: true },
})
</script>

<template>
  <table>
    <tbody>
    <tr>
      <td>
        <p>Sorry, no results...</p>
        <p>Try modifying your search:</p>
        <div class="forms">
          <div class="row">
            <div class="col-md-4">
              <AdvancedSearch :params="params" title="" />
            </div>
          </div>
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
        </div>
      </td>
    </tr>
    </tbody>
  </table>
</template>
