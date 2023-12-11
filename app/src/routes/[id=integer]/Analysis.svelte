<script lang="ts">
  /* Waiting screen to show while uploaded video is converted to a model */
  import type { Project } from '$lib/schemas'

  export let project: Project
</script>
<div>
  The project {project.name} is in state {project.state}
</div>
