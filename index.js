import {
  ObjectDetector,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

const demosSection = document.getElementById("demos");

let objectDetector;
let runningMode = "IMAGE";

// set this to the microcontroller's ip
// const ip = "192.168.42.1"; //default
const ip = "192.168.1.152"; //random cidr class c addr assigned by dhcp

// Initialize the object detector
const initializeObjectDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );
  objectDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/ssd_mobilenet_v2/float16/1/ssd_mobilenet_v2.tflite`,
      delegate: "GPU",
    },
    scoreThreshold: confidenceThreshold,
    runningMode: runningMode,
    maxResults: maxObjects,
  });
  //   demosSection.classList.remove("invisible")
};
initializeObjectDetector();

let video = document.getElementById("webcam");
let mouseControlBox = document.getElementById("mouseControlCheckBox");

const liveView = document.getElementById("liveView");
let enableWebcamButton;
let videoInput = document.getElementById("videoInput");

// Slider elements
let maxObjectsSlider = document.getElementById("maxObjects");
let confidenceThresholdSlider = document.getElementById("confidenceThreshold");

// Slider value display elements
let maxObjectsValue = document.getElementById("maxObjectsValue");
let confidenceThresholdValue = document.getElementById(
  "confidenceThresholdValue"
);


let stopBtn = document.getElementById("stopBtn");
let pauseBtn = document.getElementById("pauseBtn");

// Default values
let maxObjects = parseInt(maxObjectsSlider.value);
let confidenceThreshold = parseFloat(confidenceThresholdSlider.value) / 100;



// Update slider values in real-time
maxObjectsSlider.addEventListener("input", () => {
  maxObjects = parseInt(maxObjectsSlider.value);
  maxObjectsValue.textContent = maxObjects;
});

confidenceThresholdSlider.addEventListener("input", () => {
  confidenceThreshold = parseFloat(confidenceThresholdSlider.value) / 100;
  confidenceThresholdValue.textContent = confidenceThresholdSlider.value;
});

stopBtn.addEventListener("click", () => {
  stopVideo();
});

pauseBtn.addEventListener("click", () => {
  if (!video) {
    console.error("wait till video starts!");
    return;
  }
  if (pauseBtn.value == "pause") {
    pauseBtn.value = "unpause";
    video.pause();
  } else {
    pauseBtn.value = "pause";
    video.play();
  }
});

function stopVideo() {
  video.pause();
  // isPlaying = false;
  // // video = null;
  // videoInput.src = "";
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
  // video.width = 0; // Reset canvas dimensions
  // video.height = 0;
}

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easily on each render.
var children = [];

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Add event listener for video file input
videoInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const fileURL = URL.createObjectURL(file);
    video.src = fileURL;
    video.addEventListener("loadeddata", predictWebcam);
  }
});

// Enable the live webcam view and start detection.

let camEnum = ["environment", "user"]; //TODO maybe allow user to flip cam.
async function enableCam(event) {
  if (!objectDetector) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }

  // Hide the button.
  enableWebcamButton.classList.add("removed");

  const constraints = {
    video: {
      facingMode: {
        exact: "environment",
      },
    },
  };

  // Activate the webcam stream.
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    })
    .catch((err) => {
      console.error(err);
      /* handle the error */
    });

  camOrder += 1;
}

let lastVideoTime = -1;
async function predictWebcam() {
  // if image mode is initialized, create a new classifier with video runningMode.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";

    await objectDetector.setOptions({
      runningMode: "VIDEO",
      maxResults: maxObjects,
      scoreThreshold: confidenceThreshold,
    });
  }
  let startTimeMs = performance.now();

  // Detect objects using detectForVideo.
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const detections = objectDetector.detectForVideo(video, startTimeMs);

    // Filter detections further if neccessary (not really)
    // const filteredDetections = detections.detections
    //   .filter((detection) => detection.categories[0].score >= confidenceThreshold)
    //   .slice(0, maxObjects);

    displayVideoDetections({ detections: detections.detections }); //...wow
  }
  // Call this function again to keep predicting when the browser is ready.
  window.requestAnimationFrame(predictWebcam);
}

const calibrationArea = {
  x1: 0, // Top-left X
  y1: 200, // Top-left Y
  x2: 940*20, // Bottom-right X
  y2: 500*40, // Bottom-right Y
};

// Function to map camera coordinates to mouse coordinates
function mapCoordinates(cameraX, cameraY) {
  // Calculate scaling factors
  const scaleX = (calibrationArea.x2 - calibrationArea.x1) / video.offsetWidth;
  const scaleY = (calibrationArea.y2 - calibrationArea.y1) / video.offsetHeight;

  // Map camera coordinates to mouse coordinates
  const mouseX = calibrationArea.x1 + cameraX * scaleX;
  const mouseY = calibrationArea.y1 + cameraY * scaleY;

  return { mouseX, mouseY };
}

async function displayVideoDetections(result) {
  // Remove any highlighting from previous frame.
  for (let child of children) {
    liveView.removeChild(child);
  }
  children.splice(0);

  // Iterate through predictions and draw them to the live view
  for (let detection of result.detections) {
    const label = detection.categories[0].categoryName;
    const { originX, originY, width, height } = detection.boundingBox;

    // Map camera coordinates to mouse coordinates
    const centerX = video.offsetWidth - width - originX + width / 2;
    const centerY = originY + height / 2;
    const { mouseX, mouseY } = mapCoordinates(centerX, centerY);
    await updateMousePosition(mouseX, mouseY);
    // Send the mapped coordinates to the server
    

    // Check if the detected object is a "person" and height > width
    // if (label === "person" && height > width) {
    if (height >= width) {
      // Calculate the center of the bounding box

      // Draw crosshairs at the center (optional)
      const crosshair = document.createElement("div");
      crosshair.setAttribute("class", "crosshair");
      crosshair.style =
        "position: absolute; " +
        "left: " +
        (centerX - 10) +
        "px; " + // Adjust for crosshair size
        "top: " +
        (centerY - 10) +
        "px; " + // Adjust for crosshair size
        "width: 20px; " +
        "height: 20px; " +
        "border: 2px solid red; " +
        "pointer-events: none;";

      liveView.appendChild(crosshair);
      children.push(crosshair);
    }

    // Draw bounding box and label (optional)
    const p = document.createElement("p");
    p.innerText = `${label} - with ${Math.round(
      parseFloat(detection.categories[0].score) * 100
    )}% confidence.`;
    p.style =
      "left: " +
      (video.offsetWidth - width - originX) +
      "px;" +
      "top: " +
      originY +
      "px; " +
      "width: " +
      (width - 10) +
      "px;";

    const highlighter = document.createElement("div");
    highlighter.setAttribute("class", "highlighter");
    highlighter.style =
      "left: " +
      (video.offsetWidth - width - originX) +
      "px;" +
      "top: " +
      originY +
      "px;" +
      "width: " +
      (width - 10) +
      "px;" +
      "height: " +
      height +
      "px;";

    liveView.appendChild(highlighter);
    liveView.appendChild(p);

    // Store drawn objects in memory so they are queued to delete at next call.
    children.push(highlighter);
    children.push(p);
  }
}

async function updateMousePosition(x, y) {
    // if (!mouseControlBox.checked){return};
  // const url = `http://${ip}`;
  const url = `https://${ip}/update-mouse?x=${x}&y=${y}`;
  try {
    fetch(url, {
      mode: "no-cors",
      method: "GET",
    })
  } catch (e) {
    // currently a bug where the requests never fully complete but it mouse will move regardless...
  }
}
