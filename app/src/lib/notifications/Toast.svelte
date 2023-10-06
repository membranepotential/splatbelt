<script lang="ts">
  import { fade } from 'svelte/transition'
  import { notifications } from './notifications'
</script>

<div
  aria-live="assertive"
  class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
>
  <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
    {#if $notifications}
      <div class="notifications">
        {#each $notifications as notification}
          <div
            role="alert"
            transition:fade
            class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 mb-2"
          >
            <div class="p-4">
              <div class="flex items-center">
                <div class="flex flex-1 justify-between">
                  <p class="flex-1 text-sm font-medium text-gray-900">
                    {notification}
                  </p>
                  <!-- <button type="button" class="ml-3 flex-shrink-0 rounded-md bg-white text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Undo</button> -->
                </div>
                <!-- <div class="ml-4 flex flex-shrink-0">
            <button type="button" @click="show = false" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div> -->
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
