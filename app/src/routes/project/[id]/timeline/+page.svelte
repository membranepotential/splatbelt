<script lang="ts">
  import type { PageData } from './$types';
  import type { Project } from '$lib/models/project';

  export let data: PageData;
  const project: Project = data.project;
  console.log('Project', project);
</script>

<div class="py-10">Canvas</div>
