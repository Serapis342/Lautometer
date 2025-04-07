const dbLevel = document.getElementById('dbLevel');
const calibration = document.getElementById('calibration');
const dbMax = document.getElementById('maxLimit');
const limitCount = document.getElementById('limitCount');
const pauseButton = document.getElementById('pause_go');
const pauseButtonImage = document.getElementById('image_pause');
const restartButton = document.getElementById('restart');
const title = document.getElementById('title');

let dbMaxCounter = 0;

let savedCalibration = document.cookie.split("; ").find(row => row.startsWith("calibrationValue="))?.split("=")[1];
let savedDbMax = document.cookie.split("; ").find(row => row.startsWith("dbMax="))?.split("=")[1];

if (savedCalibration) { calibration.value = savedCalibration; }
if (savedDbMax) { dbMax.value = savedDbMax; }

calibration.oninput = e => {
    document.cookie = `calibrationValue=${e.target.value}; path=/`;
};

dbMax.oninput = e => {
    document.cookie = `dbMax=${e.target.value}; path=/`;
};

pauseButton.onclick = function() {
    if (window.checkLoudnessInterval) {
        clearInterval(window.checkLoudnessInterval);
        window.checkLoudnessInterval = null;
        pauseButtonImage.src = "icons/start.svg";
    } else {
        getMicrophone();
        pauseButtonImage.src = "icons/pause.svg";
    }
};

restartButton.onclick = function() {
    dbMaxCounter = 0;
    checkLoudness(-4);
}

window.addEventListener("resize", checkOverlapping);
window.onload = checkOverlapping();

function getMicrophone() {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((stream) => {
            measureLoudness(stream);
        })
        .catch((err) => {
            console.error(`Couldn't connect to your microphone: ${err}`);
        });
}

function measureLoudness(stream) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const lowpass = audioContext.createBiquadFilter();

    lowpass.type = "lowpass";
    lowpass.frequency.value = 3000;

    microphone.connect(lowpass);
    lowpass.connect(analyser);

    analyser.fftSize = 32768;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    function getRMS(samples = 100) {
        let totalRMS = 0;

        for (let j = 0; j < samples; j++) {
            analyser.getFloatTimeDomainData(dataArray);
            let sum = dataArray.reduce((acc, val) => acc + val * val, 0);
            totalRMS += Math.sqrt(sum / bufferLength);
        }

        const rms = totalRMS / samples;
        let dB = 20 * Math.log10(rms || 1e-10) + (calibration ? parseFloat(calibration.value) : 0);
        dB = Math.max(dB, 0);

        dbLevel.innerHTML = `${Math.round(dB)}`;
        checkLoudness(dB, dbMax.value);
        changeDBcolor(dB, dbMax.value);
    }

    getRMS();

    if (!window.checkLoudnessInterval) {
        window.checkLoudnessInterval = setInterval(getRMS, 100);
    }
}




let dbHandler = false;
function checkLoudness(dB, dbMaxValue) {
    if (dB > dbMaxValue && !dbHandler) {
        dbMaxCounter++;
        dbHandler = true;
    } else if (dB <= dbMaxValue) { dbHandler = false; }

    limitCount.innerText = dbMaxCounter;
}

function changeDBcolor(dB, dbMaxValue) {
    if(dB < ((1/3)*dbMaxValue)) {
        dbLevel.style.color = "#50FA7B";
    } else if (dB < ((2 / 3) * dbMaxValue)) {
        dbLevel.style.color = "#FFB86C";
    } else {
        dbLevel.style.color = "#FF5555";
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('service worker registered'))
        .catch(err => console.error('service worker not registered: ', err));
}

function checkOverlapping() {
    let elements = document.getElementsByClassName("checkCollision");

    for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
            if (isOverlapping(elements[i], elements[j])) {
                window.location.href = "./false_screensize.html";
                return;
            }
        }
    }
}

function isOverlapping(elem1, elem2) {
    let rect1 = elem1.getBoundingClientRect();
    let rect2 = elem2.getBoundingClientRect();

    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}