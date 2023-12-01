<script>
  import '../app.css'
  import Toast from '$lib/notifications/Toast.svelte'
</script>

<div class="relative flex h-full w-full">
  <slot />
</div>
<Toast />
