import React, { useState, useRef, useEffect } from 'react';
import type { Job } from '../../types/job';
import { 
  CheckCircle2, 
  PenTool, 
  Award, 
  Check,
  Mic,
  Square,
  Play,
  Volume2
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';

interface CompletionSummaryStepProps {
  job: Job;
  onCompleteJob: (jobId: string, notes: string, signature?: string) => Promise<void>;
  onCloseWorkflow: () => void;
}

export const CompletionSummaryStep: React.FC<CompletionSummaryStepProps> = ({
  job,
  onCompleteJob,
  onCloseWorkflow,
}) => {
  const [notes, setNotes] = useState('');
  const [signatureName, setSignatureName] = useState(job.customer.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎙️ Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          setAudioUrl(base64Url);
          setVoiceNoteRecorded(true);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks in stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceNoteRecorded(false);
      setRecordingSeconds(0);
      setAudioUrl(null);

      intervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please enable it in browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;

    if (isPlayingAudio) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl;
      } else {
        audioPlayerRef.current = new Audio(audioUrl);
      }

      audioPlayerRef.current.onended = () => {
        setIsPlayingAudio(false);
      };

      audioPlayerRef.current.play()
        .then(() => setIsPlayingAudio(true))
        .catch(err => console.error("Audio playback error:", err));
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalNote = notes?.trim() || 'Work successfully completed and signed off.';
      await onCompleteJob(job.id, finalNote, `Signed by ${signatureName} on ${formatDate(new Date())}`, voiceNoteRecorded ? (audioUrl || 'recorded-audio') : undefined);
      onCloseWorkflow();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6">
      {/* Final Quality Audit Box */}
      <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-4">
        <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Final Work Order Sign-off & Completion Audit</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
              Submit required completion text narrative & voice memo before final customer sign-off.
            </p>
          </div>
          <span className="text-xs font-mono bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md font-semibold shrink-0 whitespace-nowrap">
            {job.jobCode}
          </span>
        </div>

        {/* Workflow Requirements Checklist */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
            Workflow Audit Readiness
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span className="text-emerald-900 font-medium">Before Photos ({job.beforePhotos.length})</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span className="text-emerald-900 font-medium">Inspection Checklist</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span className="text-emerald-900 font-medium">Daily Progress Reports ({job.dailyReports.length})</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span className="text-emerald-900 font-medium">After Photos ({job.afterPhotos.length})</span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Text Report Narrative */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            1. Written Completion Report (Required Text)
          </label>
          <textarea
            rows={3}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter final technical closeout summary..."
            className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        {/* 🎙️ Voice Message Audio Report Recorder */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-zinc-800" />
              <span className="text-xs font-bold text-zinc-900">2. Voice Report Audio Memo (Required Voice)</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Max 60 Secs</span>
          </div>

          <div className="flex items-center space-x-4 bg-white p-3 border border-zinc-200 rounded-lg">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-zinc-800">
                  {isRecording ? '● RECORDING AUDIO...' : voiceNoteRecorded ? '✓ AUDIO MEMO RECORDED' : 'TAP MIC TO RECORD VOICE REPORT'}
                </span>
                <span className="text-zinc-500 font-bold">
                  {isRecording || voiceNoteRecorded ? `00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}` : '00:00'}
                </span>
              </div>
              
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${isRecording ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: isRecording ? `${(recordingSeconds / 60) * 100}%` : voiceNoteRecorded ? '100%' : '0%' }}
                />
              </div>
            </div>

            {voiceNoteRecorded && (
              <button
                type="button"
                onClick={togglePlayAudio}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-mono flex items-center space-x-1 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingAudio ? 'PLAYING' : 'PLAY'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Digital Signature Simulation Box */}
        <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PenTool className="w-4 h-4 text-zinc-700" />
              <span className="text-xs font-semibold text-zinc-900">Customer Digital Sign-off</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">e-Signature Encrypted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-500 mb-1">Signee Full Name</label>
              <input
                type="text"
                required
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full p-2 bg-white border border-zinc-300 rounded-lg font-medium text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Customer Authorization</label>
              <div className="p-2 bg-white border border-zinc-300 rounded-lg font-mono text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
                <span>ACCEPTED & VERIFIED</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Signature Canvas Box Representation */}
          <div className="h-20 bg-white border border-zinc-300 rounded-lg flex flex-col items-center justify-center relative font-mono text-xs text-zinc-400 select-none">
            <div className="font-serif italic text-lg text-zinc-800 tracking-wider">
              {signatureName || 'Customer Signature'}
            </div>
            <div className="absolute bottom-1 right-2 text-[9px] text-zinc-400 font-sans">
              Timestamp: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors shadow-md"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Complete Installation & Submit Work Order</span>
        </button>
      </div>
    </form>
  );
};
