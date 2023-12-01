<script>
  import Navigation from '$lib/components/Navigation.svelte'
</script>

<div class="min-h-full flex-1">
  <div class="mx-auto max-w-7xl">
    <Navigation />
    <div class="p-4">
      <slot />
    </div>
  </div>
</div>
