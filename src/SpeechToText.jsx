import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

export default function SpeechToText() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("upload");
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ✅ Automatically switches between local and deployed backend
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    "https://speech-to-text-api-backend.onrender.com/transcribe";

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an audio file");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    await sendToTranscription(formData);
  };

  const startRecording = async () => {
    setTranscription("");
    setRecording(true);
    setRecordedBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 192000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);

        // ✅ Skip sending if blob is too short (common on mobile)
        if (audioBlob.size < 1000) {
          alert("Recording too short. Try again.");
          setTranscription("❌ Recording too short.");
          return;
        }

        const file = new File(
          [audioBlob],
          `recording.${mimeType.split("/")[1]}`,
          { type: mimeType }
        );

        const formData = new FormData();
        formData.append("audio", file);

        await sendToTranscription(formData);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access.");
      setRecording(false);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendToTranscription = async (formData) => {
    setLoading(true);
    setTranscription("");

    try {
      const response = await axios.post(BACKEND_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTranscription(response.data.transcript || "No transcription received.");
    } catch (error) {
      console.error("Error transcribing audio", error);
      setTranscription("❌ Failed to transcribe.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveText = () => {
    const blob = new Blob([transcription], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transcription.txt";
    link.click();
  };

  const handleDownloadAudio = () => {
    if (!recordedBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(recordedBlob);
    link.download = "recorded_audio.webm";
    link.click();
  };

  return (
    <div className="speech-container fullscreen">
      <div className="speech-box">
        <div className="speech-mode-buttons">
          <button
            onClick={() => setMode("upload")}
            className={`mode-button ${mode === "upload" ? "active" : ""}`}
          >
            Upload File
          </button>
          <button
            onClick={() => setMode("record")}
            className={`mode-button ${mode === "record" ? "active" : ""}`}
          >
            Record Audio
          </button>
        </div>

        {mode === "upload" && (
          <>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
            <button onClick={handleUpload} className="primary-button">
              {loading ? "Transcribing..." : "Upload & Transcribe"}
            </button>
          </>
        )}

        {mode === "record" && (
          <>
            {!recording ? (
              <button onClick={startRecording} className="record-button">
                🎙️ Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="stop-button">
                ⏹️ Stop & Transcribe
              </button>
            )}
            {loading && <p className="loading-text">⏳ Transcribing...</p>}
          </>
        )}

        {recordedBlob && (
          <>
            <audio className="audio-preview" controls>
              <source
                src={URL.createObjectURL(recordedBlob)}
                type={recordedBlob.type}
              />
              Your browser does not support the audio element.
            </audio>
            <button
              className="secondary-button mt-2"
              onClick={handleDownloadAudio}
            >
              ⬇️ Download Audio
            </button>
          </>
        )}

        {transcription && (
          <div className="transcription-box">
            <h2>📝 Transcription</h2>
            <p>{transcription}</p>
            <button
              className="secondary-button mt-2"
              onClick={handleSaveText}
            >
              💾 Save Transcription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
