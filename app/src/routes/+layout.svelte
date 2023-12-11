<script>
  import '../app.css'
  import Toast from '$lib/notifications/Toast.svelte'
</script>

<div class="h-screen w-screen bg-slate-950">
  <slot />
</div>
<Toast />
