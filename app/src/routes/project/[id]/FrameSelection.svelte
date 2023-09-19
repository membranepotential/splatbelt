<script lang="ts">
	import type { FrameSelection } from '$lib/models/model';

	export let setting: { key: string; active: boolean; selection: FrameSelection | null };

	function handleFrameSelectionToggle() {
		if (setting.active && setting.selection === null) {
			setting.selection = { type: 'num', num: 10 };
		}
	}

	function handleFrameSelectionChange(event: Event) {
		const type = (event.target as HTMLSelectElement).value;
		if (setting.active && setting.selection !== null) {
			if (type === 'list') {
				setting.selection = { type: 'list', frames: [] };
			} else if (type === 'num') {
				setting.selection = { type: 'num', num: 10 };
			} else if (type === 'image') {
				setting.selection = { type: 'image' };
			}
		}
	}
</script>

<div class="flex items-center mb-2">
	<input
		id="{setting.key}-frame-include"
		type="checkbox"
		bind:checked={setting.active}
		on:change={handleFrameSelectionToggle}
		class="border p-2"
	/>
	<label class="mr-4" for="{setting.key}-frame-select">{setting.key}</label>
	{#if setting.active && setting.selection !== null}
		<select
			id="{setting.key}-frame-select"
			value={setting.selection.type}
			on:change={handleFrameSelectionChange}
			class="border p-2"
		>
			<option value="num">Num</option>
			<option value="list">List</option>
		</select>
		{#if setting.selection.type === 'num'}
			<input
				id="{setting.key}-frame-num"
				type="number"
				bind:value={setting.selection.num}
				class="ml-4 border p-2"
			/>
		{:else if setting.selection.type === 'list'}
			<button class="ml-4 border p-2">Choose Frames...</button>
		{/if}
	{/if}
</div>
