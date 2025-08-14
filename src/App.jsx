import React, { useState } from "react";
import SpeechToText from "./SpeechToText";
import "./App.css";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className={`${darkMode ? "dark" : "light"} app-container min-h-screen`}>
      <header className="app-header p-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <p className="powered bg-purple-800 inline-block px-4 py-1 rounded-full text-sm mb-4">🔊 Powered by Speech Recognition</p>
        <h1 className="main-title text-4xl font-bold">
          <span>Speech-to-Text</span>
          <br />
          <span className="highlight text-5xl font-extrabold">Transcription</span>
        </h1>
        <p className="description max-w-xl mx-auto mt-2 text-lg text-gray-200">
          Convert your audio recordings and files into accurate text transcriptions. Record directly or upload audio files to get started instantly.
        </p>
        <div className="features flex justify-center gap-6 mt-4 text-gray-100">
          <div>⚡ Fast Processing</div>
          <div>🔒 Secure & Private</div>
          <div>🎛️ AI Powered</div>
        </div>
        <button
          onClick={toggleTheme}
          className="mt-4 px-4 py-2 rounded-lg bg-white text-purple-700 font-semibold hover:bg-gray-200 transition"
        >
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>
      <SpeechToText />
    </div>
  );
}