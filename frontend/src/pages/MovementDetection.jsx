import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as posedetection from '@tensorflow-models/pose-detection';

const exercisesByCategory = {
  chest: [
    { name: "Bench Press", caloriesPerMin: 7 },
    { name: "Incline Bench", caloriesPerMin: 7 },
    { name: "Chest Fly", caloriesPerMin: 6 },
    { name: "Push-up", caloriesPerMin: 7 },
    { name: "Cable Crossover", caloriesPerMin: 6 },
    { name: "Dips", caloriesPerMin: 8 },
  ],
  back: [
    { name: "Pull-up", caloriesPerMin: 8 },
    { name: "Lat Pulldown", caloriesPerMin: 7 },
    { name: "Bent Over Row", caloriesPerMin: 6.5 },
    { name: "T-Bar Row", caloriesPerMin: 6.5 },
    { name: "Face Pull", caloriesPerMin: 5 },
    { name: "Deadlift", caloriesPerMin: 9 },
  ],
  legs: [
    { name: "Squat", caloriesPerMin: 8.5 },
    { name: "Leg Press", caloriesPerMin: 7 },
    { name: "Lunges", caloriesPerMin: 6.5 },
    { name: "Leg Extension", caloriesPerMin: 5 },
    { name: "Leg Curl", caloriesPerMin: 5 },
    { name: "Calf Raise", caloriesPerMin: 4 },
  ],
  shoulders: [
    { name: "Shoulder Press", caloriesPerMin: 6 },
    { name: "Lateral Raise", caloriesPerMin: 4 },
    { name: "Front Raise", caloriesPerMin: 4 },
    { name: "Upright Row", caloriesPerMin: 5 },
    { name: "Reverse Fly", caloriesPerMin: 4 },
  ],
  arms: [
    { name: "Bicep Curl", caloriesPerMin: 3.5 },
    { name: "Tricep Extension", caloriesPerMin: 3.5 },
    { name: "Hammer Curl", caloriesPerMin: 3.5 },
    { name: "Skull Crusher", caloriesPerMin: 4 },
    { name: "Preacher Curl", caloriesPerMin: 3.5 },
  ],
  core: [
    { name: "Plank", caloriesPerMin: 4 },
    { name: "Russian Twist", caloriesPerMin: 4 },
    { name: "Sit-up", caloriesPerMin: 4 },
    { name: "Leg Raise", caloriesPerMin: 4 },
    { name: "Mountain Climber", caloriesPerMin: 5 },
  ],
  cardio: [
    { name: "Running", caloriesPerMin: 10 },
    { name: "Cycling", caloriesPerMin: 8 },
    { name: "Jumping Rope", caloriesPerMin: 12 },
    { name: "Rowing", caloriesPerMin: 9 },
    { name: "Stair Climber", caloriesPerMin: 8 },
    { name: "Elliptical", caloriesPerMin: 7 },
  ],
};
const allExercises = Object.values(exercisesByCategory).flat();
const cardioExercises = [
  "Running",
  "Cycling",
  "Jumping Rope",
  "Rowing",
  "Stair Climber",
  "Elliptical",
];

