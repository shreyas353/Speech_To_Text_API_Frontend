import SpeechToText from "./SpeechToText";

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <p className="powered">🔊 Powered by Speech Recognition</p>
        <h1 className="main-title">
          <span>Speech-to-Text</span>
          <br />
          <span className="highlight">Transcription</span>
        </h1>
        <p className="description">
          Convert your audio recordings and files into accurate text transcriptions.
          Record directly or upload audio files to get started instantly.
        </p>
        <div className="features">
          <div>⚡ Fast Processing</div>
          <div>🔒 Secure & Private</div>
          <div>🎛️ AI Powered</div>
        </div>
      </header>
      <SpeechToText />
    </div>
  );
}