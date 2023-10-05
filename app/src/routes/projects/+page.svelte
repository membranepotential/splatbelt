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
				name: 'New Project'
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
						<button class="ml-2 text-red-600" on:click={() => deleteProject(project.id)}
							>Delete</button
						>
					</li>
				{/each}
				<li class="h-10 flex flex-row items-center">
					<button on:click={createProject}>New Project</button>
				</li>
			</ul>
		</div>
	</main>
</div>
