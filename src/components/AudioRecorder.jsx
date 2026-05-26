import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Mic, Play, RefreshCw, Square, Trash2 } from 'lucide-react';
import { del, get, set } from 'idb-keyval';

const formatSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
};

const AudioRecorder = ({ setHasAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    let objectUrl;

    const loadAudio = async () => {
      try {
        const audioBlob = await get('mahamantra_audio');
        const meta = await get('mahamantra_audio_meta');
        if (audioBlob) {
          objectUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(objectUrl);
          setHasAudio(true);
          setSavedAt(meta?.savedAt || null);
        }
      } catch (e) {
        console.error('Error loading audio', e);
      }
    };

    loadAudio();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [setHasAudio]);

  useEffect(() => {
    if (!isRecording) return undefined;
    const timer = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  const startRecording = async () => {
    setPermissionError(false);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        const savedAtValue = new Date().toISOString();

        setAudioUrl(url);
        setSavedAt(savedAtValue);
        await set('mahamantra_audio', audioBlob);
        await set('mahamantra_audio_meta', { savedAt: savedAtValue, seconds: recordingSeconds, mimeType });
        setHasAudio(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (!audioUrl || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const reRecord = () => {
    setAudioUrl(null);
    setHasAudio(false);
    setSavedAt(null);
  };

  const deleteRecording = async () => {
    if (!window.confirm('Delete your saved recording?')) return;
    await del('mahamantra_audio');
    await del('mahamantra_audio_meta');
    reRecord();
  };

  return (
    <div className="record-screen">
      <section className="card recorder-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Personal Audio</p>
            <h2>Record Mahamantra</h2>
          </div>
          <div className={audioUrl ? 'status-pill saved' : 'status-pill'}>
            {audioUrl ? 'Ready' : 'Optional'}
          </div>
        </div>

        <p className="text-muted">
          Save one clear chant in your own voice. The counter works without it, and the recording can play as a soft feedback sound on each tap.
        </p>

        {permissionError && (
          <div className="notice danger">
            <AlertCircle size={20} />
            <span>Microphone access was blocked. Please allow microphone access in your browser settings.</span>
          </div>
        )}

        <div className={isRecording ? 'audio-visualizer active' : 'audio-visualizer'}>
          <div className="recording-indicator" />
          <span>{isRecording ? `Recording ${formatSeconds(recordingSeconds)}` : audioUrl ? 'Recording saved' : 'Ready to record'}</span>
        </div>

        {!isRecording && !audioUrl && (
          <button className="btn w-full" onClick={startRecording} type="button">
            <Mic size={20} /> Start Recording
          </button>
        )}

        {isRecording && (
          <button className="btn danger w-full" onClick={stopRecording} type="button">
            <Square size={20} /> Stop Recording
          </button>
        )}

        {audioUrl && !isRecording && (
          <div className="recorder-actions">
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            {savedAt && <p className="saved-note">Saved {new Date(savedAt).toLocaleString()}</p>}
            <div className="button-row">
              <button className="btn" onClick={playRecording} type="button">
                <Play size={20} /> Play
              </button>
              <button className="btn outline" onClick={reRecord} type="button">
                <RefreshCw size={20} /> Re-record
              </button>
              <button className="icon-toggle danger" onClick={deleteRecording} type="button" title="Delete recording">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="notice success">
              <Check size={20} />
              <span>Your recording is stored privately in this browser.</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AudioRecorder;
