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
  FileText,
  Upload,
  Image as ImageIcon
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
  onJobUpdated?: (updated: Job) => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateStatus,
  onUploadPhoto,
  onCompleteJob,
  onJobUpdated,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [taskDescription, setTaskDescription] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'Completed' | 'In Progress'>('In Progress');
  const [inspectionComments, setInspectionComments] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // File input refs for Direct Mobile Camera vs Gallery Selection
  const beforeCameraInputRef = React.useRef<HTMLInputElement>(null);
  const beforeGalleryInputRef = React.useRef<HTMLInputElement>(null);
  const afterCameraInputRef = React.useRef<HTMLInputElement>(null);
  const afterGalleryInputRef = React.useRef<HTMLInputElement>(null);
  
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

  // Initialize or update form inputs when modal opens or when job ID changes
  React.useEffect(() => {
    if (isOpen && job) {
      setTaskDescription(job.workProgress?.taskDescription || job.taskDescription || job.fieldNotes || '');
      setInspectionComments(job.workProgress?.inspectionComments || job.inspectionComments || job.inspection?.notes || '');
      
      const rawBefore = (job.workProgress?.beforeWorkPhotos && job.workProgress.beforeWorkPhotos.length > 0)
        ? job.workProgress.beforeWorkPhotos
        : (job.beforePhotos || []);
      const bUrls = rawBefore
        .map((p: any) => (typeof p === 'string' ? p : (p?.url || p?.imageUrl || '')))
        .filter((u: string) => typeof u === 'string' && u.trim().length > 0);
      const uniqueBefore = Array.from(new Set(bUrls));
      setBeforePhotos(uniqueBefore);

      const aUrls = (job.afterPhotos || [])
        .map((p: any) => (typeof p === 'string' ? p : (p?.url || p?.imageUrl || '')))
        .filter((u: string) => typeof u === 'string' && u.trim().length > 0);
      const uniqueAfter = Array.from(new Set(aUrls));
      setAfterPhotos(uniqueAfter);

      // If Before Photos are already saved in DB, start directly on Step 2 (After Photos)
      if (uniqueBefore.length > 0) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
        // Fallback: Check if report has already saved Before Photos for this jobCode
        const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
        fetch(`${baseUrl}/api/reports?t=${Date.now()}`)
          .then(r => r.json())
          .then(reports => {
            if (!Array.isArray(reports)) return;
            const cleanCode = (job.jobCode || '').replace(/^#/, '').trim().toUpperCase();
            const rep = reports.find((r: any) => {
              const rCode = (r.jobCode || '').replace(/^#/, '').trim().toUpperCase();
              return (cleanCode && rCode === cleanCode) || (r.jobId && (r.jobId === job.id || r.jobId === (job as any)._id));
            });
            if (rep && Array.isArray(rep.beforePhotos) && rep.beforePhotos.length > 0) {
              const repBeforeUrls = rep.beforePhotos.filter((u: any) => typeof u === 'string' && u.startsWith('http'));
              if (repBeforeUrls.length > 0) {
                setBeforePhotos(Array.from(new Set(repBeforeUrls)));
                setCurrentStep(2);
              }
            }
            if (rep && Array.isArray(rep.afterPhotos) && rep.afterPhotos.length > 0 && uniqueAfter.length === 0) {
              const repAfterUrls = rep.afterPhotos.filter((u: any) => typeof u === 'string' && u.startsWith('http'));
              if (repAfterUrls.length > 0) {
                setAfterPhotos(Array.from(new Set(repAfterUrls)));
              }
            }
            if (rep && rep.workDescription && !taskDescription) {
              setTaskDescription(rep.workDescription);
            }
          })
          .catch(() => {});
      }

      setHasVoiceNote(Boolean(job.hasVoiceNote || job.voiceNoteUrl));
      setAudioUrl(job.voiceNoteUrl || null);
      setCompletionStatus(job.status === 'COMPLETED' ? 'Completed' : 'In Progress');
      setUploadError(null);
      setSaveSuccessMsg(null);
    }
  }, [isOpen, job?.id]);

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
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            setAudioUrl(base64Audio);
            setHasVoiceNote(true);
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
      } else {
        setIsRecordingVoice(true);
        setHasVoiceNote(true);
      }
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      setIsRecordingVoice(true);
      setHasVoiceNote(true);
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
    setUploadError(null);
    setSaveSuccessMsg(null);
    const newlyAdded: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const imgUrl = await JobsApiService.uploadImageToS3(file);
        if (!imgUrl || typeof imgUrl !== 'string' || (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:image'))) {
          throw new Error(`Upload returned invalid URL for ${file.name}`);
        }
        newlyAdded.push(imgUrl);
        setBeforePhotos((prev) => Array.from(new Set([...prev, imgUrl])));
      } catch (err: any) {
        console.error('Before photo upload error:', err);
        setUploadError(`Failed to upload photo "${file.name}". Please check your internet connection and try again.`);
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
    setUploadError(null);
    for (const file of Array.from(files)) {
      try {
        const imgUrl = await JobsApiService.uploadImageToS3(file);
        if (!imgUrl || typeof imgUrl !== 'string' || (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:image'))) {
          throw new Error(`Upload returned invalid URL for ${file.name}`);
        }
        setAfterPhotos((prev) => Array.from(new Set([...prev, imgUrl])));
      } catch (err: any) {
        console.error('After photo upload error:', err);
        setUploadError(`Failed to upload photo "${file.name}". Please try again.`);
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

  const handleSaveStep1 = async (advanceToStep2: boolean) => {
    if (isSubmitting || isUploadingBefore) return;
    setIsSubmitting(true);
    setUploadError(null);
    setSaveSuccessMsg(null);

    try {
      const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';
      const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || 'TECH-01';
      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';

      const formattedBefore = beforePhotos.map((url, i) => ({
        id: `PHO-BEFORE-${i}-${Date.now()}`,
        url: url,
        caption: 'Before Work Site Condition',
        uploadedAt: new Date().toLocaleTimeString()
      }));

      // 1. Save progress in backend Job
      const updatedJob = await JobsApiService.saveJobProgress(job.id, {
        taskDescription: taskDescription.trim(),
        inspectionComments: inspectionComments.trim(),
        beforePhotos: formattedBefore,
        technicianId: techId,
        technicianName: techName,
        voiceNoteUrl: hasVoiceNote ? (audioUrl || '') : '',
        hasVoiceNote: Boolean(hasVoiceNote)
      });

      // 2. Sync to /api/reports so Admin Reports immediately shows Before Photos
      await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          technicianName: techName,
          date: new Date().toISOString().split('T')[0],
          activityType: job.title || 'Customer Job',
          workDescription: taskDescription.trim() || 'Work started on site. Before photos uploaded.',
          hoursWorked: 8,
          status: 'PRESENT',
          jobId: job.id,
          jobCode: job.jobCode,
          customerName: job.customer?.name || '',
          location: job.customer?.city || job.customer?.address || '',
          beforePhotos: beforePhotos,
          afterPhotos: afterPhotos,
        })
      }).catch(err => console.warn('POST /api/reports error:', err));

      if (onJobUpdated) onJobUpdated(updatedJob);
      if (onUpdateStatus) onUpdateStatus(job.id, 'IN_PROGRESS');
      window.dispatchEvent(new Event('report_submitted'));

      if (advanceToStep2) {
        setSaveSuccessMsg('✓ Before photos saved! Proceeding to Step 2...');
        setTimeout(() => {
          setIsSubmitting(false);
          setSaveSuccessMsg(null);
          setCurrentStep(2);
        }, 600);
      } else {
        setSaveSuccessMsg('✓ Progress saved successfully!');
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 700);
      }
    } catch (err: any) {
      console.error('Save Step 1 error:', err);
      setUploadError(err.message || 'Unable to save before photos. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSubmitFinalReport = async (saveOnly = false) => {
    if (isSubmitting || isUploadingAfter) return;
    setIsSubmitting(true);
    setUploadError(null);
    setSaveSuccessMsg(null);

    try {
      const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';
      const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || 'TECH-01';
      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';

      const finalVoiceUrl = hasVoiceNote ? (audioUrl || 'recorded-audio-memo') : '';
      const finalHasVoice = Boolean(hasVoiceNote);

      if (saveOnly || completionStatus === 'In Progress') {
        const formattedBefore = beforePhotos.map((url, i) => ({
          id: `PHO-BEFORE-${i}-${Date.now()}`,
          url: url,
          caption: 'Before Work Site Condition',
          uploadedAt: new Date().toLocaleTimeString()
        }));

        const updatedJob = await JobsApiService.saveJobProgress(job.id, {
          taskDescription: taskDescription.trim(),
          inspectionComments: inspectionComments.trim(),
          beforePhotos: formattedBefore,
          technicianId: techId,
          technicianName: techName,
          voiceNoteUrl: finalVoiceUrl,
          hasVoiceNote: finalHasVoice
        });

        await fetch(`${baseUrl}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicianId: techId,
            technicianName: techName,
            date: new Date().toISOString().split('T')[0],
            activityType: job.title || 'Customer Job',
            workDescription: inspectionComments.trim() || taskDescription.trim() || 'Work in progress.',
            hoursWorked: 8,
            status: 'PRESENT',
            jobId: job.id,
            jobCode: job.jobCode,
            customerName: job.customer?.name || '',
            location: job.customer?.city || job.customer?.address || '',
            beforePhotos: beforePhotos,
            afterPhotos: afterPhotos,
            voiceNoteUrl: finalVoiceUrl,
            hasVoiceNote: finalHasVoice
          })
        }).catch(err => console.warn('POST /api/reports error:', err));

        if (onJobUpdated) onJobUpdated(updatedJob);
        if (onUpdateStatus) onUpdateStatus(job.id, 'IN_PROGRESS');

        window.dispatchEvent(new Event('report_submitted'));
        setSaveSuccessMsg('Progress saved successfully');
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 700);
        return;
      }

      // Complete work report submission flow
      const summaryText = inspectionComments?.trim() || taskDescription?.trim() || 'Work completed and verified on site.';

      const reportPromise = fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          technicianName: techName,
          date: new Date().toISOString().split('T')[0],
          activityType: job.title || 'Customer Job',
          workDescription: summaryText,
          hoursWorked: 8,
          status: 'PRESENT',
          jobId: job.id,
          jobCode: job.jobCode,
          customerName: job.customer?.name || '',
          location: job.customer?.city || job.customer?.address || '',
          beforePhotos: beforePhotos,
          afterPhotos: afterPhotos,
          voiceNoteUrl: finalVoiceUrl,
          hasVoiceNote: finalHasVoice
        })
      }).catch(err => console.warn('POST /api/reports error:', err));

      const jobPromise = onCompleteJob(job.id, summaryText, undefined, finalVoiceUrl).catch(() => {});
      await Promise.all([reportPromise, jobPromise]);
      
      window.dispatchEvent(new Event('report_submitted'));
      setSaveSuccessMsg('Work report submitted successfully');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Submit report error:', err);
      setUploadError(err.message || 'Unable to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                {job.customer?.name || job.jobCode}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center ${
                job.status === 'COMPLETED' || job.status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                <span className="font-normal opacity-75 mr-1">Status:</span>
                <span>{job.status === 'COMPLETED' || job.status === 'VERIFIED' ? '✓ Completed' : '⏳ In Progress'}</span>
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

        {/* Step Indicator Bar */}
        <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              beforePhotos.length > 0
                ? 'bg-emerald-600 text-white'
                : currentStep === 1 ? 'bg-sky-600 text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {beforePhotos.length > 0 ? '✓' : '1'}
            </span>
            <span className="truncate">Step 1: Before Photos</span>
          </button>

          <div className="w-4 h-px bg-zinc-300 shrink-0" />

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              afterPhotos.length > 0
                ? 'bg-emerald-600 text-white'
                : currentStep === 2 ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {afterPhotos.length > 0 ? '✓' : '2'}
            </span>
            <span className="truncate">Step 2: After Photos</span>
          </button>
        </div>

        {/* Hidden Device Photo Upload Inputs */}
        {/* Step 1: Direct Rear Camera */}
        <input
          type="file"
          ref={beforeCameraInputRef}
          onChange={handleBeforeFileSelect}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        {/* Step 1: Device Gallery / Multiple Files */}
        <input
          type="file"
          ref={beforeGalleryInputRef}
          onChange={handleBeforeFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Step 2: Direct Rear Camera */}
        <input
          type="file"
          ref={afterCameraInputRef}
          onChange={handleAfterFileSelect}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        {/* Step 2: Device Gallery / Multiple Files */}
        <input
          type="file"
          ref={afterGalleryInputRef}
          onChange={handleAfterFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Form Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-zinc-800">
          
          {/* Status / Error Alerts */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between animate-fade-in">
              <span className="font-semibold">⚠️ {uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
            </div>
          )}
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveSuccessMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: BEFORE WORK PHOTOS ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-sky-900">
                <span className="font-bold block text-xs">📸 Step 1: Initial Site Evidence</span>
                <span className="text-[11px] text-sky-700 font-medium">
                  Capture and upload photos of the site/cables before starting work.
                </span>
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 block">
                  Task Description <span className="text-zinc-400 font-normal italic">- Optional</span>
                </label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="E.g. Remove old cameras and start wiring"
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                />
              </div>

              {/* Before Work Photos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-700 block">
                    Before Work Photos <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {beforePhotos.length} photo{beforePhotos.length !== 1 ? 's' : ''} uploaded
                  </span>
                </div>
                
                <div className="flex items-center space-x-2.5 overflow-x-auto pb-1">
                  {/* Take Photo with Camera Button */}
                  <button
                    type="button"
                    onClick={() => beforeCameraInputRef.current?.click()}
                    disabled={isUploadingBefore}
                    className="w-24 h-20 rounded-xl border-2 border-dashed border-sky-400 bg-sky-50/70 hover:bg-sky-100 text-sky-700 flex flex-col items-center justify-center space-y-1 shrink-0 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
                    title="Open Camera"
                  >
                    {isUploadingBefore ? (
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-sky-900 leading-none">Take Photo</span>
                        <span className="text-[8px] font-bold text-sky-600 uppercase tracking-wider">Camera</span>
                      </>
                    )}
                  </button>

                  {/* Pick from Gallery Button */}
                  <button
                    type="button"
                    onClick={() => beforeGalleryInputRef.current?.click()}
                    disabled={isUploadingBefore}
                    className="w-24 h-20 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 flex flex-col items-center justify-center space-y-1 shrink-0 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Select from Gallery"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-800 leading-none">Browse</span>
                    <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider">Gallery</span>
                  </button>

                  {/* Thumbnails */}
                  {beforePhotos.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden shrink-0 group shadow-xs">
                      <img src={url} alt="Before" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveBeforePhoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {beforePhotos.length === 0 && (
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Tap <strong className="text-sky-700">"Take Photo"</strong> to open camera directly, or <strong className="text-zinc-700">"Browse"</strong> to pick from gallery.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: AFTER WORK & COMPLETION ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step 1 Completion Summary Card */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      Step 1 Completed ({beforePhotos.length} Before Photo{beforePhotos.length !== 1 ? 's' : ''})
                    </span>
                    <span className="text-[10px] text-emerald-700">Initial site condition recorded.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer shrink-0"
                >
                  View / Edit
                </button>
              </div>

              {/* Photos After Completion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-700 block">
                    Photos After Completion <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {afterPhotos.length} photo{afterPhotos.length !== 1 ? 's' : ''} uploaded
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 overflow-x-auto pb-1">
                  {/* Take Photo with Camera Button */}
                  <button
                    type="button"
                    onClick={() => afterCameraInputRef.current?.click()}
                    disabled={isUploadingAfter}
                    className="w-24 h-20 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center space-y-1 shrink-0 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
                    title="Open Camera"
                  >
                    {isUploadingAfter ? (
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-900 leading-none">Take Photo</span>
                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Camera</span>
                      </>
                    )}
                  </button>

                  {/* Pick from Gallery Button */}
                  <button
                    type="button"
                    onClick={() => afterGalleryInputRef.current?.click()}
                    disabled={isUploadingAfter}
                    className="w-24 h-20 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 flex flex-col items-center justify-center space-y-1 shrink-0 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Select from Gallery"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-800 leading-none">Browse</span>
                    <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider">Gallery</span>
                  </button>

                  {/* Thumbnails */}
                  {afterPhotos.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden shrink-0 group shadow-xs">
                      <img src={url} alt="After" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAfterPhoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {afterPhotos.length === 0 && (
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Tap <strong className="text-emerald-700">"Take Photo"</strong> to open camera directly, or <strong className="text-zinc-700">"Browse"</strong> to pick from gallery.
                  </p>
                )}
              </div>

              {/* Inspection Comments / Work Done Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 block">
                  Inspection Comments / Work Done <span className="text-zinc-400 font-normal italic">- Optional</span>
                </label>
                <textarea
                  rows={3}
                  value={inspectionComments}
                  onChange={(e) => setInspectionComments(e.target.value)}
                  placeholder="E.g. Installed 4 cameras, testing live feed, all working perfectly."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* Task Completion Status Dropdown */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 block">Task Status</label>
                <select
                  value={completionStatus}
                  onChange={(e) => setCompletionStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Completed">✓ Completed (Ready for Admin Verification)</option>
                  <option value="In Progress">⏳ In Progress (Work continuing)</option>
                </select>
              </div>

              {/* Voice Note Summary */}
              <div className="space-y-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
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

                {!hasVoiceNote && !isRecordingVoice && (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="w-full py-2.5 bg-white border border-dashed border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>🎙️ Record Voice Note (Optional)</span>
                  </button>
                )}

                {isRecordingVoice && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <span className="font-bold text-xs text-red-700">
                        Recording... ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}s)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      ⏹️ Save
                    </button>
                  </div>
                )}

                {hasVoiceNote && (
                  <div className="p-2 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={togglePlayAudio}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                          isPlayingAudio ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isPlayingAudio ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                      </button>
                      <span className="font-bold text-xs text-zinc-900">Audio Note Attached</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setHasVoiceNote(false);
                        setRecordingSeconds(0);
                        setAudioUrl(null);
                        if (audioElementRef.current) audioElementRef.current.pause();
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
          )}

        </div>

        {/* Modal Footer - Step Specific Actions */}
        <div className="p-3.5 border-t border-zinc-200 bg-white shrink-0 space-y-2">
          {currentStep === 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveStep1(false)}
                disabled={isSubmitting || isUploadingBefore}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                Save & Close
              </button>

              <button
                type="button"
                onClick={() => handleSaveStep1(true)}
                disabled={isSubmitting || isUploadingBefore}
                className="flex-[2] py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>SAVE & PROCEED TO AFTER PHOTOS</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSubmitFinalReport(false)}
                disabled={isSubmitting || isUploadingAfter}
                className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isSubmitting ? 'bg-zinc-400' :
                  completionStatus === 'Completed' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                  'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : completionStatus === 'Completed' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ COMPLETE WORK & SUBMIT FINAL REPORT</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>SAVE PROGRESS & CLOSE</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                >
                  ◂ Back to Step 1 (Before Photos)
                </button>

                {completionStatus === 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleSubmitFinalReport(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                  >
                    Save As Draft (In Progress)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
