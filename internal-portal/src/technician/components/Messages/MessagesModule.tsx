import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Send, Users, ShieldAlert, Phone, ChevronLeft, Loader2, MessageSquare,
  PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Plus, Paperclip, Image as ImageIcon, FileText, X
} from 'lucide-react';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { toneGenerator } from '../../../utils/ToneGenerator';
import CreateGroupModal from './CreateGroupModal';

const API_BASE = (() => {
  let url = import.meta.env.VITE_API_URL || 'https://43.204.218.193.sslip.io';
  return url.replace(/\/$/, '');
})();

const makeRoomId = (a: string, b: string) => [a, b].sort().join('_');

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isAvailable?: boolean;
  isGroup?: boolean;
}

const roleBadgeColor = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'HR': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'TECHNICIAN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const roleColor = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'from-blue-500 to-indigo-600';
    case 'HR': return 'from-purple-500 to-pink-600';
    case 'TECHNICIAN': return 'from-emerald-500 to-teal-600';
    default: return 'from-slate-400 to-slate-600';
  }
};

const getInitials = (name: string) => name?.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Call Overlay Component ───────────────────────────────────────────────────
function CallOverlay({ callState, localVideoRef, remoteVideoRef, contact, onEndCall, onAccept, onReject, isMuted, isVideoOff, onToggleMute, onToggleVideo, callWithVideo, isSpeakerOn, onToggleSpeaker }: any) {
  const isIncoming = callState === 'incoming';
  const isOutgoing = callState === 'outgoing';
  const isActive   = callState === 'active';
  const [callDuration, setCallDuration] = React.useState(0);

  React.useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md">
      <div className="relative w-full h-full md:h-auto md:max-w-md md:mx-4 bg-slate-800 md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:min-h-[65vh]">

        {isActive && callWithVideo ? (
          <>
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-0">
               <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
               <span className="text-slate-400 font-medium tracking-wide animate-pulse text-lg">Connecting video...</span>
            </div>
            <div ref={remoteVideoRef} className="absolute inset-0 z-10 [&>div]:!h-full [&>div]:!w-full [&_video]:!object-cover" />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12 relative z-10">
            <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${roleColor(contact?.role)} flex items-center justify-center text-white text-5xl font-black shadow-2xl ${isActive ? 'animate-pulse' : ''} border-4 border-slate-700 ring-8 ring-slate-800`}>
              {contact?.avatar ? <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full object-cover" /> : getInitials(contact?.name || '')}
            </div>
            <div className="text-center">
              <h3 className="text-white text-3xl font-black tracking-tight">{contact?.name}</h3>
              <p className="text-slate-400 text-base font-medium mt-2">
                {isIncoming ? (callWithVideo ? '🎥 Incoming video call...' : '📞 Incoming audio call...') : isOutgoing ? '📡 Calling...' : formatTime(callDuration)}
              </p>
            </div>
          </div>
        )}

        {isActive && callWithVideo && (
          <div ref={localVideoRef} className="absolute top-6 right-6 w-28 h-40 rounded-2xl overflow-hidden bg-slate-700 border-2 border-slate-500 shadow-xl z-20 [&>div]:!h-full [&>div]:!w-full [&_video]:!object-cover" />
        )}

        <div className="relative z-20 flex flex-col items-center justify-end pb-12 px-6 mt-auto">
          {isIncoming && (
            <div className="w-full flex justify-between items-center px-4 max-w-[280px]">
              <div className="flex flex-col items-center gap-2">
                <button onClick={onReject} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-95">
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-slate-400 text-xs font-semibold">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => onAccept(false)} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95">
                  <Phone className="w-7 h-7" />
                </button>
                <span className="text-slate-400 text-xs font-semibold">Audio</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => onAccept(true)} className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all active:scale-95">
                  <Video className="w-7 h-7" />
                </button>
                <span className="text-slate-400 text-xs font-semibold">Video</span>
              </div>
            </div>
          )}

          {isOutgoing && (
            <button onClick={onEndCall} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all active:scale-95 animate-pulse mt-4">
              <PhoneOff className="w-8 h-8" />
            </button>
          )}

          {isActive && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold tracking-wide">
                {isSpeakerOn ? '🔊 Speaker' : '🔇 Earpiece'}
              </span>
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-[2rem] backdrop-blur-md border border-slate-700/50">
              <button onClick={onToggleSpeaker} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isSpeakerOn ? 'bg-white text-slate-900' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}>
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>
              <button onClick={onToggleMute} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}>
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button onClick={onEndCall} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </button>
              {callWithVideo && (
                <button onClick={onToggleVideo} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isVideoOff ? 'bg-white text-slate-900' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}>
                  {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export const MessagesModule: React.FC = () => {
  const myId = localStorage.getItem('user_id') || '';
  const myName = localStorage.getItem('user_name') || 'Technician';
  const myRole = 'TECHNICIAN';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Call state
  const [callState, setCallState] = useState<string | null>(null);
  const [callContact, setCallContact] = useState<any>(null);
  const [callWithVideo, setCallWithVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const agoraClient = useRef<any>(null);
  const localTracks = useRef<{ audio: any, video: any }>({ audio: null, video: null });
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const loadContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    const mapUser = (u: any): Contact => ({
      _id: String(u._id || u.id || ''),
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: (u.role || 'TECHNICIAN').toUpperCase(),
      avatar: u.avatar || '',
      isAvailable: u.isAvailable !== false,
    });

    try {
      let allUsers: Contact[] = [];
      try {
        const res = await fetch(`${API_BASE}/api/auth/employees`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) allUsers = data.data.map(mapUser);
        }
      } catch (_) {}

      if (allUsers.length === 0) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/technicians`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) allUsers = data.data.map(mapUser);
        } catch (_) {}
      }

      const myNameLower = myName?.toLowerCase().trim();
      const users = allUsers.filter(c => c.name?.toLowerCase().trim() !== myNameLower);

      let groupContacts: Contact[] = [];
      try {
        if (myId) {
          const gRes = await fetch(`${API_BASE}/api/groups/${myId}`);
          const gData = await gRes.json();
          if (gData.success && Array.isArray(gData.data)) {
            groupContacts = gData.data.map((g: any) => ({
              _id: g._id,
              name: g.name,
              role: 'GROUP',
              avatar: g.avatar || '',
              isAvailable: true,
              isGroup: true
            }));
          }
        }
      } catch (_) {}

      setContacts([...groupContacts, ...users]);
    } catch (e) {
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [myName]);

  const loadUnreadCounts = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/unread-counts/${myId}`);
      const data = await res.json();
      if (data.success) setUnreadCounts(data.data);
    } catch (_) {}
  }, [myId]);

  const loadMessages = useCallback(async (contact: Contact) => {
    setIsLoadingMessages(true);
    setMessages([]);
    try {
      const roomId = contact.isGroup ? contact._id : makeRoomId(myId, contact._id);
      const res = await fetch(`${API_BASE}/api/messages/${roomId}?myId=${myId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[roomId];
          return updated;
        });
      }
    } catch (e) {
    } finally {
      setIsLoadingMessages(false);
    }
  }, [myId]);

  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (myId) socket.emit('join_user', myId);
      socket.emit('join_role', myRole);
    });

    socket.on('message:new', (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      setActiveContact(active => {
        const expectedRoomId = active?.isGroup ? active._id : (active ? makeRoomId(myId, active._id) : null);
        if (!active || expectedRoomId !== msg.roomId) {
          setUnreadCounts(counts => ({ ...counts, [msg.roomId]: (counts[msg.roomId] || 0) + 1 }));
        }
        return active;
      });
    });

    // Call events
    socket.on('call:incoming', (data) => {
      if (data.to === myId) {
        setIncomingCallData(data);
        setCallContact({ _id: data.from, name: data.fromName, role: data.fromRole });
        setCallWithVideo(data.withVideo || false);
        setCallState('incoming');
        toneGenerator.playIncomingRing();
      }
    });

    socket.on('call:accepted', (data) => {
      if (data.to === myId) {
        toneGenerator.stop();
        setCallState('active');
      }
    });

    socket.on('call:cancelled', (data) => {
      if (data.to === myId && callState === 'incoming') endCallCleanup();
    });
    socket.on('call:rejected', (data) => {
      if (data.to === myId) endCallCleanup();
    });
    socket.on('call:ended', (data) => {
      if (data.to === myId) endCallCleanup();
    });

    return () => { socket.disconnect(); };
  }, [myId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { loadContacts(); loadUnreadCounts(); }, [loadContacts, loadUnreadCounts]);

  const handleSelectContact = (contact: Contact) => {
    setActiveContact(contact);
    loadMessages(contact);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact || isSending || !myId) return;

    setIsSending(true);
    const roomId = activeContact.isGroup ? activeContact._id : makeRoomId(myId, activeContact._id);
    const optimisticMsg = {
      senderId: myId, senderName: myName, senderRole: myRole,
      recipientId: activeContact._id, recipientName: activeContact.name,
      roomId: roomId,
      text: messageText.trim(), readBy: [myId], createdAt: new Date().toISOString(),
      isGroupMessage: !!activeContact.isGroup
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setMessageText('');

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticMsg)
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m === optimisticMsg ? data.data : m));
      }
    } catch (e) {
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachMenuClick = (type: 'image' | 'document') => {
    setAttachmentType(type);
    setShowAttachMenu(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact || !myId || !attachmentType) return;
    setIsSending(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'chat');
    try {
      const uploadRes = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        const roomId = activeContact.isGroup ? activeContact._id : makeRoomId(myId, activeContact._id);
        const msgData = {
          senderId: myId, senderName: myName, senderRole: myRole,
          recipientId: activeContact._id, recipientName: activeContact.name,
          roomId: roomId,
          attachmentUrl: uploadData.url, attachmentType,
          readBy: [myId], createdAt: new Date().toISOString(),
          isGroupMessage: !!activeContact.isGroup
        };
        const res = await fetch(`${API_BASE}/api/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData)
        });
        const data = await res.json();
        if (data.success) {
          setMessages(prev => [...prev, data.data]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAttachmentType(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'chat');
        setIsSending(true);
        try {
          const uploadRes = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          if (uploadData.success && activeContact) {
            const roomId = activeContact.isGroup ? activeContact._id : makeRoomId(myId, activeContact._id);
            const msgData = {
              senderId: myId, senderName: myName, senderRole: myRole,
              recipientId: activeContact._id, recipientName: activeContact.name,
              roomId: roomId,
              attachmentUrl: uploadData.url, attachmentType: 'audio',
              readBy: [myId], createdAt: new Date().toISOString(),
              isGroupMessage: !!activeContact.isGroup
            };
            const res = await fetch(`${API_BASE}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msgData) });
            const data = await res.json();
            if (data.success) setMessages(prev => [...prev, data.data]);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSending(false);
        }
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // ── Agora Methods ────────────────────────────────────────────────────────
  const getAgoraToken = async (channel: string) => {
    const uid = Math.floor(Math.random() * 100000);
    const res = await fetch(`${API_BASE}/api/agora/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName: channel, uid })
    });
    const data = await res.json();
    return { token: data.token, appId: data.appId, uid };
  };

  const joinAgoraChannel = async (channel: string, withVideo: boolean, isCaller: boolean = false) => {
    try {
      const { token, appId, uid } = await getAgoraToken(channel);
      agoraClient.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      agoraClient.current.on('user-published', async (user: any, mediaType: string) => {
        await agoraClient.current.subscribe(user, mediaType);
        if (mediaType === 'audio' && user.audioTrack) user.audioTrack.play();
        if (mediaType === 'video' && user.videoTrack && remoteVideoRef.current) {
          user.videoTrack.play(remoteVideoRef.current);
        }
      });

      await agoraClient.current.join(appId, channel, token, uid);
      localTracks.current.audio = await AgoraRTC.createMicrophoneAudioTrack();
      await agoraClient.current.publish([localTracks.current.audio]);

      if (withVideo) {
        localTracks.current.video = await AgoraRTC.createCameraVideoTrack();
        if (localVideoRef.current) localTracks.current.video.play(localVideoRef.current);
        await agoraClient.current.publish([localTracks.current.video]);
      }
      
      if (!isCaller) {
        setCallState('active');
        toneGenerator.stop();
      }
    } catch (err: any) {
      alert('Call failed: ' + (err.message || 'Check microphone/camera permissions'));
      console.error(err);
      endCall();
    }
  };

  const endCallCleanup = async () => {
    toneGenerator.stop();
    if (localTracks.current.audio) { localTracks.current.audio.stop(); localTracks.current.audio.close(); localTracks.current.audio = null; }
    if (localTracks.current.video) { localTracks.current.video.stop(); localTracks.current.video.close(); localTracks.current.video = null; }
    if (agoraClient.current) { try { await agoraClient.current.leave(); } catch (_) {} agoraClient.current = null; }
    setCallState(null); setCallContact(null); setIncomingCallData(null); setIsMuted(false); setIsVideoOff(false);
  };

  const startCall = async (contact: Contact, withVideo = false) => {
    if (!contact?._id) return;
    const channel = `c_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setCallContact(contact); setCallWithVideo(withVideo); setCallState('outgoing');
    toneGenerator.playOutgoingRing();
    socketRef.current?.emit('call:initiate', { from: myId, fromName: myName, fromRole: myRole, to: contact._id, channel, withVideo, isGroup: !!contact.isGroup });
    await joinAgoraChannel(channel, withVideo, true);
  };

  const acceptCall = async (withVideo: boolean) => {
    if (!incomingCallData) return;
    socketRef.current?.emit('call:accepted', { from: myId, to: incomingCallData.from });
    await joinAgoraChannel(incomingCallData.channel, withVideo, false);
  };

  const rejectCall = () => {
    if (incomingCallData) socketRef.current?.emit('call:rejected', { from: myId, to: incomingCallData.from });
    endCallCleanup();
  };

  const endCall = async () => {
    const target = callContact?._id || incomingCallData?.from;
    if (target) socketRef.current?.emit('call:ended', { from: myId, to: target });
    await endCallCleanup();
  };

  const toggleMute = () => {
    if (localTracks.current.audio) {
      const muted = !isMuted;
      localTracks.current.audio.setEnabled(!muted);
      setIsMuted(muted);
    }
  };

  const toggleVideo = () => {
    if (localTracks.current.video) {
      const off = !isVideoOff;
      localTracks.current.video.setEnabled(!off);
      setIsVideoOff(off);
    }
  };

  const toggleSpeaker = async () => {
    const newSpeakerOn = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerOn);
    try {
      const audioElements = document.querySelectorAll('audio, video');
      for (const el of audioElements as any) {
        if (typeof el.setSinkId === 'function') {
          await el.setSinkId(newSpeakerOn ? '' : 'communications').catch(() => {});
        } else {
          el.volume = newSpeakerOn ? 1 : 0;
        }
      }
      if (remoteVideoRef.current) {
        const els = remoteVideoRef.current.querySelectorAll('audio, video');
        for (const el of els as any) {
          if (typeof el.setSinkId === 'function') {
            await el.setSinkId(newSpeakerOn ? '' : 'communications').catch(() => {});
          } else {
            el.volume = newSpeakerOn ? 1 : 0;
          }
        }
      }
    } catch (err) {
      console.warn('Speaker toggle error:', err);
    }
  };

  const handleGroupCreated = (group: any) => {
    const newGroupContact: Contact = {
      _id: group._id,
      name: group.name,
      role: 'GROUP',
      avatar: group.avatar || '',
      isAvailable: true,
      isGroup: true
    };
    setContacts(prev => [newGroupContact, ...prev]);
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const groupedMessages: { date: string, msgs: any[] }[] = [];
  let currentDate: string | null = null;
  messages.forEach(msg => {
    const dateStr = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (dateStr !== currentDate) { groupedMessages.push({ date: dateStr, msgs: [] }); currentDate = dateStr; }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  });

  return (
    <>
      {callState && (
        <CallOverlay callState={callState} contact={callContact} localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef}
          isMuted={isMuted} isVideoOff={isVideoOff} isSpeakerOn={isSpeakerOn}
          onEndCall={endCall} onAccept={acceptCall} onReject={rejectCall}
          onToggleMute={toggleMute} onToggleVideo={toggleVideo} onToggleSpeaker={toggleSpeaker}
          callWithVideo={callWithVideo} />
      )}
      <div className="flex h-full w-full bg-white overflow-hidden">
        
        {/* CONTACTS LIST */}
        <div className={`w-full md:w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col ${activeContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200 space-y-3 shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" /> Team Messages
              </h2>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnread}</span>}
                <button onClick={() => setIsGroupModalOpen(true)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full" title="New Group"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by name, role..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {isLoadingContacts ? (
              <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center p-6 text-slate-500 text-sm font-medium">No contacts found</div>
            ) : (
              filteredContacts.map(contact => {
                const roomId = contact.isGroup ? contact._id : makeRoomId(myId, contact._id);
                const unread = unreadCounts[roomId] || 0;
                const isActive = activeContact?._id === contact._id;
                return (
                  <button key={contact._id} onClick={() => handleSelectContact(contact)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-200/50 hover:bg-slate-100 ${isActive ? 'bg-white shadow-sm border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                    <div className="relative shrink-0">
                      {contact.avatar ? <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover shadow-sm" /> : <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColor(contact.role)} flex items-center justify-center text-white font-bold text-sm`}>{getInitials(contact.name)}</div>}
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${contact.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <h4 className={`text-sm truncate ${unread > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{contact.name}</h4>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border w-max ${roleBadgeColor(contact.role)}`}>{contact.role}</span>
                    </div>
                    {unread > 0 && <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        {activeContact ? (
          <div className="fixed inset-0 z-[100] md:static md:z-auto md:flex-1 flex flex-col min-w-0 bg-white w-full h-[100dvh] md:h-auto md:w-auto">
            <div className="h-16 border-b border-slate-200 bg-[#f0f2f5] flex items-center justify-between px-3 md:px-4 shrink-0">
              <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
                <button onClick={() => setActiveContact(null)} className="md:hidden p-1 -ml-1 text-slate-600 hover:text-slate-900"><ChevronLeft className="w-6 h-6" /></button>
                {activeContact.avatar ? <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover" /> : <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColor(activeContact.role)} flex items-center justify-center text-white font-bold text-sm`}>{getInitials(activeContact.name)}</div>}
                <div className="ml-1 md:ml-0">
                  <h3 className="text-[15px] font-semibold text-[#111b21] flex items-center gap-1.5">{activeContact.name}</h3>
                  <div className="text-[13px] text-[#667781] font-medium leading-tight mt-0.5">
                    {activeContact.role} • {activeContact.isAvailable ? <span className="text-emerald-600 font-semibold">Online</span> : <span>offline</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[#54656f]">
                <button onClick={() => startCall(activeContact, true)} className="hover:text-slate-800 transition-colors"><Video className="w-[22px] h-[22px]" /></button>
                <button onClick={() => startCall(activeContact, false)} className="hover:text-slate-800 transition-colors"><Phone className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-[#efeae2]">
              {isLoadingMessages ? <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              : groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm"><MessageSquare className="w-7 h-7 text-slate-300" /></div>
                  <div className="text-center"><p className="text-sm font-semibold text-slate-600">No messages yet</p><p className="text-xs text-slate-400 mt-1">Send a message to start the conversation</p></div>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date} className="space-y-2">
                    <div className="text-center my-3">
                      <span className="text-[10px] font-bold text-slate-500 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm inline-block">{group.date}</span>
                    </div>
                    <div className="space-y-1">
                      {group.msgs.map((msg, i) => {
                        const isMe = msg.senderId === myId;
                        return (
                          <div key={msg._id || i} className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${roleColor(activeContact.role)} flex items-center justify-center text-white font-bold text-[9px] shrink-0 shadow-sm`}>{getInitials(activeContact.name)}</div>}
                            <div className={`relative max-w-[75%] sm:max-w-md px-3 pt-2 pb-5 text-[15px] shadow-sm leading-relaxed ${isMe ? 'bg-blue-500 text-white rounded-2xl rounded-br-sm' : 'bg-white text-slate-800 rounded-2xl rounded-bl-sm'}`}>
                              {msg.text && <span className="break-words">{msg.text}</span>}
                              {msg.attachmentUrl && (
                                <div className="mt-1">
                                  {msg.attachmentType === 'image' ? (
                                    <img src={msg.attachmentUrl} alt="attachment" className="rounded-xl max-w-full max-h-64 object-contain cursor-pointer" onClick={() => window.open(msg.attachmentUrl, '_blank')} />
                                  ) : msg.attachmentType === 'document' ? (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded-lg hover:bg-black/20 transition-colors text-white">
                                      <FileText className="w-6 h-6 shrink-0" />
                                      <span className="text-sm font-medium underline truncate">Document</span>
                                    </a>
                                  ) : msg.attachmentType === 'audio' ? (
                                    <audio controls src={msg.attachmentUrl} className="max-w-[200px] h-10" />
                                  ) : null}
                                </div>
                              )}
                              <span className={`absolute bottom-1 right-2.5 text-[9px] font-medium tracking-wide ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-2.5 bg-[#efeae2] shrink-0 relative">
              <div className="max-w-4xl mx-auto flex items-end gap-2 relative">
                {/* Attachment Menu Popup */}
                {showAttachMenu && (
                  <div className="absolute bottom-14 left-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex gap-4 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <button type="button" onClick={() => handleAttachMenuClick('document')} className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"><FileText className="w-5 h-5" /></div>
                      <span className="text-xs font-medium text-slate-600">Document</span>
                    </button>
                    <button type="button" onClick={() => handleAttachMenuClick('image')} className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"><ImageIcon className="w-5 h-5" /></div>
                      <span className="text-xs font-medium text-slate-600">Gallery</span>
                    </button>
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} className="hidden" accept={attachmentType === 'image' ? 'image/*' : '*/*'} onChange={handleFileChange} />

                <form onSubmit={handleSend} className="flex-1 bg-white rounded-3xl flex items-center shadow-sm">
                  <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-3 ml-1 rounded-full transition-colors ${showAttachMenu ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {showAttachMenu ? <X className="w-6 h-6" /> : <Paperclip className="w-6 h-6" />}
                  </button>
                  <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none py-3.5 px-2 text-[15px] focus:outline-none placeholder:text-slate-400" />
                </form>
                
                <div className="shrink-0 flex items-center">
                  {messageText.trim() ? (
                    <button onClick={handleSend} disabled={isSending} className="w-12 h-12 bg-[#00a884] hover:bg-[#029676] disabled:bg-emerald-300 text-white rounded-full flex items-center justify-center transition-all shadow-md">
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
                    </button>
                  ) : (
                    <button 
                      onClick={isRecording ? stopRecording : startRecording} 
                      className={`w-12 h-12 text-white rounded-full flex items-center justify-center transition-all shadow-md ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[#00a884] hover:bg-[#029676]'}`}>
                      {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 p-6">
            <div className="w-24 h-24 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm"><Users className="w-10 h-10 text-slate-300" /></div>
            <h3 className="text-xl font-black text-slate-700 mb-2">Team Messages</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">Select a team member from the list to start chatting or make a call.</p>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        contacts={contacts.filter(c => !c.isGroup)}
        myId={myId}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};
