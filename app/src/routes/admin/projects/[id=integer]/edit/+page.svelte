<script lang="ts">
  import type { PageData } from './$types'
  import type { ModelConfig } from '$lib/schemas'

  import Chooser from './Chooser.svelte'

  export let data: PageData
  export let config: ModelConfig

  $: project = data.project
  $: disabled = project.state != 'configuring'
  $: config = project.config
</script>

<!-- <div class="block rounded-lg bg-gray-100 px-6 py-4">
  <section>
    <div class="w-1/3">
      <label for="select-pairing"> Pairing </label>
    </div>
    <div class="w-2/3">
      <select
        id="select-pairing"
        name="pairingType"
        bind:value={config.pairing.type}
        class="w-full"
        {disabled}
      >
        <option value="exhaustive">Exhaustive</option>
        <option value="complex">Complex</option>
      </select>
    </div>
  </section>

  {#if config.pairing.type === 'complex'}
    <section>
      <div class="w-1/3">
        <label for="input-pairing-seq"> Sequential Pairs </label>
      </div>
      <div class="w-2/3">
        <input
          id="input-pairing-seq"
          name="pairingSeq"
          type="text"
          class="input-bg-white w-full"
          bind:value={config.pairing.sequential}
          {disabled}
        />
      </div>
    </section>

    <section>
      <div class="w-1/3">
        <label for="input-pairing-seq"> Retrieval Pairs </label>
      </div>
      <div class="w-2/3">
        <input
          id="input-pairing-seq"
          name="pairingSeq"
          type="text"
          class="input-bg-white w-full"
          bind:value={config.pairing.retrieval}
          {disabled}
        />
      </div>
    </section>
  {/if}

  <section>
    <div class="w-1/3">
      <label for="input-features"> Features </label>
    </div>
    <div class="w-2/3">
      <input
        type="text"
        id="input-features"
        name="features"
        class="input-bg-white"
        bind:value={config.features}
        {disabled}
      />
    </div>
  </section>

  <section>
    <div class="w-1/3">
      <label for="input-matcher"> Matcher </label>
    </div>
    <div class="w-2/3">
      <input
        type="text"
        id="input-matcher"
        name="matcher"
        class="input-bg-white"
        bind:value={config.matcher}
        {disabled}
      />
    </div>
  </section>

  <section>
    <div class="w-1/3">
      <label for="input-num-iter"> #iterations </label>
    </div>
    <div class="w-2/3">
      <input
        type="text"
        id="input-num-iter"
        name="numIter"
        class="input-bg-white"
        bind:value={config.numIter}
        {disabled}
      />
    </div>
  </section>

  <section>
    <div class="w-1/3">
      <label for="log-viewer">Logs</label>
    </div>
    <div class="h-48 w-2/3">
      <ul id="log-viewer" class="h-full overflow-y-scroll">
        {#each project.logs as log, i (i)}
          <li
            class="break-words rounded-sm px-2 py-2 text-sm"
            class:bg-indigo-100={i % 2}
          >
            {log.entry}
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <form METHOD="POST" action={`/admin/projects/${project.id}?/analyse`}>
    <section class="gap-x-8">
      <button class="btn-action inline-block flex-grow font-bold" {disabled}>
        Start Analysis
      </button>
    </section>
  </form>
</div> -->

<style lang="postcss">
  section {
    @apply flex w-full items-center py-4;
  }
  label {
    @apply mb-1 block pr-4 font-bold text-gray-700;
  }
</style>
