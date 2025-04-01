

// Global variables
let session = null;
let videoSource = null;
let isPlaying = false;
const modelInputShape = [1, 3, 640, 640];
const topk = 100;
const iouThreshold = 0.45;
const scoreThreshold = 0.25;

const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const videoInput = document.getElementById("videoInput");

const stopBtn = document.getElementById("stopBtn");
const uploadBtn = document.getElementById("uploadBtn");

const frontCamBtn = document.getElementById("frontCamBtn");
const backCamBtn = document.getElementById("backCamBtn");

// Initialize ONNX Runtime and OpenCV
async function initialize() {
  console.log("Initializing OpenCV and ONNX Runtime...");
  await cv["onRuntimeInitialized"];
  console.log("OpenCV initialized.");

  
  const arrBufNet = await download(`../yolov8n.onnx`); // put these two model files in the same directory as this html file
  const arrBufNMS = await download(`../nms-yolov8.onnx`);

  const yolov8 = await createSession(arrBufNet);
  const nms = await createSession(arrBufNMS);

  // Warmup model
  const tensor = new ort.Tensor(
    "float32",
    new Float32Array(modelInputShape.reduce((a, b) => a * b)),
    modelInputShape
  );
  await yolov8.run({ images: tensor });

  session = { net: yolov8, nms: nms };
  console.log("Model loaded and ready.");
  let tn = document.createTextNode("ready!");

  document.body.appendChild(tn);
}

// Create ONNX session
async function createSession(arrBuf, backend = "webgpu") {
  const options = {
    executionProviders: [backend],
    intraOpNumThreads: navigator.hardwareConcurrency || 4,
    graphOptimizationLevel: "all",
    extra: {
      session: {
        disable_prepacking: "1",
        use_device_allocator_for_initializers: "1",
        use_ort_model_bytes_directly: "1",
        use_ort_model_bytes_for_initializers: "1",
      },
    },
  };

  try {
    ort.env.wasm.simd = true;
    const session = await ort.InferenceSession.create(arrBuf, options);
    return session;
  } catch (error) {
    console.warn(
      `Failed to create session with ${backend}. Falling back to default provider.`,
      error
    );

    return ort.InferenceSession.create(arrBuf, {
      intraOpNumThreads: navigator.hardwareConcurrency || 4,
    });
  }
}

// Process video frames
async function processVideoFrame() {
  if (videoElement && canvasElement && session && isPlaying) {
    const context = canvasElement.getContext("2d");
    context.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    await detectImage(
      canvasElement,
      canvasElement,
      session,
      topk,
      iouThreshold,
      scoreThreshold,
      modelInputShape
    );

    requestAnimationFrame(processVideoFrame);
    //   canvasElement.width = videoElement.videoWidth;
    //       canvasElement.height = videoElement.videoHeight;
  }
}

// Handle video upload
uploadBtn.onclick = function () {
  videoInput.click();
};

stopBtn.onclick = function () {
  stopVideo();
};

frontCamBtn.onclick = function () {
  handleCameraCapture("user");
};

backCamBtn.onclick = function () {
  handleCameraCapture("environment");
};

videoInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    videoSource = URL.createObjectURL(file);
    videoElement.src = videoSource;
    videoElement.onloadeddata = () => {
      // Set canvas dimensions to match video dimensions

      // console.log("Canvas dimensions:", {
      //   width: canvasElement.width,
      //   height: canvasElement.height,
      //   clientWidth: canvasElement.clientWidth,
      //   clientHeight: canvasElement.clientHeight,
      // });

      isPlaying = true;
      videoElement.play(); // Start playing the video
      // processVideoFrame(); // Start processing frames
      requestAnimationFrame(processVideoFrame);
      // canvasElement.width = videoElement.videoWidth;
      //     canvasElement.height = videoElement.videoHeight;

      const scaleX = videoElement.videoWidth / videoElement.videoHeight;

      // Apply transform with corrected translation
      canvasElement.style.transform = `scaleX(${scaleX})`;
    };
  }
});

