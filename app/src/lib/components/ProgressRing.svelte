<script lang="ts">
  export let progress = 0 // Progress value between 0 and 1

  const radius = 10 // Radius of the circle
  const circumference = 2 * Math.PI * radius

  $: strokeDashoffset = circumference * (1 - progress)
</script>

<svg
  width="80px"
  height="80px"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  color="white"
>
  <circle
    class="progress-ring"
    stroke="white"
    stroke-width="1.2"
    fill="none"
    r={radius}
    cx="12"
    cy="12"
    stroke-dasharray="{circumference} {circumference}"
    stroke-dashoffset={strokeDashoffset}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>

<style>
  .progress-ring {
    transition: stroke-dashoffset 0.35s;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
</style>
