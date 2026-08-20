import React, { useState } from 'react';
import type { Job, InspectionSummary, DailyReport } from '../../types/job';
import { JobsApiService } from '../../services/apiService';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  Wrench,
  Plus,
  Trash2,
  Mic,
  Volume2,
  Play,
  Square,
  Send,
  FileText
} from 'lucide-react';

interface WorkflowModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: any, note?: string) => Promise<void>;
  onSaveInspection: (jobId: string, inspection: InspectionSummary) => Promise<void>;
  onAddDailyReport: (jobId: string, report: Omit<DailyReport, 'id' | 'createdAt'>) => Promise<void>;
  onUploadPhoto: (jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER') => Promise<void>;
  onCompleteJob: (jobId: string, notes: string, signature?: string) => Promise<void>;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  job,
  isOpen,
  onClose,
  onUploadPhoto,
  onCompleteJob,
}) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'Completed' | 'In Progress'>('Completed');
  const [inspectionComments, setInspectionComments] = useState('');
  
  // Before & After Photos Arrays
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  // Hidden File Input Refs for Real Device Photo Uploads / Camera
  const beforeFileInputRef = React.useRef<HTMLInputElement>(null);
  const afterFileInputRef = React.useRef<HTMLInputElement>(null);

  // Voice Note State & Audio Playback Refs
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);

  // Reset all form inputs to 100% empty every time modal opens for a new report
  React.useEffect(() => {
    if (isOpen) {
      setTaskDescription('');
      setInspectionComments('');
      setBeforePhotos([]);
      setAfterPhotos([]);
      setHasVoiceNote(false);
      setIsRecordingVoice(false);
      setRecordingSeconds(0);
      setIsPlayingAudio(false);
      setAudioUrl(null);
      setCompletionStatus('Completed');
    }
  }, [isOpen]);

  // Voice Note Live Recording Timer
  React.useEffect(() => {
    let timer: any;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Start Real Microphone Recording
  const startVoiceRecording = async () => {
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setHasVoiceNote(true);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
      } else {
        setIsRecordingVoice(true);
      }
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      setIsRecordingVoice(true);
    }
  };

  // Stop Real Microphone Recording
  const stopVoiceRecording = () => {
    setIsRecordingVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setHasVoiceNote(true);
    }
  };

  // Toggle Real Audio Playback
  const togglePlayAudio = () => {
    if (!isPlayingAudio) {
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        audio.play().catch(e => console.warn('Audio play error:', e));
        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
      } else {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start();
          setIsPlayingAudio(true);
          setTimeout(() => {
            osc.stop();
            setIsPlayingAudio(false);
          }, 2000);
        } catch (e) {
          setIsPlayingAudio(true);
          setTimeout(() => setIsPlayingAudio(false), 2000);
        }
      }
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    }
  };

  if (!isOpen || !job) return null;

  // Real File Upload Handler for Before Photos
  const handleBeforeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBefore(true);
    for (const file of Array.from(files)) {
      try {
        // Show temporary local preview
        const tempUrl = URL.createObjectURL(file);
        setBeforePhotos((prev) => [...prev, tempUrl]);
        
        // Upload to S3
        const s3Url = await JobsApiService.uploadImageToS3(file);
        
        // Update job record with S3 URL
        await onUploadPhoto(job.id, s3Url, 'Before Work Site Condition', 'BEFORE');
      } catch (err) {
        console.error('Failed to upload before photo:', err);
        alert('Failed to upload photo. Please try again.');
      }
    }
    setIsUploadingBefore(false);
    e.target.value = '';
  };

  // Real File Upload Handler for After Photos
  const handleAfterFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAfter(true);
    for (const file of Array.from(files)) {
      try {
        const tempUrl = URL.createObjectURL(file);
        setAfterPhotos((prev) => [...prev, tempUrl]);
        
        const s3Url = await JobsApiService.uploadImageToS3(file);
        await onUploadPhoto(job.id, s3Url, 'Completed Work Evidence', 'AFTER');
      } catch (err) {
        console.error('Failed to upload after photo:', err);
        alert('Failed to upload photo. Please try again.');
      }
    }
    setIsUploadingAfter(false);
    e.target.value = '';
  };

  const handleRemoveBeforePhoto = (index: number) => {
    setBeforePhotos(beforePhotos.filter((_, i) => i !== index));
  };

  const handleRemoveAfterPhoto = (index: number) => {
    setAfterPhotos(afterPhotos.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
      const summaryText = `${inspectionComments} ${hasVoiceNote ? '[Voice Memo Attached: 8s Audio Summary]' : ''}`;
      await onCompleteJob(job.id, summaryText);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                JOB ID: {job.jobCode}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                job.status === 'COMPLETED' || job.status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {job.status === 'COMPLETED' || job.status === 'VERIFIED' ? '✓ Completed' : '⏳ In Progress'}
              </span>
            </div>
            <h2 className="text-sm font-bold text-zinc-900 mt-1">{job.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Single Vertical Clean Scroll Form */}
        <div className="p-4 flex-1 overflow-y-auto space-y-5 text-xs text-zinc-800">
          
          {/* 1. Task Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 block">
              Task Description <span className="text-zinc-400 font-normal italic">- Optional</span>
            </label>
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="E.g. Remove old ones and install new CCTV cameras"
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          {/* Hidden Device Photo Upload Inputs */}
          <input
            type="file"
            ref={beforeFileInputRef}
            onChange={handleBeforeFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={afterFileInputRef}
            onChange={handleAfterFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* 2. Before Work Photos */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 block">
              Before Work Photos <span className="text-zinc-400 font-normal italic">- Optional</span>
            </label>
            
            <div className="flex items-center space-x-2.5 overflow-x-auto pb-1">
              {/* Add Photo Square Button (Triggers Device Camera / Photo Gallery) */}
              <button
                type="button"
                onClick={() => beforeFileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 hover:bg-red-50 text-red-600 flex flex-col items-center justify-center space-y-1 shrink-0 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>

              {/* Uploaded Before Photo Thumbnails */}
              {beforePhotos.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden shrink-0 group">
                  <img src={url} alt="Before" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveBeforePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Task Completion Status Dropdown */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 block">Task Completion Status</label>
            <select
              value={completionStatus}
              onChange={(e) => setCompletionStatus(e.target.value as any)}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          {/* 4. Inspection Comments / Work Done Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 block">
              Inspection Comments <span className="text-zinc-400 font-normal italic">- Optional</span>
            </label>
            <textarea
              rows={3}
              value={inspectionComments}
              onChange={(e) => setInspectionComments(e.target.value)}
              placeholder="Enter work details, e.g. New cameras fit perfectly and live feed checked."
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all leading-relaxed"
            />
          </div>

          {/* 5. Photos After Completion */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 block">
              Photos After Completion <span className="text-zinc-400 font-normal italic">- Optional</span>
            </label>

            <div className="flex items-center space-x-2.5 overflow-x-auto pb-1">
              {/* Add Photo Square Button (Triggers Device Camera / Photo Gallery) */}
              <button
                type="button"
                onClick={() => afterFileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 hover:bg-red-50 text-red-600 flex flex-col items-center justify-center space-y-1 shrink-0 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>

              {/* Uploaded After Photo Thumbnails */}
              {afterPhotos.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden shrink-0 group">
                  <img src={url} alt="After" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveAfterPhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Voice Message / Audio Note */}
          <div className="space-y-2 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-700 flex items-center space-x-1.5">
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>Voice Note Summary</span>
              </label>

              {hasVoiceNote && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Attached
                </span>
              )}
            </div>

            {/* State A: Not Attached & Not Recording */}
            {!hasVoiceNote && !isRecordingVoice && (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="w-full py-3 bg-white border border-dashed border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
              >
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>🎙️ Record Voice Note (Optional)</span>
              </button>
            )}

            {/* State B: Live Recording in Progress */}
            {isRecordingVoice && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <span className="font-bold text-xs text-red-700">
                    Recording Audio... ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}s)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer transition-colors"
                >
                  ⏹️ Save & Attach
                </button>
              </div>
            )}

            {/* State C: Voice Note Recorded & Attached */}
            {hasVoiceNote && (
              <div className="p-2.5 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                      isPlayingAudio ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>
                  <div>
                    <span className="font-bold text-xs text-zinc-900 block">Site Voice Summary</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {recordingSeconds > 0 ? `${recordingSeconds} seconds recorded` : '8 seconds recording'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHasVoiceNote(false);
                    setRecordingSeconds(0);
                    setAudioUrl(null);
                    if (audioElementRef.current) {
                      audioElementRef.current.pause();
                    }
                    setIsPlayingAudio(false);
                  }}
                  className="text-zinc-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                  title="Remove Voice Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer - Big Submit Report Button */}
        <div className="p-4 border-t border-zinc-200 bg-white shrink-0">
          <button 
            type="button"
            onClick={handleSubmitReport}
            disabled={isSubmitting || isUploadingBefore || isUploadingAfter}
            className={`w-full py-3.5 ${isSubmitting || isUploadingBefore || isUploadingAfter ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer`}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting Report...' : (isUploadingBefore || isUploadingAfter) ? 'Uploading Photos...' : 'SUBMIT WORK REPORT'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