// Handle camera capture
async function handleCameraCapture(cameraFacing) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          exact: cameraFacing,
        },
      },
    });
    videoElement.srcObject = stream;
    videoElement.onloadeddata = () => {
      // Set canvas dimensions to match video dimensions
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      // console.log("Canvas dimensions:", {
      //   width: canvasElement.width,
      //   height: canvasElement.height,
      //   clientWidth: canvasElement.clientWidth,
      //   clientHeight: canvasElement.clientHeight,
      // });

      isPlaying = true;
      videoElement.play(); // Start playing the video
      processVideoFrame(); // Start processing frames
      canvasElement.style.transform = `scaleX(${
        videoElement.videoWidth / videoElement.videoHeight
      })`;
    };
  } catch (error) {
    console.error("Error accessing the camera:", error);
  }
}

// Stop video
function stopVideo() {
  videoElement.pause();
  isPlaying = false;
  videoSource = null;
  videoElement.src = "";
  if (videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
  canvasElement.width = 0; // Reset canvas dimensions
  canvasElement.height = 0;
}

export const download = (url, logger = null) => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(request.response);
      } else {
        reject({
          status: this.status,
          statusText: request.statusText,
        });
      }
      resolve(request.response);
    };
    request.onerror = function () {
      reject({
        status: this.status,
        statusText: request.statusText,
      });
    };
    request.send();
  });
};

window.onload = async function () {
  await initialize();
};




/**
 * Detect Image
 * @param {HTMLImageElement} image Image to detect
 * @param {HTMLCanvasElement} canvas canvas to draw boxes
 * @param {ort.InferenceSession} session YOLOv8 onnxruntime session
 * @param {Number} topk Integer representing the maximum number of boxes to be selected per class
 * @param {Number} iouThreshold Float representing the threshold for deciding whether boxes overlap too much with respect to IOU
 * @param {Number} scoreThreshold Float representing the threshold for deciding when to remove boxes based on score
 * @param {Number[]} inputShape model input shape. Normally in YOLO model [batch, channels, width, height]
 */
export const detectImage = async (
  image,
  canvas,
  session,
  topk,
  iouThreshold,
  scoreThreshold,
  inputShape
) => {
  const [modelWidth, modelHeight] = inputShape.slice(2);
  let [input, xRatio, yRatio] = preprocessing(image, modelWidth, modelHeight);



  const tensor = new ort.Tensor("float32", input.data32F, inputShape); // to ort.Tensor
  const config = new ort.Tensor(
    "float32",
    new Float32Array([
      topk, // topk per class
      iouThreshold, // iou threshold
      scoreThreshold, // score threshold
    ])
  ); // nms config tensor
  const { output0 } = await session.net.run({ images: tensor }); // run session and get output layer
  const { selected } = await session.nms.run({ detection: output0, config: config }); // perform nms and filter boxes
  const boxes = [];
// console.log(selected);
  // looping through output
  for (let idx = 0; idx < selected.dims[1]; idx++) {
    const data = selected.data.slice(idx * selected.dims[2], (idx + 1) * selected.dims[2]); // get rows
    const box = data.slice(0, 4);
    const scores = data.slice(4); // classes probability scores
    const score = Math.max(...scores); // maximum probability scores
    const label = scores.indexOf(score); // class id of maximum probability scores

    const [x, y, w, h] = [
      (box[0] - 0.5 * box[2]) * xRatio, // upscale left
      (box[1] - 0.5 * box[3]) * 1, // upscale top
      box[2] * xRatio, // upscale width
      box[3] * 1, // upscale height
    ]; // keep boxes in maxSize range

    boxes.push({
      label: label,
      probability: score,
      bounding: [x, y, w, h], // upscale box
    }); // update boxes to draw later
  }
  // console.log(boxes)
  await renderBoxes(canvas, boxes); // Draw boxes
  // input.delete(); // delete unused Mat
};

/**
 * Preprocessing image
 * @param {HTMLImageElement} source image source
 * @param {Number} modelWidth model input width
 * @param {Number} modelHeight model input height
 * @return preprocessed image and configs
 */
