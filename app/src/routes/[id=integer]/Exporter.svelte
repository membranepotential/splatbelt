<script lang="ts">
  import type Viewer from '$lib/services/viewer'
  import type { Shot } from '$lib/types'
  import { onMount } from 'svelte'

  export let viewer: Viewer
  export let shots: Shot[]

  const canvas = viewer.rootElement as unknown as HTMLCanvasElement
  const FRAMERATE = 60

  const videoStream = canvas.captureStream(FRAMERATE)
  const mediaRecorder = new MediaRecorder(videoStream)

  let chunks: Blob[] = []

  function playAndExport() {
    setup()

    mediaRecorder.start()

    for (const shot of shots) {
      // TODO: we want a consistent way to play shots on player and recorder
      playShot(shot)
    }

    mediaRecorder.stop()
  }
  function playShot(shot: Shot) {
    console.log('playing shot ', shot)
    // viewer.playShot(shot)
  }

  /*
  https://medium.com/@amatewasu/how-to-record-a-canvas-element-d4d0826d3591
  if you want to manually trigger the frames, 
  that can be useful if you struggle to create a real-time animation:
  var videoStream = canvas.captureStream(0);
  and then every time you want to capture a 
  frame (in your render loop for example):
  videoStream.getVideoTracks()[0].requestFrame();
  */

  /*
  @see
  https://stackoverflow.com/questions/19235286/convert-html5-canvas-sequence-to-a-video-file
  */

  function setup() {
    mediaRecorder.ondataavailable = function (e: BlobEvent) {
      chunks.push(e.data)
    }

    mediaRecorder.onstop = function (/* e: Event */) {
      var blob = new Blob(chunks, { type: 'video/mp4' }) // other types are available such as 'video/webm' for instance, see the doc for more info
      // chunks = []
      var link$ = document.createElement('a')
      link$.setAttribute('download', 'recordingVideo')
      link$.setAttribute('href', URL.createObjectURL(blob))
      link$.click()
    }
  }

  onMount(() => {
    console.log('playing ', shots.length, 'shots')
    console.log('canvas is :', canvas)
    playAndExport()
  })
</script>
