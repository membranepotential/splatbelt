// https://kit.svelte.dev/docs/advanced-routing#matching
import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param) => /^\d+$/.test(param)
