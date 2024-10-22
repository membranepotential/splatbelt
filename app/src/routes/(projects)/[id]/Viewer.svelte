<script lang="ts">
  import { Viewer } from '@mkkellogg/gaussian-splats-3d'
  import { PerspectiveCamera, Vector2, Vector3 } from 'three'

  import { onMount, onDestroy } from 'svelte'
  import { readable, type Readable } from 'svelte/store'
  import { error } from '@sveltejs/kit'
  import {
    VIEWER_STATE,
    Movement,
    type Shot,
    type Sample,
    DEFAULT_SHOT,
  } from '$lib/types'
  import { Animated, Control, Export, Orbit, Record } from '$lib/controls'
  import { app, shots } from '$lib/stores'

  import TopNav from '$lib/components/TopNav.svelte'
  import ViewRecordToggle from '$lib/components/ViewRecordToggle.svelte'
  import SettingsPane from '$lib/components/SettingsPane.svelte'
  import ShotSettings from '$lib/components/ShotSettings.svelte'
  import ShotList from '$lib/components/ShotList.svelte'
  import TraceSvg from '$lib/components/TraceSVG.svelte'
  import type { ProjectItem } from '$lib/server/projects'

  /*
  Root component that views the uploaded model.
  */

  export let project: ProjectItem

  $: shots.hydrate(project.shots ?? [])

  $: state = $app.state
  $: shotIdx = $app.shotIdx

  let shot: Shot
  $: shot = $shots[shotIdx] ?? DEFAULT_SHOT

  let rootElement: HTMLDivElement

  let camera: PerspectiveCamera
  let viewer: Viewer

  let control: Control
  let updateScheduled = true
  let updateOnChange = false

  let free: Orbit
  let record: Record
  let animation: Animated

  $: if (record && shot) {
    record.motion = shot.motion
  }

  $: if (animation) {
    if (state == VIEWER_STATE.PLAY && shot && shot.samples.length > 2) {
      animation.setShot(shot)
    } else {
      animation.stop()
    }
  }

  let trace: Readable<Vector2[]>
  let playProgress: Readable<number>
  $: if (record && state == VIEWER_STATE.RECORD) {
    trace = record.trace
  } else if (animation && state == VIEWER_STATE.PLAY) {
    trace = animation.trace
    playProgress = animation.clock
  } else {
    trace = readable([])
  }

  let exporter: Export
  $: if (rootElement && animation) {
    exporter = new Export(
      rootElement.getElementsByTagName('canvas')[0],
      animation
    )
  }

  let resizeObserver = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect
    const aspect = width / height

    if (Math.abs(camera.aspect - aspect) > 0.01) {
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      requestUpdate()
    }
  })

  onMount(async () => {
    if (!project.scene) error(500, 'No scene data found')

    camera = new PerspectiveCamera(
      project.scene.fov,
      rootElement.clientWidth / rootElement.clientHeight,
      0.1,
      500
    )
    camera.position.fromArray(project.scene.position)
    camera.up.fromArray(project.scene.up ?? [0, 1, 0])

    const target = new Vector3().fromArray(project.scene.center ?? [0, 0, 0])
    control = new Control(camera, target)

    viewer = new Viewer({
      rootElement,
      camera,
      useBuiltInControls: false,
      gpuAcceleratedSort: true,
      selfDrivenMode: false,
    })

    await viewer.addSplatScene(`/${project.id}/model.ply`, {
      splatAlphaRemovalThreshold: 70,
    })

    free = new Orbit(control)
    record = new Record(control, shot.motion)
    record.addEventListener('shot', (event) => handleRecordedShot(event.shot))

    animation = new Animated(control)

    resizeObserver.observe(rootElement)
    control.addEventListener('change', requestUpdate)

    // first update
    updateOnChange = false
    update()

    // switch to on-demand updates after a while
    setTimeout(() => {
      updateOnChange = true
    }, 1000)
  })

  onDestroy(() => {
    resizeObserver.disconnect()
    control.removeEventListener('change', requestUpdate)
    viewer.dispose()
  })

  function requestUpdate() {
    if (!updateScheduled) {
      updateScheduled = true
      requestAnimationFrame(update)
    }
  }

  function update() {
    updateScheduled = false

    control.update()
    viewer.update()
    viewer.render()

    if (!updateOnChange) {
      requestUpdate()
    }
  }

  function updateProject() {
    return fetch(`${project.id}/shots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify($shots),
    })
  }

  function handleRecordedShot(samples: Sample[]) {
    shot = { ...shot, samples }
    const n_shots = $shots.length
    if (n_shots <= shotIdx) {
      // no shot at this index => add new shot
      shots.push(shot)
      shotIdx = n_shots
    } else {
      // shot at this index => replace shot
      shots.replace(shotIdx, shot)
    }

    updateProject()
    app.goto(VIEWER_STATE.PLAY, shotIdx)
  }

  function newShot() {
    app.goto(VIEWER_STATE.RECORD, $shots.length)
  }

  function changeShot(event: CustomEvent<{ to: number }>) {
    app.goto(VIEWER_STATE.PLAY, event.detail.to)
  }

  function replaceShot(event: CustomEvent<{ idx: number }>) {
    app.goto(VIEWER_STATE.RECORD, event.detail.idx)
  }

  function deleteCurrentShot() {
    shots.delete_(shotIdx)
    app.decrShotIdx()

    updateProject()

    if ($shots.length === 0) {
      app.goto(VIEWER_STATE.RECORD)
    } else {
      app.goto(VIEWER_STATE.PLAY)
    }
  }

  function toggleMotion(
    event: CustomEvent<{ movement: Movement; axis: 'x' | 'y' }>
  ) {
    const { movement, axis } = event.detail
    let { motion } = shot

    const otherAxis = axis === 'x' ? 'y' : 'x'
    const [self, other] = [motion[axis], motion[otherAxis]]

    if (
      (movement === Movement.DOLLY || movement === Movement.ZOOM) &&
      other === movement
    ) {
      // Dolly and Zoom are exclusive to one axis
      motion = { ...motion, [otherAxis]: self }
    }

    motion = { ...motion, [axis]: movement }
    shot = { ...shot, motion }
    shots.replace(shotIdx, shot)
  }

  function updateShotSpeed(event: CustomEvent<{ speed: number }>) {
    const { speed } = event.detail
    shot = { ...shot, speed }
    shots.replace(shotIdx, shot)
    updateProject()
  }

  async function exportVideo() {
    if (!exporter) return

    app.goto(VIEWER_STATE.EXPORT)
    await exporter.start()

    app.goto(VIEWER_STATE.PLAY)
  }

  function onPointerDown(event: PointerEvent) {
    if (state === VIEWER_STATE.FREE) {
      free.onPointerDown(event)
    } else if (state === VIEWER_STATE.RECORD) {
      record.onPointerDown(event)
    }
  }

  function onWheel(event: WheelEvent) {
    if (state === VIEWER_STATE.FREE) {
      free.onWheel(event)
    } else if (state === VIEWER_STATE.RECORD) {
      record.onWheel(event)
    }
  }
</script>

<div
  bind:this={rootElement}
  class="canvas relative z-10 h-full w-full touch-none overflow-hidden"
  role="application"
  on:pointerdown={onPointerDown}
  on:wheel={onWheel}
  on:contextmenu|preventDefault
>
  <div class="absolute left-0 top-0 z-20 h-full w-full">
    <TraceSvg
      trace={$trace}
      fill="none"
      stroke="white"
      stroke-width="12px"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </div>

  <div class="absolute left-0 top-0 z-30 h-full w-full">
    {#if state === VIEWER_STATE.FREE || state === VIEWER_STATE.RECORD}
      <ViewRecordToggle {state} on:toggle={(e) => app.goto(e.detail)} />
      <SettingsPane {shot} on:toggle={toggleMotion} />
    {/if}

    {#if state === VIEWER_STATE.PLAY}
      <ShotSettings
        {state}
        {shot}
        on:speed={updateShotSpeed}
        on:delete={deleteCurrentShot}
      />
      <ShotList
        current={shotIdx}
        total={$shots.length}
        progress={$playProgress}
        on:new={newShot}
        on:redo={replaceShot}
        on:change={changeShot}
      />
    {/if}

    <TopNav
      showBack={state === VIEWER_STATE.PLAY}
      showExport={$shots.length > 0}
      on:back={() => app.goto(VIEWER_STATE.FREE)}
      on:export={() => exportVideo()}
    />
  </div>
</div>
