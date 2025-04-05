const dbLevel = document.getElementById('dbLevel');
const calibration = document.getElementById('calibration');
const dbMax = document.getElementById('maxLimit');
const limitCount = document.getElementById('limitCount');
const pauseButton = document.getElementById('pause_go');
const pauseButtonImage = document.getElementById('image_pause');
const restartButton = document.getElementById('restart');
const next = document.getElementById('next');
const prev = document.getElementById('prev');
const numberInput = document.getElementById('number_input');

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

next.onclick = function () {
    dbMax.innerHTML = parseInt(dbMax.innerHTML) + 1;
    numberInput.value = dbMax.innerHTML = parseInt(dbMax.innerHTML);    
    setNumberInputToBoundary();
}

prev.onclick = function (){
    dbMax.innerHTML = parseInt(dbMax.innerHTML) - 1;
    numberInput.value = dbMax.innerHTML = parseInt(dbMax.innerHTML);
    setNumberInputToBoundary();
}

restartButton.onclick = function() {
    dbMaxCounter = 0;
    checkLoudness(-4);
}

let interval; 
numberInput.addEventListener("focus", () => {
    interval = setInterval(() => {
        setNumberInputToBoundary();
        dbMax.innerHTML = numberInput.value;
    }, 0); 
});

numberInput.addEventListener("blur", () => {
    clearInterval(interval);
});

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

    analyser.fftSize = 8192;
    const bufferLength = analyser.frequencyBinCount;

    function getRMS(samples = 10) {
        let totalRMS = 0;

        for (let j = 0; j < samples; j++) {
            const dataArray = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += Math.pow(dataArray[i], 2);
            }

            totalRMS += Math.sqrt(sum / bufferLength);
        }

        const rms = totalRMS / samples;
        let dB = 20 * Math.log10(rms || 1e-10) + (calibration ? parseFloat(calibration.value) : 0);
        dB = Math.max(dB, 0);

        dbLevel.innerHTML = `${Math.round(dB)} dB`;

        checkLoudness(dB);
    }

    getRMS();

    if (!window.checkLoudnessInterval) {
        window.checkLoudnessInterval = setInterval(() => {
            getRMS();
        }, 200);
    }
}




let dbHandler = false;
function checkLoudness(dB) {
    let dbMaxValue = parseInt(dbMax.innerHTML)
    if (dB > dbMaxValue && !dbHandler) {
        dbMaxCounter++;
        dbHandler = true;
    } else if (dB <= dbMaxValue) { dbHandler = false; }

    limitCount.innerText = dbMaxCounter;
}

function setNumberInputToBoundary() {
    if (numberInput.value > 169) { numberInput.value = 169 }
    else if (numberInput.value < 0) { numberInput.value = 0 }
    dbMax.innerHTML = numberInput.value;
}