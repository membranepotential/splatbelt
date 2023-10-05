<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import FrameSelection from "./FrameSelection.svelte";
  import { toWorkerConfig } from "$lib/models/model";
  import type { Model } from "$lib/models/model";
  import type { Upload } from "$lib/models/upload";

  const dispatch = createEventDispatcher<{ change: Model }>();

  export let uploads: Upload[];
  export let model: Model;
  const frameSelections = uploads.map((upload) => {
    const key = upload.name;
    if (key in model.frames) {
      const selection = model.frames[key];
      return { key, active: true, selection };
    } else {
      return { key, active: false, selection: null };
    }
  });
  $: {
    model.frames = Object.fromEntries(
      frameSelections
        .filter((setting) => setting.active && setting.selection !== null)
        .map((setting) => [
          setting.key,
          setting.selection || { type: "num", num: 10 },
        ])
    );
    dispatch("change", model);
  }

  function handlePairingChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value === "exhaustive") {
      model.pairing = { type: "exhaustive" };
    } else if (value === "complex") {
      model.pairing = {
        type: "complex",
        sequential: 5,
        retrieval: 5,
        covisible: null,
      };
    }
  }

  async function launchWorker() {
    const config = toWorkerConfig(model);
    await fetch(`${model.project}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  }
</script>

<div class="container p-4">
  <div class="mb-4">
    <h2 class="font-bold mb-2">Frame Selection</h2>
    {#each frameSelections as setting}
      <FrameSelection bind:setting />
    {/each}
  </div>

  <div class="mb-4">
    <h2 class="font-bold mb-2">Pairing</h2>
    <div class="flex items-center mb-2">
      <select
        value={model.pairing.type}
        on:change={handlePairingChange}
        class="border p-2"
      >
        <option value="exhaustive">Exhaustive</option>
        <option value="complex">Complex</option>
      </select>
    </div>
  </div>

  <div class="mb-4">
    <h2 class="font-bold mb-2">Settings</h2>
    <ul>
      <li>
        <label for="feature-config">Features</label>
        <input
          id="feature-config"
          type="text"
          bind:value={model.config.feature_type}
          class="border p-2"
        />
      </li>
      <li>
        <label for="matcher-config">Matcher</label>
        <input
          id="matcher-config"
          type="text"
          bind:value={model.config.matcher_type}
          class="border p-2"
        />
      </li>
    </ul>
  </div>

  <div>
    <h2 class="font-bold mb-2">Progress</h2>
    <p>State: {model.state.state} {model.state.progress}%</p>
  </div>
  <div>
    <button on:click={launchWorker}>Analyse</button>
  </div>
</div>
