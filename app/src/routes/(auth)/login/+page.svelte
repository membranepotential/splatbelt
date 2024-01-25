<script lang="ts">
  import { signIn } from 'aws-amplify/auth'
  import { goto } from '$app/navigation'
  import '../style.css'

  let username = ''
  let password = ''

  let message = ''
  let hasError = validate()

  function validate() {
    if (username.length == 0 && password.length == 0) {
      message = ''
      return true
    }
    message = ''
    return false
  }

  async function handleSubmit() {
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password })
      if (!isSignedIn) {
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          message = 'Please confirm your account'
        }
      }
      await goto('/', { invalidateAll: true })
    } catch (error) {
      message = error.message
    }
  }
</script>

<form
  class="form--auth"
  on:input={() => (hasError = validate())}
  on:submit|preventDefault={handleSubmit}
>
  <div>
    <label for="username" class="label--auth"> Username </label>
    <input
      id="username"
      type="text"
      autocomplete="username"
      bind:value={username}
      class="autofocus input--auth"
    />
  </div>
  <div>
    <label for="password" class="label--auth"> Password </label>
    <input
      id="password"
      type="password"
      autocomplete="current-password"
      bind:value={password}
      class="input--auth"
    />
  </div>
  <p class="msg--error">
    {message}
  </p>
  <div>
    <button class="btn--primary" type="submit" disabled={hasError}>
      Sign In
    </button>
  </div>
  <div>
    <a class="btn--primary" href="/signup"> Sign Up </a>
  </div>
</form>
