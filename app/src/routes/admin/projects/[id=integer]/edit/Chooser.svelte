<script lang="ts">
  export let value: string
  export let options: string[]
</script>

<div>
  {#each options as option}
    <label class="card {value === option ? 'selected' : ''}">
      <input type="radio" bind:group={value} value={option} />
      {option}
    </label>
  {/each}
</div>

<style>
  .card {
    border: 1px solid #ccc;
    padding: 20px;
    margin: 10px;
    border-radius: 8px;
    cursor: pointer;
    user-select: none;
  }

  .card input[type='radio'] {
    display: none;
  }

  .card.selected {
    border-color: blue;
  }
</style>
