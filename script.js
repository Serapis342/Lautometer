const dbLevel = document.getElementById('dbLevel');

getMicrophone();

function getMicrophone() {
    navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
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
    const dataArray = new Uint8Array(bufferLength);

    getRMS();

    function getRMS() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i] - 128;
            sum += value * value;
        }

        const rms = Math.sqrt(sum / bufferLength);
        let dB = 20 * Math.log10(rms); // Kalibrierung nötig
        if (dB < 0) dB = 0 

        dbLevel.innerHTML = `Lautstärke: ${dB.toFixed(2)} dB`;

        requestAnimationFrame(getRMS);
    }
}
