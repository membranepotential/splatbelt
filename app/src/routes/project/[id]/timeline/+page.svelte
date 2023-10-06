<script lang="ts">
  import type { PageData } from './$types';
  import type { Project } from '$lib/models/project';
  import Timeline from './Timeline.svelte';

  export let data: PageData;
  const project: Project = data.project;
  console.log('Canvas for project', project);
</script>

<div class="py-10"><Timeline /></div>
