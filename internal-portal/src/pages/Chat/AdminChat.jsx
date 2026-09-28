import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiSearch, FiSend, FiUsers, FiShield, FiPhone, FiChevronLeft, 
  FiMessageSquare, FiLoader, FiPhoneOff, FiMic, FiMicOff, 
  FiVideo, FiVideoOff, FiPhoneIncoming
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';

const API_BASE = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'https://65.0.45.64.sslip.io';
})();

const makeRoomId = (a, b) => [a, b].sort().join('_');

const roleBadgeColor = (role) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'HR': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'TECHNICIAN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const roleColor = (role) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'from-blue-500 to-indigo-600';
    case 'HR': return 'from-purple-500 to-pink-600';
    case 'TECHNICIAN': return 'from-emerald-500 to-teal-600';
    default: return 'from-slate-400 to-slate-600';
  }
};

const getInitials = (name) => name?.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─── Call Overlay Component ───────────────────────────────────────────────────
function CallOverlay({ callState, localVideoRef, remoteVideoRef, contact, onEndCall, onAccept, onReject, isMuted, isVideoOff, onToggleMute, onToggleVideo }) {
  const isIncoming = callState === 'incoming';
  const isOutgoing = callState === 'outgoing';
  const isActive   = callState === 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl">

        {/* Remote video (full background when active) */}
        {isActive && (
          <div ref={remoteVideoRef} className="w-full h-80 bg-slate-900 flex items-center justify-center text-slate-500 text-sm">
            <span>Connecting video...</span>
          </div>
        )}

        {/* Contact info */}
        <div className={`flex flex-col items-center gap-3 py-8 px-6 ${isActive ? 'py-4' : 'py-10'}`}>
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${roleColor(contact?.role)} flex items-center justify-center text-white text-2xl font-black shadow-xl`}>
            {contact?.avatar
              ? <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full object-cover" />
              : getInitials(contact?.name || '')
            }
          </div>
          <div className="text-center">
            <h3 className="text-white text-xl font-black">{contact?.name}</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">
              {isIncoming ? '📞 Incoming call...' : isOutgoing ? '📡 Calling...' : '🔴 Live Call'}
            </p>
          </div>
        </div>

        {/* Local video (small PiP) */}
        {isActive && (
          <div ref={localVideoRef} className="absolute top-4 right-4 w-24 h-32 rounded-xl overflow-hidden bg-slate-700 border-2 border-slate-600 shadow-lg" />
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 pb-8 px-6">
          {isIncoming && (
            <>
              <button onClick={onReject}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-95">
                <FiPhoneOff className="w-6 h-6" />
              </button>
              <button onClick={() => onAccept(false)}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-95">
                <FiPhone className="w-6 h-6" />
              </button>
              <button onClick={() => onAccept(true)}
                className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-95">
                <FiVideo className="w-6 h-6" />
              </button>
            </>
          )}

          {isOutgoing && (
            <button onClick={onEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-95 animate-pulse">
              <FiPhoneOff className="w-7 h-7" />
            </button>
          )}

          {isActive && (
            <>
              <button onClick={onToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}>
                {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </button>
              <button onClick={onEndCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-95">
                <FiPhoneOff className="w-6 h-6" />
              </button>
              <button onClick={onToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}>
                {isVideoOff ? <FiVideoOff className="w-5 h-5" /> : <FiVideo className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>

        {/* Labels for incoming */}
        {isIncoming && (
          <div className="flex justify-center gap-8 pb-4 text-xs text-slate-400 font-medium">
            <span>Decline</span>
            <span>Audio</span>
            <span>Video</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminChat() {
  const myId   = localStorage.getItem('user_id') || 'admin_id';
  const myName = localStorage.getItem('user_name') || 'Admin User';
  const myRole = localStorage.getItem('internal_role') || 'ADMIN';

  const [contacts, setContacts]         = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [messageText, setMessageText]   = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isSending, setIsSending]       = useState(false);

  // ── Call State ────────────────────────────────────────────────────────────
  const [callState, setCallState]   = useState(null); // null | 'outgoing' | 'incoming' | 'active'
  const [callContact, setCallContact] = useState(null);
  const [callWithVideo, setCallWithVideo] = useState(false);
  const [isMuted, setIsMuted]       = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  const bottomRef    = useRef(null);
  const socketRef    = useRef(null);
  const agoraClient  = useRef(null);
  const localTracks  = useRef({ audio: null, video: null });
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const callChannelRef = useRef(null);

  // ── Contacts ──────────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    const mapUser = (u) => ({
      _id: String(u._id || u.id || ''),
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: (u.role || 'TECHNICIAN').toUpperCase(),
      avatar: u.avatar || '',
      isAvailable: u.isAvailable !== false,
    });
    try {
      let allUsers = [];
      try {
        const res = await fetch(`${API_BASE}/api/auth/employees`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0)
            allUsers = data.data.map(mapUser);
        }
      } catch (_) {}
      if (allUsers.length === 0) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/technicians`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data))
            allUsers = data.data.map(mapUser);
        } catch (_) {}
      }
      const myNameLower = myName?.toLowerCase().trim();
      setContacts(allUsers.filter(c => c.name?.toLowerCase().trim() !== myNameLower));
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

  const loadMessages = useCallback(async (contact) => {
    setIsLoadingMessages(true);
    setMessages([]);
    try {
      const roomId = makeRoomId(myId, contact._id);
      const res  = await fetch(`${API_BASE}/api/messages/${roomId}?myId=${myId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        setUnreadCounts(prev => { const u = { ...prev }; delete u[roomId]; return u; });
      }
    } catch (e) {} finally {
      setIsLoadingMessages(false);
    }
  }, [myId]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (myId) socket.emit('join_user', myId);
      if (myRole) socket.emit('join_role', myRole);
    });

    socket.on('message:new', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setActiveContact(active => {
        if (!active || makeRoomId(myId, active._id) !== msg.roomId) {
          setUnreadCounts(counts => ({ ...counts, [msg.roomId]: (counts[msg.roomId] || 0) + 1 }));
        }
        return active;
      });
    });

    // ── Incoming call signal from remote peer ──────────────────────────────
    socket.on('call:incoming', (data) => {
      // data = { from, fromName, fromRole, to, channel, withVideo }
      if (data.to === myId) {
        setIncomingCallData(data);
        setCallContact({ _id: data.from, name: data.fromName, role: data.fromRole });
        setCallWithVideo(data.withVideo || false);
        setCallState('incoming');
      }
    });

    socket.on('call:cancelled', (data) => {
      if (data.to === myId && callState === 'incoming') {
        endCallCleanup();
      }
    });

    socket.on('call:rejected', (data) => {
      if (data.to === myId) {
        endCallCleanup();
      }
    });

    socket.on('call:ended', (data) => {
      if (data.to === myId) {
        endCallCleanup();
      }
    });

    return () => { socket.disconnect(); };
  }, [myId, myRole]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { loadContacts(); loadUnreadCounts(); }, [loadContacts, loadUnreadCounts]);

  // ── Send Message ─────────────────────────────────────────────────────────
  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    loadMessages(contact);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact || isSending) return;
    setIsSending(true);
    const optimistic = {
      senderId: myId, senderName: myName, senderRole: myRole,
      recipientId: activeContact._id, recipientName: activeContact.name,
      roomId: makeRoomId(myId, activeContact._id),
      text: messageText.trim(), readBy: [myId], createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setMessageText('');
    try {
      const res  = await fetch(`${API_BASE}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(optimistic) });
      const data = await res.json();
      if (data.success) setMessages(prev => prev.map(m => m === optimistic ? data.data : m));
    } catch (e) {} finally { setIsSending(false); }
  };

  // ── Agora Helpers ─────────────────────────────────────────────────────────
  const getAgoraToken = async (channel) => {
    const uid = Math.floor(Math.random() * 100000);
    const res  = await fetch(`${API_BASE}/api/agora/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName: channel, uid })
    });
    const data = await res.json();
    return { token: data.token, appId: data.appId, uid };
  };

  const joinAgoraChannel = async (channel, withVideo) => {
    try {
      const { token, appId, uid } = await getAgoraToken(channel);
      callChannelRef.current = channel;

      agoraClient.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      agoraClient.current.on('user-published', async (user, mediaType) => {
        await agoraClient.current.subscribe(user, mediaType);
        if (mediaType === 'audio' && user.audioTrack) user.audioTrack.play();
        if (mediaType === 'video' && user.videoTrack && remoteVideoRef.current) {
          user.videoTrack.play(remoteVideoRef.current);
        }
      });

      await agoraClient.current.join(appId, channel, token, uid);

      // Create local audio track
      localTracks.current.audio = await AgoraRTC.createMicrophoneAudioTrack();
      await agoraClient.current.publish([localTracks.current.audio]);

      // Optional: create local video track
      if (withVideo) {
        localTracks.current.video = await AgoraRTC.createCameraVideoTrack();
        if (localVideoRef.current) localTracks.current.video.play(localVideoRef.current);
        await agoraClient.current.publish([localTracks.current.video]);
      }

      setCallState('active');
    } catch (err) {
      console.error('Agora join error:', err);
      endCallCleanup();
    }
  };

  const endCallCleanup = async () => {
    // Stop and close tracks
    if (localTracks.current.audio) { localTracks.current.audio.stop(); localTracks.current.audio.close(); localTracks.current.audio = null; }
    if (localTracks.current.video) { localTracks.current.video.stop(); localTracks.current.video.close(); localTracks.current.video = null; }
    if (agoraClient.current) { try { await agoraClient.current.leave(); } catch (_) {} agoraClient.current = null; }
    setCallState(null);
    setCallContact(null);
    setIncomingCallData(null);
    setIsMuted(false);
    setIsVideoOff(false);
    callChannelRef.current = null;
  };

  // ── Initiate Call ──────────────────────────────────────────────────────────
  const startCall = async (contact, withVideo = false) => {
    if (!contact?._id) return;
    const channel = `call_${makeRoomId(myId, contact._id)}_${Date.now()}`;
    setCallContact(contact);
    setCallWithVideo(withVideo);
    setCallState('outgoing');

    // Signal via Socket
    socketRef.current?.emit('call:initiate', {
      from: myId, fromName: myName, fromRole: myRole,
      to: contact._id, channel, withVideo
    });

    // Join channel optimistically
    await joinAgoraChannel(channel, withVideo);
  };

  // ── Accept Incoming Call ──────────────────────────────────────────────────
  const acceptCall = async (withVideo) => {
    if (!incomingCallData) return;
    socketRef.current?.emit('call:accepted', { from: myId, to: incomingCallData.from });
    await joinAgoraChannel(incomingCallData.channel, withVideo);
  };

  // ── Reject Incoming Call ──────────────────────────────────────────────────
  const rejectCall = () => {
    if (incomingCallData) {
      socketRef.current?.emit('call:rejected', { from: myId, to: incomingCallData.from });
    }
    endCallCleanup();
  };

  // ── End Active Call ───────────────────────────────────────────────────────
  const endCall = async () => {
    const target = callContact?._id || incomingCallData?.from;
    if (target) socketRef.current?.emit('call:ended', { from: myId, to: target });
    await endCallCleanup();
  };

  // ── Toggle Mute ───────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (localTracks.current.audio) {
      const muted = !isMuted;
      localTracks.current.audio.setEnabled(!muted);
      setIsMuted(muted);
    }
  };

  // ── Toggle Video ──────────────────────────────────────────────────────────
  const toggleVideo = () => {
    if (localTracks.current.video) {
      const off = !isVideoOff;
      localTracks.current.video.setEnabled(!off);
      setIsVideoOff(off);
    }
  };

  // ── Filter & Group ────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const groupedMessages = [];
  let currentDate = null;
  messages.forEach(msg => {
    try {
      const dateStr = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (dateStr !== currentDate) { groupedMessages.push({ date: dateStr, msgs: [] }); currentDate = dateStr; }
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    } catch (_) {
      if (!groupedMessages.length) groupedMessages.push({ date: 'Recent', msgs: [] });
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Call Overlay */}
      {callState && (
        <CallOverlay
          callState={callState}
          contact={callContact}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onEndCall={endCall}
          onAccept={acceptCall}
          onReject={rejectCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
        />
      )}

      <div className="flex h-[calc(100vh-160px)] md:h-[calc(100vh-220px)] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        
        {/* ─── CONTACTS LIST ─── */}
        <div className={`w-full sm:w-80 bg-white border-r border-slate-200 flex flex-col ${activeContact ? 'hidden sm:flex' : 'flex'}`}>
          
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FiMessageSquare className="text-blue-600" /> Chats
              </h2>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnread} new</span>
              )}
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search team..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {isLoadingContacts ? (
              <div className="flex flex-col justify-center items-center h-40 gap-3 text-slate-400">
                <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Loading team...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center p-6 text-slate-500 text-sm font-medium">No contacts found</div>
            ) : (
              filteredContacts.map(contact => {
                const roomId = makeRoomId(myId, contact._id);
                const unread  = unreadCounts[roomId] || 0;
                const isActive = activeContact?._id === contact._id;
                return (
                  <button key={contact._id} onClick={() => handleSelectContact(contact)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-50/50 hover:bg-slate-50 relative ${isActive ? 'bg-blue-50/50' : ''}`}>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />}
                    <div className="relative shrink-0">
                      {contact.avatar
                        ? <img src={contact.avatar} alt={contact.name} className="w-11 h-11 rounded-full object-cover shadow-sm border border-slate-200" />
                        : <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${roleColor(contact.role)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>{getInitials(contact.name)}</div>
                      }
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${contact.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <h4 className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{contact.name}</h4>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border w-max ${roleBadgeColor(contact.role)}`}>{contact.role}</span>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{unread > 9 ? '9+' : unread}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── CHAT AREA ─── */}
        {activeContact ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveContact(null)} className="sm:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 transition-colors">
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                {activeContact.avatar
                  ? <img src={activeContact.avatar} alt={activeContact.name} className="w-9 h-9 rounded-full object-cover hidden sm:block shadow-sm" />
                  : <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor(activeContact.role)} items-center justify-center text-white font-bold text-xs hidden sm:flex shadow-sm`}>{getInitials(activeContact.name)}</div>
                }
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {activeContact.name}
                    {(activeContact.role === 'ADMIN' || activeContact.role === 'HR') && <FiShield className="text-blue-600" size={14} />}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColor(activeContact.role)}`}>{activeContact.role}</span>
                    <span className={`text-[10px] font-medium ${activeContact.isAvailable ? 'text-green-600' : 'text-slate-400'}`}>• {activeContact.isAvailable ? 'Active' : 'Away'}</span>
                  </div>
                </div>
              </div>

              {/* Call Buttons */}
              <div className="flex items-center gap-2">
                <button onClick={() => startCall(activeContact, false)}
                  title="Audio Call"
                  className="w-9 h-9 rounded-full bg-green-50 border border-green-200 hover:bg-green-100 text-green-600 flex items-center justify-center transition-all shadow-sm">
                  <FiPhone className="w-4 h-4" />
                </button>
                <button onClick={() => startCall(activeContact, true)}
                  title="Video Call"
                  className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all shadow-sm">
                  <FiVideo className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 no-scrollbar">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full"><FiLoader className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    <FiMessageSquare className="w-7 h-7 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                    <p className="text-xs text-slate-400 mt-1">Send a message to start the conversation with {activeContact.name}</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date} className="space-y-3">
                    <div className="text-center my-3 relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <div className="relative flex justify-center">
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-0.5 border border-slate-100 rounded-full shadow-sm">{group.date}</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {group.msgs.map((msg, i) => {
                        const isMe = msg.senderId === myId;
                        return (
                          <div key={msg._id || i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${roleColor(activeContact.role)} flex items-center justify-center text-white font-bold text-[9px] shrink-0 mb-1 shadow-sm`}>{getInitials(activeContact.name)}</div>
                            )}
                            <div className="flex flex-col gap-1 max-w-[75%] sm:max-w-md">
                              <div className={`px-4 py-2.5 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm'}`}>{msg.text}</div>
                              <span className={`text-[9px] font-medium text-slate-400 px-1 ${isMe ? 'text-right' : 'text-left'}`}>{formatTime(msg.createdAt)}</span>
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

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
                <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)}
                  placeholder={`Message ${activeContact.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400" />
                <button type="submit" disabled={!messageText.trim() || isSending}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full flex items-center justify-center transition-all shrink-0 shadow-md active:scale-95">
                  {isSending ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5 -ml-0.5" />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 p-6">
            <div className="w-24 h-24 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
              <FiUsers className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">Team Communication</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm leading-relaxed">
              Select a contact to chat or start an audio/video call with Technicians, HR, or Admins.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
