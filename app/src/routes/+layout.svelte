<script>
  import '../app.css'
  import Toast from '$lib/notifications/Toast.svelte'
  import Navigation from '$lib/components/Navigation.svelte'
</script>

<div class="p-4">
  <div class="min-h-full">
    <div class="mx-auto max-w-7xl">
      <Navigation />
      <slot />
    </div>
  </div>
</div>
<Toast />
