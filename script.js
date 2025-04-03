const dbLevel = document.getElementById('dbLevel');
const calibration = document.getElementById('calibration');
const dbMax = document.getElementById('maxLimit');
const limitCount = document.getElementById('limitCount');
const pauseButton = document.getElementById('pause_go');
const pauseButtonImage = document.getElementById('image_pause');
const restartButton = document.getElementById('restart');

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
    microphone.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;

    function getRMS() {
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i] - 128;
            sum += value * value;
        }

        const rms = Math.sqrt(sum / bufferLength);
        let dB = 20 * Math.log10(rms) + parseInt(calibration.value);
        if (dB < 0) dB = 0;

        dbLevel.innerHTML = `Lautstärke: ${dB.toFixed(2)} dB`;


        checkLoudness(dB);

        if (!window.checkLoudnessInterval) {
            window.checkLoudnessInterval = setInterval(() => {
                getRMS(dB);
            }, 1*200); // var*1000 enspricht var sekunden
        }
    }
    getRMS();
}

let dbHandler = false;
function checkLoudness(dB) {
    if (dB > dbMax.value && !dbHandler) {
        dbMaxCounter++;
        dbHandler = true;
    } else if (dB <= dbMax.value) { dbHandler = false; }

    limitCount.innerText = dbMaxCounter;
}