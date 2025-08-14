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
  const [history, setHistory] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Automatically use deployed backend if VITE_BACKEND_URL is set, otherwise fallback to localhost
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? new URL("/transcribe", import.meta.env.VITE_BACKEND_URL).toString()
  : window.location.hostname === "localhost"
    ? "http://localhost:5000/transcribe"
    : "https://speech-to-text-api-backend.onrender.com/transcribe";

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio file");
    const formData = new FormData();
    formData.append("audio", file);
    await sendToTranscription(formData, file.name);
  };

  const startRecording = async () => {
    setTranscription("");
    setRecording(true);
    setRecordedBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);

        if (audioBlob.size < 1000) {
          setTranscription("⚠️ Recording too short.");
          return;
        }

        const audioFile = new File([audioBlob], `recording.${mimeType.split("/")[1]}`, { type: mimeType });
        const formData = new FormData();
        formData.append("audio", audioFile);

        await sendToTranscription(formData, audioFile.name);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone access denied:", err);
      setRecording(false);
      setTranscription("⚠️ Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  const sendToTranscription = async (formData, filename = "audio") => {
    setLoading(true);
    setTranscription("");

    try {
      const response = await axios.post(BACKEND_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const transcript = response.data.transcript;
      if (!transcript || transcript.trim() === "") {
        setTranscription("⚠️ Could not process audio, please try again.");
        return;
      }

      setTranscription(transcript);
      setHistory((prev) => [{ text: transcript, name: filename }, ...prev]);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setTranscription("⚠️ Failed to transcribe. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveText = (text, filename = "transcription.txt") => {
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleDownloadAudio = () => {
    if (!recordedBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(recordedBlob);
    link.download = "recorded_audio.webm";
    link.click();
  };

  const handleDeleteTranscription = () => {
    setTranscription("");
    setRecordedBlob(null);
  };

  const handleClearHistory = () => setHistory([]);

  return (
    <div className="speech-container fullscreen flex justify-center items-center py-10">
      <div className="speech-box bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-xl animate-fadeIn">
        {/* Mode Buttons */}
        <div className="speech-mode-buttons flex justify-center gap-4 mb-6">
          <button onClick={() => setMode("upload")} className={`mode-button ${mode === "upload" ? "active" : ""}`}>Upload File</button>
          <button onClick={() => setMode("record")} className={`mode-button ${mode === "record" ? "active" : ""}`}>Record Audio</button>
        </div>

        {/* Upload */}
        {mode === "upload" && (
          <>
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} className="file-input mb-4" />
            <button onClick={handleUpload} className="primary-button w-full">{loading ? "Transcribing..." : "Upload & Transcribe"}</button>
          </>
        )}

        {/* Record */}
        {mode === "record" && (
          <>
            {!recording ? (
              <button onClick={startRecording} className="record-button w-full mb-2">🎙️ Start Recording</button>
            ) : (
              <button onClick={stopRecording} className="stop-button w-full mb-2">⏹️ Stop & Transcribe</button>
            )}
            {loading && <p className="loading-text text-center mt-2">⏳ Transcribing...</p>}
          </>
        )}

        {/* Audio Preview */}
        {recordedBlob && (
          <>
            <audio className="audio-preview mt-4 w-full" controls>
              <source src={URL.createObjectURL(recordedBlob)} type={recordedBlob.type} />
            </audio>
            <div className="flex gap-2 mt-2">
              <button className="secondary-button flex-1" onClick={handleDownloadAudio}>⬇️ Download Audio</button>
              <button className="secondary-button flex-1" onClick={handleDeleteTranscription}>🗑️ Delete Audio</button>
            </div>
          </>
        )}

        {/* Transcription */}
        {transcription && (
          <div className="transcription-box mt-6 p-4 rounded-lg border-l-4 border-purple-600 bg-purple-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold mb-2">📝 Transcription</h2>
            <p className="break-words">{transcription}</p>
            <div className="flex gap-2 mt-2">
              <button className="secondary-button flex-1" onClick={() => handleSaveText(transcription)}>💾 Save Text</button>
              <button className="secondary-button flex-1" onClick={handleDeleteTranscription}>🗑️ Clear</button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">📜 Transcription History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((item, index) => (
                <div key={index} className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
                  <p className="truncate">{item.text}</p>
                  <button className="secondary-button text-sm ml-2" onClick={() => handleSaveText(item.text, `${item.name}.txt`)}>💾</button>
                </div>
              ))}
            </div>
            <button className="secondary-button mt-2 w-full" onClick={handleClearHistory}>🗑️ Clear History</button>
          </div>
        )}
      </div>
    </div>
  );
}