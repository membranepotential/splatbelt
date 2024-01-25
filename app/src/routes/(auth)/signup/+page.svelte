<script lang="ts">
  import { goto } from '$app/navigation'
  import { signUp, autoSignIn } from 'aws-amplify/auth'
  import '../style.css'

  let username = ''
  let password = ''
  let password2 = ''

  let message = ''
  let hasError = validate()

  function validate() {
    if (username.length == 0 && password.length == 0 && password2.length == 0) {
      message = ''
      return true
    }
    if (username.length < 3) {
      message = 'Username must be at least 3 characters'
      return true
    }
    if (password.length < 6) {
      message = 'Password must be at least 6 characters'
      return true
    }
    if (password.length >= 6 && password != password2) {
      message = 'Passwords do not match'
      return true
    }

    message = ''
    return false
  }

  async function onSubmit() {
    try {
      const { isSignUpComplete } = await signUp({
        username,
        password,
        options: { userAttributes: {}, autoSignIn: true },
      })

      if (isSignUpComplete) {
        await autoSignIn()
      }

      return goto('/', { invalidateAll: true })
    } catch (error) {
      message = error.message
    }
  }
</script>

<form
  on:input={() => (hasError = validate())}
  on:submit|preventDefault={onSubmit}
  class="form--auth"
>
  <div>
    <label for="username" class="label--auth"> Username </label>
    <input
      id="username"
      type="text"
      bind:value={username}
      class="autofocus input--auth"
    />
  </div>
  <div>
    <label for="password" class="label--auth"> Password </label>
    <input
      id="password"
      type="password"
      bind:value={password}
      class="input--auth"
    />
  </div>
  <div>
    <label for="password2" class="label--auth"> Confirm Password </label>
    <input
      id="password2"
      type="password"
      bind:value={password2}
      class="input--auth"
    />
  </div>
  <p class="msg--error">
    {message}
  </p>
  <button class="btn--primary" type="submit" disabled={hasError}>
    Sign Up
  </button>
  <div>
    <a class="btn--primary" href="/login"> Log In </a>
  </div>
</form>
