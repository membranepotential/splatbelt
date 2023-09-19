<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import debounce from 'lodash/debounce';

	export let value: string;
	let class_: string;
	export { class_ as class };

	const dispatch = createEventDispatcher<{ change: string }>();

	function handleChange() {
		dispatch('change', value.trim());
	}

	const debouncedHandleChange = debounce(handleChange, 500);
</script>

<input
	bind:value
	on:input={debouncedHandleChange}
	class="focus:border-transparent focus:outline-none focus:ring-0 {class_}"
/>
