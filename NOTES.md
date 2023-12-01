
if app state = free
gar nix

if app state  = record
start listening to touchstart, once touch start, 
  - set time0 = now()
  - start listening to touchmove, for each move:
    - save move event to recordedmotion
  - start listening to touchend, once touchend
    - persist keyframes in app state
    - reset timer to 0
    - set app state to playing

if app state = playing
  get current motion total time
  start timer interval
  for each timer tick (16ms)
    replay events in motion


in next screen when exporting
  - events to keyframes? to curve

========================
        

Wire touch events
Check viewer works with touchmove 

Model anschauen? Mittelpunkt? Initial camera position? -> Felix im Meshlab :flex: