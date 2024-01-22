<script lang="ts">
  import { onMount } from 'svelte'

  let autofocus: HTMLInputElement

  let username = ''
  let password = ''
  let password2 = ''

  let message = ''
  let hasError = validate()

  onMount(() => {
    autofocus.focus()
  })

  function validate() {
    if (username.length == 0 && password.length == 0 && password2.length == 0) {
      message = ''
      return true
    }
    if (username.length < 3) {
      message = 'Username must be at least 3 characters'
      return true
    }
    if (password.length < 8) {
      message = 'Password must be at least 8 characters'
      return true
    }
    if (password.length > 0 && password != password2) {
      message = 'Passwords do not match'
      return true
    }

    message = ''
    return false
  }
</script>

<div
  class="relative flex h-full touch-none items-center justify-center overflow-y-auto sm:mx-auto sm:w-[390px]"
>
  <form
    method="POST"
    on:input={() => (hasError = validate())}
    class="flex w-full flex-col gap-4 text-indigo-100"
  >
    <div>
      <label
        class="mb-2 ml-3 block text-sm font-bold text-indigo-100"
        for="username"
      >
        Username
      </label>
      <input
        class="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 leading-tight text-indigo-100 caret-indigo-100 transition-colors focus:border-slate-500 focus:bg-slate-700 focus:text-white focus:outline-none"
        id="username"
        name="username"
        type="text"
        bind:this={autofocus}
        bind:value={username}
      />
    </div>
    <div>
      <label
        class="mb-2 ml-3 block text-sm font-bold text-indigo-100"
        for="password"
      >
        Password
      </label>
      <input
        class="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 leading-tight text-indigo-100 caret-indigo-100 transition-colors focus:border-slate-500 focus:bg-slate-700 focus:text-white focus:outline-none"
        id="password"
        name="password"
        type="password"
        bind:value={password}
      />
    </div>
    <div>
      <label
        class="mb-2 ml-3 block text-sm font-bold text-indigo-100"
        for="password2"
      >
        Confirm Password
      </label>
      <input
        class="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 leading-tight text-indigo-100 caret-indigo-100 transition-colors focus:border-slate-500 focus:bg-slate-700 focus:text-white focus:outline-none"
        id="password2"
        type="password"
        bind:value={password2}
      />
    </div>
    <p class="ml-3 text-sm italic text-red-500">
      {message}
    </p>
    <div class="flex items-center justify-between">
      <button
        class="w-full appearance-none rounded-lg border border-slate-800 bg-slate-800 px-3 py-3 leading-tight text-indigo-100 caret-indigo-100 transition transition-colors hover:border-slate-500 hover:bg-slate-700 hover:text-white focus:border-slate-500 focus:text-white focus:outline-none active:border-slate-600 active:bg-slate-800 active:transition-none disabled:cursor-not-allowed disabled:text-indigo-100 disabled:opacity-60 disabled:hover:border-slate-800 disabled:hover:bg-slate-800"
        type="submit"
        disabled={hasError}
      >
        Sign Up
      </button>
    </div>
  </form>
</div>
