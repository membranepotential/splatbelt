<div class="shot-settings-container w-100 flex overflow-hidden">
  <div class="duration w-/12 mr-6 p-4">
    <h5 class="mb-2 text-white">Speed</h5>
    <span class="isolate inline-flex rounded-md shadow-sm">
      <button
        type="button"
        class="text-md relative inline-flex items-center rounded-l-md bg-transparent px-3 py-2 font-semibold text-gray-900 text-indigo-300 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
        >0.5</button
      >
      <button
        type="button"
        class="text-md relative -ml-px inline-flex items-center bg-transparent px-3 py-2 font-semibold text-gray-900 text-indigo-300 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
        >0.75</button
      >
      <button
        type="button"
        class="active text-md relative -ml-px inline-flex items-center bg-transparent px-3 py-2 font-semibold text-gray-900 text-indigo-300 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
        >x1</button
      >
      <button
        type="button"
        class="text-md relative -ml-px inline-flex items-center rounded-r-md bg-transparent px-3 py-2 font-semibold text-gray-900 text-indigo-300 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
        >x2</button
      >
    </span>
  </div>
  <div class=" mr-2 w-2/12 py-4 text-center">
    <h5 class="mb-2 text-white">Redo</h5>
    <span class="isolate inline-flex rounded-md shadow-sm">
      <button
        type="button"
        class="text-md font-semiboldbg-slate-950 relative inline-flex items-center rounded-md bg-slate-200 bg-transparent px-3 py-2 text-indigo-300 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
      >
        <svg
          width="24px"
          height="24px"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          color="#000000"
          ><path
            d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11"
            stroke="#000000"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /><path
            d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3"
            stroke="#000000"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /><path
            d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13"
            stroke="#000000"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /><path
            d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21"
            stroke="#000000"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        ></button
      >
    </span>
  </div>
  <div class=" w-2/12 py-4">
    <h5 class="mb-2 text-white">Delete</h5>
    <span class="isolate inline-flex rounded-md shadow-sm">
      <button
        type="button"
        class="text-md relative inline-flex items-center rounded-md bg-slate-200 bg-transparent px-3 py-2 font-semibold text-indigo-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
      >
        <svg
          width="24px"
          height="24px"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          color="#000000"
          ><path
            d="M8.99219 13H11.9922H14.9922"
            stroke="#000000"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /><path
            d="M3.03919 4.2939C3.01449 4.10866 3.0791 3.92338 3.23133 3.81499C3.9272 3.31953 6.3142 2 12 2C17.6858 2 20.0728 3.31952 20.7687 3.81499C20.9209 3.92338 20.9855 4.10866 20.9608 4.2939L19.2616 17.0378C19.0968 18.2744 18.3644 19.3632 17.2813 19.9821L16.9614 20.1649C13.8871 21.9217 10.1129 21.9217 7.03861 20.1649L6.71873 19.9821C5.6356 19.3632 4.90325 18.2744 4.73838 17.0378L3.03919 4.2939Z"
            stroke="#000000"
            stroke-width="1.5"
          /><path
            d="M3 5C5.57143 7.66666 18.4286 7.66662 21 5"
            stroke="#000000"
            stroke-width="1.5"
          /></svg
        ></button
      >
    </span>
  </div>
</div>

<style lang="sass">
.shot-settings-container
  position: absolute
  bottom: 0
  width: 100%
  height: 13vh
  @apply bg-slate-950
  button
    &.active
      @apply bg-slate-200 text-indigo-700

</style>
