<script lang="ts">
  import { signOut } from 'aws-amplify/auth'
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/stores'
  import './style.css'

  afterNavigate(() => {
    const autofocus = document.querySelector('.autofocus') as HTMLInputElement
    autofocus?.focus()
  })

  async function handleSignOut() {
    await signOut()
    return goto('/login', { invalidateAll: true })
  }
</script>

<div class="my-auto flex w-full flex-col gap-4 px-4">
  {#if $page.data.user}
    <div class="ml-3 text-lg">
      Currently signed in as:
      <span class="ml-2 font-bold">
        {$page.data.user.username}
      </span>
    </div>
    <button class="btn--primary autofocus" on:click={handleSignOut}>
      Sign Out
    </button>
  {:else}
    <slot />
  {/if}
</div>
