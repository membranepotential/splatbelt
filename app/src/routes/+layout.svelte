<script>
  import '../app.css'
  import Toast from '$lib/notifications/Toast.svelte'
  import Navigation from '$lib/components/Navigation.svelte'
</script>

<div class="p-4">
  <div class="min-h-full">
    <Navigation />
    <slot />
  </div>
</div>
<Toast />