// Egzersizlere göre önemli keypoint indexleri ve bağlantıları (MoveNet)
const exerciseLandmarks = {
  "Squat": {
    points: [6, 5, 12, 11, 14, 13, 16, 15],
    connections: [ [6, 12], [5, 11], [12, 14], [14, 16], [11, 13], [13, 15], [12, 11], [14, 13], [16, 15] ]
  },
  "Push-up": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Bench Press": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Incline Bench": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Chest Fly": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Cable Crossover": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Dips": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Pull-up": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Lat Pulldown": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Bent Over Row": {
    points: [5, 6, 7, 8, 9, 10, 11, 12],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 12] ]
  },
  "T-Bar Row": {
    points: [5, 6, 7, 8, 9, 10, 11, 12],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 12] ]
  },
  "Face Pull": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Deadlift": {
    points: [5, 6, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 11], [6, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Leg Press": {
    points: [11, 12, 13, 14, 15, 16],
    connections: [ [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Lunges": {
    points: [5, 6, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 11], [6, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Leg Extension": {
    points: [11, 13, 15],
    connections: [ [11, 13], [13, 15] ]
  },
  "Leg Curl": {
    points: [11, 13, 15],
    connections: [ [11, 13], [13, 15] ]
  },
  "Calf Raise": {
    points: [11, 13, 15, 12, 14, 16],
    connections: [ [11, 13], [13, 15], [12, 14], [14, 16] ]
  },
  "Shoulder Press": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Lateral Raise": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Front Raise": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Upright Row": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Reverse Fly": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Bicep Curl": {
    points: [5, 7, 9, 6, 8, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10] ]
  },
  "Tricep Extension": {
    points: [5, 7, 9, 6, 8, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10] ]
  },
  "Hammer Curl": {
    points: [5, 7, 9, 6, 8, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10] ]
  },
  "Skull Crusher": {
    points: [5, 7, 9, 6, 8, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10] ]
  },
  "Preacher Curl": {
    points: [5, 7, 9, 6, 8, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10] ]
  },
  "Plank": {
    points: [5, 6, 11, 12, 15, 16],
    connections: [ [5, 11], [6, 12], [11, 15], [12, 16], [5, 6], [11, 12], [15, 16] ]
  },
  "Russian Twist": {
    points: [5, 6, 11, 12],
    connections: [ [5, 11], [6, 12], [5, 6], [11, 12] ]
  },
  "Sit-up": {
    points: [5, 6, 11, 12],
    connections: [ [5, 11], [6, 12], [5, 6], [11, 12] ]
  },
  "Leg Raise": {
    points: [11, 12, 15, 16],
    connections: [ [11, 15], [12, 16], [11, 12], [15, 16] ]
  },
  "Mountain Climber": {
    points: [5, 6, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 11], [6, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Running": {
    points: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Cycling": {
    points: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Jumping Rope": {
    points: [5, 6, 7, 8, 9, 10],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10] ]
  },
  "Rowing": {
    points: [5, 6, 7, 8, 9, 10, 11, 12],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 12] ]
  },
  "Stair Climber": {
    points: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "Elliptical": {
    points: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    connections: [ [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [9, 10], [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [13, 14], [15, 16] ]
  },
  "default": {
    points: Array.from({length: 17}, (_, i) => i),
    connections: [ [0, 1],[1, 2],[2, 3],[3, 4],[0, 5],[5, 6],[6, 7],[7, 8],[8, 9],[9, 10],[10, 11],[11, 12],[12, 13],[13, 14],[14, 15],[15, 16] ]
  }
};

function getAngle(a, b, c) {
  // a, b, c: {x, y}
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  const cosine = dot / (magAB * magCB);
  return Math.acos(cosine) * (180 / Math.PI);
}

// Egzersiz doğruluk fonksiyonları (MoveNet keypoint indexleriyle)
const exerciseAccuracyFunctions = {
  "Squat": (kp) => {
    const rightKneeAngle = getAngle(kp[12], kp[14], kp[16]);
    const leftKneeAngle = getAngle(kp[11], kp[13], kp[15]);
    const hipY = (kp[11].y + kp[12].y) / 2;
    const shoulderY = (kp[5].y + kp[6].y) / 2;
    let score = 0;
    if (rightKneeAngle > 60 && rightKneeAngle < 120) score += 0.5;
    if (leftKneeAngle > 60 && leftKneeAngle < 120) score += 0.5;
    if (hipY > shoulderY) score += 0.5;
    return Math.round((score / 1.5) * 100);
  },
  "Push-up": (kp) => {
    const leftElbowAngle = getAngle(kp[5], kp[7], kp[9]);
    const rightElbowAngle = getAngle(kp[6], kp[8], kp[10]);
    const leftShoulder = kp[5].y;
    const rightShoulder = kp[6].y;
    const leftHip = kp[11].y;
    const rightHip = kp[12].y;
    const leftAnkle = kp[15].y;
    const rightAnkle = kp[16].y;
    let score = 0;
    if (leftElbowAngle > 40 && leftElbowAngle < 160) score += 0.5;
    if (rightElbowAngle > 40 && rightElbowAngle < 160) score += 0.5;
    // Vücut düzlüğü
    if (Math.abs(leftShoulder - leftHip) < 0.08 && Math.abs(leftHip - leftAnkle) < 0.08) score += 0.5;
    if (Math.abs(rightShoulder - rightHip) < 0.08 && Math.abs(rightHip - rightAnkle) < 0.08) score += 0.5;
    return Math.round((score / 2) * 100);
  },
  "Bicep Curl": (kp) => {
    const leftElbowAngle = getAngle(kp[5], kp[7], kp[9]);
    const rightElbowAngle = getAngle(kp[6], kp[8], kp[10]);
    let score = 0;
    if (leftElbowAngle < 70) score += 0.5;
    if (rightElbowAngle < 70) score += 0.5;
    return Math.round(score * 100);
  },
  "Tricep Extension": (kp) => {
    const leftElbowAngle = getAngle(kp[5], kp[7], kp[9]);
    const rightElbowAngle = getAngle(kp[6], kp[8], kp[10]);
    let score = 0;
    if (leftElbowAngle > 150) score += 0.5;
    if (rightElbowAngle > 150) score += 0.5;
    return Math.round(score * 100);
  },
  "Shoulder Press": (kp) => {
    const leftElbowAngle = getAngle(kp[5], kp[7], kp[9]);
    const rightElbowAngle = getAngle(kp[6], kp[8], kp[10]);
    const leftWristY = kp[9].y;
    const rightWristY = kp[10].y;
    const headY = (kp[0].y + kp[1].y) / 2;
    let score = 0;
    if (leftElbowAngle > 100) score += 0.5;
    if (rightElbowAngle > 100) score += 0.5;
    if (leftWristY < headY && rightWristY < headY) score += 0.5;
    return Math.round((score / 1.5) * 100);
  },
  "Lateral Raise": (kp) => {
    const leftShoulder = kp[5].y;
    const rightShoulder = kp[6].y;
    const leftWrist = kp[9].y;
    const rightWrist = kp[10].y;
    let score = 0;
    if (Math.abs(leftShoulder - leftWrist) < 0.08) score += 0.5;
    if (Math.abs(rightShoulder - rightWrist) < 0.08) score += 0.5;
    return Math.round(score * 100);
  },
  "Plank": (kp) => {
    const hipY = (kp[11].y + kp[12].y) / 2;
    const shoulderY = (kp[5].y + kp[6].y) / 2;
    const ankleY = (kp[15].y + kp[16].y) / 2;
    const diff1 = Math.abs(shoulderY - hipY);
    const diff2 = Math.abs(hipY - ankleY);
    return (diff1 < 0.08 && diff2 < 0.08) ? 100 : 70;
  },
  "Deadlift": (kp) => {
    const backAngle = getAngle(kp[11], kp[5], kp[6]);
    const leftKnee = getAngle(kp[11], kp[13], kp[15]);
    const rightKnee = getAngle(kp[12], kp[14], kp[16]);
    let score = 0;
    if (backAngle > 60 && backAngle < 140) score += 0.5;
    if (leftKnee > 60 && rightKnee > 60) score += 0.5;
    return Math.round(score * 100);
  },
  "Sit-up": (kp) => {
    const hipY = (kp[11].y + kp[12].y) / 2;
    const shoulderY = (kp[5].y + kp[6].y) / 2;
    return (shoulderY < hipY) ? 100 : 70;
  },
  "Lunges": (kp) => {
    const leftKnee = getAngle(kp[11], kp[13], kp[15]);
    const rightKnee = getAngle(kp[12], kp[14], kp[16]);
    let score = 0;
    if (leftKnee > 60 && leftKnee < 120) score += 0.5;
    if (rightKnee > 160) score += 0.5;
    return Math.round(score * 100);
  },
  "Bench Press": (kp) => {
    const leftElbowAngle = getAngle(kp[5], kp[7], kp[9]);
    const rightElbowAngle = getAngle(kp[6], kp[8], kp[10]);
    let score = 0;
    if (leftElbowAngle > 70 && leftElbowAngle < 120) score += 0.5;
    if (rightElbowAngle > 70 && rightElbowAngle < 120) score += 0.5;
    return Math.round(score * 100);
  },
  "Pull-up": (kp) => {
    const leftElbowAngle = getAngle(kp[5], kp[7], kp[9]);
    const rightElbowAngle = getAngle(kp[6], kp[8], kp[10]);
    const noseY = kp[0].y;
    const leftWristY = kp[9].y;
    const rightWristY = kp[10].y;
    let score = 0;
    if (leftElbowAngle > 60 && rightElbowAngle > 60) score += 0.5;
    if (noseY < leftWristY && noseY < rightWristY) score += 0.5;
    return Math.round(score * 100);
  },
  "Leg Raise": (kp) => {
    const leftHip = kp[11].y;
    const rightHip = kp[12].y;
    const leftAnkle = kp[15].y;
    const rightAnkle = kp[16].y;
    let score = 0;
    if (leftAnkle < leftHip) score += 0.5;
    if (rightAnkle < rightHip) score += 0.5;
    return Math.round(score * 100);
  },
  "Mountain Climber": (kp) => {
    const leftKnee = getAngle(kp[11], kp[13], kp[15]);
    const rightKnee = getAngle(kp[12], kp[14], kp[16]);
    return (leftKnee < 90 || rightKnee < 90) ? 100 : 70;
  },
  "Russian Twist": (kp) => {
    const leftShoulder = kp[5].x;
    const rightShoulder = kp[6].x;
    const leftHip = kp[11].x;
    const rightHip = kp[12].x;
    return (Math.abs(leftShoulder - leftHip) > 0.1 && Math.abs(rightShoulder - rightHip) > 0.1) ? 100 : 70;
  },
  // Diğer hareketler için benzer şekilde eklenebilir...
};

const MovementDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedExercise, setSelectedExercise] = useState(allExercises[0].name);
  const [timerRunning, setTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(null);
  const [poseKeypoints, setPoseKeypoints] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState("");

  // Kamera ve MoveNet başlat
  const startCameraAndPose = async () => {
    setCameraLoading(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      // Model yükle
      detectorRef.current = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, {
        modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      });
      // Video ve canvas boyutunu ayarla
      videoRef.current.width = 640;
      videoRef.current.height = 480;
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
      // Loop başlat
      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }
        const poses = await detectorRef.current.estimatePoses(videoRef.current);
        if (poses && poses[0] && poses[0].keypoints) {
          setPoseKeypoints(poses[0].keypoints);
          drawKeypointsAndConnections(poses[0].keypoints);
          // Doğruluk oranı hesapla
          const fn = exerciseAccuracyFunctions[selectedExercise];
          if (fn) {
            setAccuracyRate(fn(poses[0].keypoints));
          } else if (cardioExercises.includes(selectedExercise)) {
            setAccuracyRate(null);
          } else {
            setAccuracyRate(0);
          }
        } else {
          setPoseKeypoints(null);
          clearCanvas();
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (err) {
      console.error('Kamera açılırken hata:', err);
      let msg = "Kamera izni verilmedi veya bir hata oluştu. ";
      if (err.name === 'NotAllowedError') {
        msg += "Kamera erişimine izin verilmedi. Lütfen tarayıcı ayarlarından kameraya izin verin.";
      } else if (err.name === 'NotFoundError') {
        msg += "Kamera bulunamadı. Lütfen bir kamera bağlayın.";
      } else if (err.name === 'NotReadableError') {
        msg += "Kamera başka bir uygulama tarafından kullanılıyor olabilir.";
      } else if (err.name === 'OverconstrainedError') {
        msg += "Kamera donanım gereksinimleri karşılanamıyor.";
      } else if (err.message) {
        msg += err.message;
      }
      setError(msg);
      setCameraActive(false);
    }
    setCameraLoading(false);
  };

  // Kamera ve model durdur
  const stopCameraAndPose = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (detectorRef.current) detectorRef.current.dispose();
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPoseKeypoints(null);
    clearCanvas();
  };

  // Sadece ilgili noktaları ve bağlantıları çiz
  const drawKeypointsAndConnections = (keypoints) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Egzersize göre noktalar ve bağlantılar
    const lmConfig = exerciseLandmarks[selectedExercise] || exerciseLandmarks["default"];
    // Bağlantılar
    lmConfig.connections.forEach(([a, b]) => {
      const kpA = keypoints[a];
      const kpB = keypoints[b];
      if (kpA && kpB && kpA.score > 0.3 && kpB.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kpA.x, kpA.y);
        ctx.lineTo(kpB.x, kpB.y);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    });
    // Noktalar
    lmConfig.points.forEach(i => {
      const kp = keypoints[i];
      if (kp && kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
      }
    });
  };
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Timer işlevi
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
        if (selectedExercise && accuracyRate >= 70) {
          const exercise = allExercises.find(ex => ex.name === selectedExercise);
          if (exercise) {
            setCaloriesBurned(prev => prev + (exercise.caloriesPerMin / 60));
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, selectedExercise, accuracyRate]);
  
  // Egzersiz seçimi
  const handleSelectExercise = (exerciseName) => {
    if (selectedExercise !== exerciseName) {
      setSelectedExercise(exerciseName);
      setTimerRunning(false);
      setTime(0);
      setCaloriesBurned(0);
      setAccuracyRate(null);
      setPoseKeypoints(null);
      clearCanvas();
    }
  };

  // Timer'ı başlat/durdur ve kamera kontrolü
  const toggleTimer = async () => {
    if (!timerRunning) {
      if (!cameraActive) {
        await startCameraAndPose();
      }
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
      stopCameraAndPose();
    }
  };
  
  // Zamanı biçimlendir (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      stopCameraAndPose();
    };
  }, []);

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      {/* Hata mesajı */}
      {error && (
        <div className="mb-4 w-full flex justify-center">
          <div className="bg-red-700 bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 max-w-xl w-full relative">
            <span className="font-semibold">{error}</span>
            <button onClick={() => setError("")} className="absolute right-3 top-1 text-white text-xl font-bold hover:text-yellow-300">&times;</button>
          </div>
        </div>
      )}
      {/* Üst bar: Panele Dön ve başlık */}
      <div className="w-full">
        <div className="flex flex-col items-start mb-8">
          <Link to="/dashboard" className="flex items-center text-yellow-500 hover:text-yellow-400 font-semibold text-lg transition duration-200 mb-2">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Panele Dön
      </Link>
          <h1 className="text-3xl font-bold text-yellow-500 mb-1 text-left">Hareket Algılama</h1>
          <p className="text-gray-400 text-left">Kameranızı açın ve hareketlerinizi gerçek zamanlı olarak analiz edin.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Egzersiz Seçimi */}
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800 lg:col-span-1">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Egzersiz Seçimi</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {allExercises.map((exercise) => (
              <div
                key={exercise.name}
                className={`p-3 rounded-lg ${selectedExercise === exercise.name ? 'bg-yellow-900 bg-opacity-30 border-yellow-700' : 'bg-gray-800 bg-opacity-50 border-gray-700'} border cursor-pointer transition-all duration-200`}
                onClick={() => handleSelectExercise(exercise.name)}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-gray-200">{exercise.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Görsel Alanı */}
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800 lg:col-span-2">
          <div className="mb-4 text-gray-300 flex justify-between items-center">
            <span>Canlı Kamera ve Hareket Algılama</span>
            {selectedExercise && (
              <button 
                onClick={toggleTimer}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${timerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={cameraLoading}
              >
                {timerRunning ? 'Durdur' : cameraLoading ? 'Kamera Açılıyor...' : 'Başlat'}
              </button>
            )}
          </div>
          {/* Kamera ve Canvas Alanı */}
          <div className="relative bg-black rounded-lg w-full aspect-video flex items-center justify-center text-gray-500">
            <video ref={videoRef} className="absolute top-0 left-0 w-full h-full" autoPlay playsInline muted width={640} height={480} style={{ display: cameraActive ? 'block' : 'none' }} />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" width={640} height={480} style={{ display: cameraActive ? 'block' : 'none' }} />
            {!cameraActive && <span className="z-10">Kamera kapalı</span>}
            {/* Hareket Doğruluk Göstergesi */}
            {selectedExercise && cameraActive && poseKeypoints && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-lg p-3 text-center z-20">
                {cardioExercises.includes(selectedExercise) ? (
                  <div className="text-lg font-bold text-green-400 mt-1">Aktif</div>
                ) : (
                  <>
                <div className="relative h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-green-500 rounded-full"
                        style={{ width: `${accuracyRate ?? 0}%` }}
                  ></div>
                </div>
                    <div className="text-lg font-bold text-yellow-500 mt-1">%{Math.round(accuracyRate ?? 0)}</div>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Timer ve Kalori Widget'ları */}
          {selectedExercise && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Süre</div>
                  <div className="text-xl font-bold text-white">{formatTime(time)}</div>
                </div>
              </div>
              <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Yakılan Kalori</div>
                  <div className="text-xl font-bold text-white">{caloriesBurned.toFixed(1)} kcal</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Talimatlar */}
      <div className="mt-6 bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Kullanım Talimatları</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-900 flex items-center justify-center text-yellow-500 mr-2">1</div>
              <h4 className="font-medium">Egzersiz Seç</h4>
            </div>
            <p className="text-sm text-gray-400">Listeden yapmak istediğiniz egzersizi seçin.</p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-900 flex items-center justify-center text-yellow-500 mr-2">2</div>
              <h4 className="font-medium">Başlat'a Tıkla</h4>
            </div>
            <p className="text-sm text-gray-400">Hazır olduğunuzda başlat düğmesine basarak egzersizi başlatın.</p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-900 flex items-center justify-center text-yellow-500 mr-2">3</div>
              <h4 className="font-medium">Hareketi Tamamla</h4>
            </div>
            <p className="text-sm text-gray-400">Doğruluk oranını takip ederek hareketi doğru şekilde tamamlayın.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetection;