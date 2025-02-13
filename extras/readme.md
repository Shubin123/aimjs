# PLEASE modify the microcontroller code before use 
## Although the uf2 CAN be uploaded directly and WILL work, for your own safety consider the following:

- 1. setup the arduino ide with the right board manager for your micro-controller.
- 2. load the [sketch](./arduino/controlMouse.ino) into the ide, verify external libraries valid.
- 3. change the network STASSID / STAPSK ie: name / password  (techincally optional, highly recommended).
- 3.2 (optional) uncomment WiFi.mode(WIFI_STA) AND comment out WiFi.mode(WIFI_AP); for exsting wlan connection.
- 3.3 (very optional) comment out the debugging serial.println and serial.begin lines if kernel anticheat scans serial ports (unlikely)
- 4. flash the pico through arduino ide upload button or exported binary (uf2).
- 5. point to the right ip (192.168.0.1 in sta mode)

## Note that the mouse-controller portion of this program is currently served over http (unsecure) DO NOT PORTFORWARD!
for this project, there should be no reason to portforward the pi pico EVER (this is when connected to existing wlan, in AP mode you wont be able portforward anyways)

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
 - make mouse mapping dynamic (right now its set statically it should be based off screen/video size)
 - add an ip field for the client side to pick (easy-ish just needs some testing to confirm working)
 - add esp32 (vroom/c3) support (not too difficult assuming external library parity in functionality)
 - add pi zero 2 w support (difficult to debug right now g_serial and g_hid cant be multiplexed over usb)
 - add online flash for micro-controllers (not impossible adafruit offers an online flash utility for esp32)
 - add interpolation/smoothing to movements and other counter-detection of mouse movements (no snapping! maybe acceleration based on prev positions?)
 - add mouse jacking through the web from one x86 broswer to another (no way google approves this for chromium good, maybe scary dream)
 