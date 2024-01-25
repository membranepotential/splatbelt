// See https://kit.svelte.dev/docs/types#app

import type { AuthUser } from 'aws-amplify/auth'

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: AuthUser
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {}
