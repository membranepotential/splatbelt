<script lang="ts">
	import { invalidate } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	async function createProject() {
		await fetch('/api/projects', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'New Project Title'
			})
		});

		await invalidate('/api/projects');
	}

	async function deleteProject(id: number) {
		await fetch(`/api/projects/${id}`, {
			method: 'DELETE'
		});

		await invalidate('/api/projects');
	}
</script>

<div class="py-10">
	<header>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900">Projects</h1>
		</div>
	</header>
	<main>
		<div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
			<ul>
				{#each data.projects as project}
					<li class="h-10 flex flex-row items-center">
						<a class="grow" href="/project/{project.id}">{project.name}</a>

						<button
							type="button"
							on:click={() => deleteProject(project.id)}
							class="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
							>Delete</button
						>
					</li>
				{/each}
				<li class="h-10 flex flex-row items-center">
					<button
						type="button"
						on:click={createProject}
						class="rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
						>Create New Project</button
					>
				</li>
			</ul>
		</div>
	</main>
</div>
