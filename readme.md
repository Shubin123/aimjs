# 🎯 Aim your cursor through object detection 🎯 all you need is a browser!

![preview](./extras/media/preview.gif)![preview](./extras/media/preview2.gif)

## aim.js: (Autonomous Interface Manipulation)!

# To run the project:

- ## Host a http site navigate to index.html (root of this project).
- ## Enable the mouse takeover through a micro-controller (and optionally a smart phone) (read below)

# To enable mouse takeover:

### currently achieve through (raspberry pi pico rp2040) micro-controller connected to the host computer, acting as a USB [HID](https://en.wikipedia.org/wiki/Human_interface_device). The source (.ino) and compiled (.uf2) can be found in the [./microController](./microController) directory. By default it will open its own webserver via ad-hoc ap mode. You can choose to connect to an existing wlan aswell. The device connected to and/or requesting the micro-controller http server can be a smartphone running the model, this way the host pc getting its cursor controlled is oblivious to the fact. Once the model is loaded everything works without internet connection (cached offline not fully there yet).

# Try it at https://shubinwang.com/detect (THIS VERSION WONT MOUSE JACK 😅)

## Motivation & Background:

- Move your cursor autonomously through video (live or pre-recorded)!
- Any kernel anticheats on host pc stays oblivious.

### This project is meant to be:

- os agnostic
- fully offline
- semi-install-less

# [mouse modes](./microController/readme.md):

|              | **Absolute Mouse** | **Relative Mouse**              |
| ------------ | ------------------ | ------------------------------- |
| **AP Mode**  | **AP + Absolute**  | **AP + Relative (DEFAULT UF2)** |
| **STA Mode** | **STA + Absolute** | **STA + Relative**              |


### This project was originally inspired by https://github.com/RootKit-Org/AI-Aimbot. Moreover, my earlier attempts was based on extending https://github.com/Hyuto/yolov8-onnxruntime-web to use the webgpu runtime and extending the functionality (webcam or pre-recording). Later on I switched the onnxruntime in favor of [Google's MediaPipe Object Detector](https://ai.google.dev/edge/mediapipe/solutions/vision/object_detector) offering efficentDet-Lite and mobileNet models through tensorflow.js instead of Yolo ran through onnxruntime-web.

The original version of this project based on modifying [Hyuto/yolov8-onnxruntime-web](https://github.com/Hyuto/yolov8-onnxruntime-web) is available in [./extras/deprecated/](./extras/deprecated) as a standalone **you'll need to get yolo and the nms model yourself** [see additional readme](./extras/readme.md)

The past progress videos using the onnxruntime-web in [./extras/media](./extras/media)
