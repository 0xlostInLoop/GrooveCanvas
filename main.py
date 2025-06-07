from flask import Flask, request, render_template, send_from_directory, jsonify, send_file
import os
import librosa
import json
import uuid
import mimetypes

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
ANALYSIS_FOLDER = 'static/analysis'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANALYSIS_FOLDER, exist_ok=True)

ALLOWED_MIME_TYPES = [
    'audio/mpeg',    # .mp3
]

@app.route('/')
def analyze():
    return render_template('songAnalyze.html')

@app.route('/upload', methods=['POST'])
def upload_and_analyze():
    if 'file' not in request.files:
        return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    if file:
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Analyse
        y, sr = librosa.load(filepath)
        hop_length = 512
        rms = librosa.feature.rms(y=y, hop_length=hop_length)
        frames = range(len(rms[0]))
        times = librosa.frames_to_time(frames, sr=sr, hop_length=hop_length)
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)

        analysis_result = {
            "bpm": float(tempo),
            "energy_over_time": [{"time": float(tp), "energy": float(e)} for tp, e in zip(times, rms[0])],
            "beat_times": [float(bt) for bt in beat_times]
        }

        json_filename = f"{filename}.json"
        json_filepath = os.path.join(ANALYSIS_FOLDER, json_filename)

        with open(json_filepath, 'w') as f:
            json.dump(analysis_result, f)

        # 👇👇 CORRECT URLS
        return jsonify({
            "mp3_url": f"/uploads/{filename}",                # <- Right URL
            "json_url": f"/static/analysis/{json_filename}",   # <- Right URL
            "beat_times": [float(bt) for bt in beat_times],
            "bpm": float(tempo)
        })

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    mimetype, _ = mimetypes.guess_type(filepath)
    return send_file(filepath, mimetype=mimetype)

@app.route('/static/analysis/<path:filename>')
def analysis_file(filename):
    filepath = os.path.join(ANALYSIS_FOLDER, filename)
    mimetype, _ = mimetypes.guess_type(filepath)
    return send_file(filepath, mimetype=mimetype)

if __name__ == '__main__':
    app.run(debug=True)
