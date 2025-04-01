const dbLevel = document.getElementById('dbLevel');
const calibration = document.getElementById('calibration');

let savedCookies = document.cookie.split("; ").find(row => row.startsWith("calibrationValue="))?.split("=")[1];
if (savedCookies) {
    calibration.value = savedCookies;
}

calibration.oninput = e => {
    document.cookie = `calibrationValue=${e.target.value}; path=/`;
};

getMicrophone();

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

        requestAnimationFrame(getRMS);
    }
    getRMS();
}
