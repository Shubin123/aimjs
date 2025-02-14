### Extra/stale code
 - the getpico.html app makes request to the microcontroller without needing to load up the object detector
 - the flashpico.html does not work and was an attempt to keep everything in one browser page including uploading code to the micro-controller
 - oldindex.html is a standalone that uses onnxruntime-web and needs yolov8 model in the same running directory as the html.

#### This public google drive folder contains full footage of earlier versions:
https://drive.google.com/drive/folders/1maNNWrxxvwn5DcXNAzSGtpTu_9HfraUR?usp=sharing

#### This folder contains yolo models used by the earlier version (you'll need the nms-yolov8.onnx model and one yolov8(n/s/m/l/x) model).
https://drive.google.com/drive/folders/1EP1JI2eD_AjzpK2Fxo-nZ0RQ2v3tCPKg

##### Bugs:
 - testing the app with multiple videos in a row wont work. (high priority sync/async and states based bug)
 - restarting the app with buttons wont work (currently page refresh works but inefficently (especially if your using pico in ap mode (forcing two more wlan switches))).

##### Plans for future functionality:
 - make 2d mouse mapping dynamic (right now its set statically it should be based off screen/video size)
 - add an ip field for the client side to pick (easy-ish just needs some testing to confirm working)
 - add esp32 (vroom/c3) support (not too difficult assuming external library parity in functionality)
 - add pi zero 2 w support (difficult to debug right now g_serial and g_hid cant be multiplexed over usb)
 - add online flash for micro-controllers (not impossible adafruit offers an online flash utility for esp32)
 - add interpolation/smoothing to movements and other counter-detection of mouse movements (no snapping! maybe acceleration based on prev positions?)
 - add mouse jacking through the web from one x86 broswer to another (no way google approves this for chromium good, maybe scary dream)
 