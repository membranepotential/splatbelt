<script>
  export let fn

  let start = null

  function handleDown(event) {
    console.log('down!')
    fn()
  }

  function handleUp() {
    console.log('up!')
    fn()
  }
</script>

<div
  class="user-select-none inline-block"
  on:touchstart|preventDefault={handleDown}
  on:touchend|preventDefault={handleUp}
>
  <slot />
</div>
