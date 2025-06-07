// Upload-Button-Event kannst du später hier connecten

let analysisData = [];
let currentIndex = 0;

// Funktion, um MP3 und JSON dynamisch zu setzen
function loadSongAndAnalysis(mp3Url, jsonUrl) {
    const song = document.getElementById('song');
    song.src = mp3Url;

    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            analysisData = data;
            currentIndex = 0;
        });

    song.addEventListener('timeupdate', () => {
        if (analysisData.length > 0 && currentIndex < analysisData.length) {
            const currentTime = song.currentTime;

            while (currentIndex < analysisData.length && analysisData[currentIndex].time <= currentTime) {
                let currentEnergy = analysisData[currentIndex].energy;


                currentIndex++;
            }
        }
    });
}

