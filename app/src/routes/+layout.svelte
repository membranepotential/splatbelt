<script>
  import { onMount } from 'svelte'
  import '../app.css'
  import Toast from '$lib/notifications/Toast.svelte'

  onMount(() => {
    var ua = window.navigator.userAgent
    var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
    var webkit = !!ua.match(/WebKit/i)
    var iOSSafari = iOS && webkit && !ua.match(/CriOS/i)
    if (iOSSafari) {
      window.scrollBy(0, 1)
    }
  })
</script>

<svelte:head>
  <title>Splatbelt</title>
</svelte:head>

<div class="h-screen bg-slate-950">
  <main
    class="relative flex h-full touch-none overflow-y-auto text-indigo-100 sm:mx-auto sm:w-[640px]"
  >
    <slot />
  </main>
</div>
<Toast />
