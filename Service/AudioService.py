import librosa
import numpy as np

# Laden des Audios
y, sr = librosa.load('../uploads/song.mp3')

# Frame-Schritte: Berechne RMS (Root Mean Square Energy) für jedes Frame
hop_length = 512  # Je kleiner, desto feiner (mehr Datenpunkte)
rms = librosa.feature.rms(y=y, hop_length=hop_length)

# Zeitachsen für die Frames
frames = range(len(rms[0]))
t = librosa.frames_to_time(frames, sr=sr, hop_length=hop_length)

# Ausgabe: jedes Zeitfenster + Lautstärke
for time_point, energy in zip(t, rms[0]):
    print(f"Zeit: {time_point:.2f}s, Lautstärke: {energy:.5f}")
