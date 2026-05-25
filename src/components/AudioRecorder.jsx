import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { set, get } from 'idb-keyval';

const AudioRecorder = ({ setHasAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    // Check if we already have an audio saved
    const loadAudio = async () => {
      try {
        const audioBlob = await get('mahamantra_audio');
        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setHasAudio(true);
        }
      } catch (e) {
        console.error("Error loading audio", e);
      }
    };
    loadAudio();
  }, [setHasAudio]);

  const startRecording = async () => {
    setPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Use the native mimeType from the recorder instead of hardcoding 'audio/webm' (iOS doesn't support webm)
        const mimeType = mediaRecorder.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Save to IndexedDB
        await set('mahamantra_audio', audioBlob);
        setHasAudio(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  };

  const reRecord = () => {
    setAudioUrl(null);
    setHasAudio(false);
  };

  return (
    <div className="card text-center" style={{ marginTop: '2rem' }}>
      <h2 className="text-2xl font-bold mb-4">Record Mahamantra</h2>
      <p className="text-muted mb-4">
        Record your own voice chanting the Hare Krishna Mahamantra. This will play each time you chant.
      </p>

      {permissionError && (
        <div className="mb-4 text-danger flex items-center justify-center gap-2">
          <AlertCircle size={20} />
          <span>Microphone access denied. Please allow it in your browser settings.</span>
        </div>
      )}

      {isRecording && (
        <div className="audio-visualizer">
          <div className="recording-indicator"></div>
          <span>Recording... Speak clearly</span>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-4">
        {!isRecording && !audioUrl && (
          <button className="btn" onClick={startRecording}>
            <Mic size={20} /> Start Recording
          </button>
        )}

        {isRecording && (
          <button className="btn danger" onClick={stopRecording}>
            <Square size={20} /> Stop Recording
          </button>
        )}
      </div>

      {audioUrl && !isRecording && (
        <div>
          <div className="mb-4 p-4 border border-success rounded" style={{ borderColor: 'var(--success)', borderRadius: '12px' }}>
            <div className="flex items-center justify-center gap-2 text-success font-bold text-xl">
              <Check size={24} />
              <span>Recording Saved!</span>
            </div>
          </div>
          
          <audio ref={audioRef} src={audioUrl} className="hidden" />
          
          <div className="flex justify-center gap-4">
            <button className="btn" onClick={playRecording}>
              <Play size={20} /> Play
            </button>
            <button className="btn outline" onClick={reRecord}>
              <RefreshCw size={20} /> Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