const preprocessing = (source, modelWidth, modelHeight) => {
  const mat = cv.imread(source); // read from img tag
  const matC3 = new cv.Mat(mat.rows, mat.cols, cv.CV_8UC3); // new image matrix
  cv.cvtColor(mat, matC3, cv.COLOR_RGBA2BGR); // RGBA to BGR

  // padding image to [n x n] dim
  const maxSize = Math.max(matC3.rows, matC3.cols); // get max size from width and height
  const xPad = maxSize - matC3.cols, // set xPadding
    xRatio = maxSize / matC3.cols; // set xRatio
  const yPad = maxSize - matC3.rows, // set yPadding
    yRatio = maxSize / matC3.rows; // set yRatio
  const matPad = new cv.Mat(); // new mat for padded image
  cv.copyMakeBorder(matC3, matPad, 0, yPad, 0, xPad, cv.BORDER_CONSTANT); // padding black

  const input = cv.blobFromImage(
    matPad,
    1 / 255.0, // normalize
    new cv.Size(modelWidth, modelHeight), // resize to model input size
    new cv.Scalar(0, 0, 0),
    true, // swapRB
    false // crop
  ); // preprocessing image matrix

  // release mat opencv
  mat.delete();
  matC3.delete();
  matPad.delete();

  return [input, xRatio, yRatio];
};


const labels = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "airplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
];

export const renderBoxes = async (canvas, boxes) => {
  // Verify canvas and context
  if (!canvas) {
    console.error("Canvas is null or undefined");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get 2d context");
    // Log canvas dimensions and state
    // console.log("Canvas dimensions:", {
    //   width: canvas.width,
    //   height: canvas.height,
    //   clientWidth: canvas.clientWidth,
    //   clientHeight: canvas.clientHeight,
    // });

    return;
  }

  // Ensure canvas has dimensions
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions");
    return;
  }

  // Clear with logging
  // console.log("Clearing canvas...");
  // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const colors = new Colors();

  // Calculate and verify font size
  const fontSize = Math.max(
    Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40),
    14
  );
  // console.log("Using font size:", fontSize);

  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = "top";

  // Add frame request to ensure rendering happens after GPU operations

  boxes.forEach((box, index) => {
    // Log each box being processed
    // console.log(`Processing box ${index}:`, box);
    // if (labels[box.label] != "person"){ return}

    // console.log(labels[box.label]);
    const klass = labels[box.label];
    const color = colors.get(box.label);
    const score = (box.probability * 100).toFixed(1);
    const [x1, y1, width, height] = box.bounding;

    // Verify coordinates are valid numbers
    if ([x1, y1, width, height].some((n) => !Number.isFinite(n))) {
      console.error("Invalid coordinates for box:", box);
      return;
    }

    // Draw box with semi-transparent fill
    ctx.fillStyle = Colors.hexToRgba(color, 0.2);
    ctx.fillRect(x1, y1, width, height);

    // Draw border
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(
      Math.min(ctx.canvas.width, ctx.canvas.height) / 200,
      2.5
    );
    ctx.strokeRect(x1, y1, width, height);

    // Calculate and verify text dimensions
    const labelText = `${klass} - ${score}%`;
    const textWidth = ctx.measureText(labelText).width;
    const textHeight = 10;
    const yText = y1 - (textHeight + ctx.lineWidth);

    // Draw label background
    ctx.fillStyle = color;
    ctx.fillRect(
      x1 - 1,
      yText < 0 ? 0 : yText,
      textWidth + ctx.lineWidth,
      textHeight + ctx.lineWidth
    );

    // Draw text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labelText, x1 - 1, yText < 0 ? 1 : yText + 1);
  });

  await new Promise(requestAnimationFrame);

  // Final verification log
  // console.log("Rendering completed");
};

class Colors {
  // ultralytics color palette https://ultralytics.com/
  constructor() {
    this.palette = [
      "#FF3838",
      "#FF9D97",
      "#FF701F",
      "#FFB21D",
      "#CFD231",
      "#48F90A",
      "#92CC17",
      "#3DDB86",
      "#1A9334",
      "#00D4BB",
      "#2C99A8",
      "#00C2FF",
      "#344593",
      "#6473FF",
      "#0018EC",
      "#8438FF",
      "#520085",
      "#CB38FF",
      "#FF95C8",
      "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i) => this.palette[Math.floor(i) % this.n];

  static hexToRgba = (hex, alpha) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${[
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ].join(", ")}, ${alpha})`
      : null;
  };
}