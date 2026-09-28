import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Users, ShieldAlert, Phone, ChevronLeft, Loader2, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'https://65.0.45.64.sslip.io';
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
  unreadCount?: number;
}

interface Message {
  _id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  roomId: string;
  text: string;
  readBy: string[];
  createdAt: string;
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

export const MessagesModule: React.FC = () => {
  const myId = localStorage.getItem('user_id') || '';
  const myName = localStorage.getItem('user_name') || 'Technician';
  const myRole = 'TECHNICIAN';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch all employee contacts from backend
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

      // 1. Try /api/auth/employees - returns ALL roles (TECHNICIAN + ADMIN + HR)
      //    Works on local backend now; will work on EC2 after deploy
      try {
        const res = await fetch(`${API_BASE}/api/auth/employees`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            allUsers = data.data.map(mapUser);
          }
        }
      } catch (_) {}

      // 2. Fallback: /api/auth/technicians (always available on EC2)
      if (allUsers.length === 0) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/technicians`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            allUsers = data.data.map(mapUser);
          }
        } catch (_) {}
      }

      // 3. Exclude self by name
      const myNameLower = myName?.toLowerCase().trim();
      const others = allUsers.filter(c => c.name?.toLowerCase().trim() !== myNameLower);
      setContacts(others);
    } catch (e) {
      console.warn('Failed to load contacts:', e);
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [myId, myName]);

  // Fetch unread counts
  const loadUnreadCounts = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/unread-counts/${myId}`);
      const data = await res.json();
      if (data.success) setUnreadCounts(data.data);
    } catch (_) {}
  }, [myId]);

  // Fetch messages for selected contact
  const loadMessages = useCallback(async (contact: Contact) => {
    setIsLoadingMessages(true);
    setMessages([]);
    try {
      const roomId = makeRoomId(myId, contact._id);
      const res = await fetch(`${API_BASE}/api/messages/${roomId}?myId=${myId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        // Clear unread for this room
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[roomId];
          return updated;
        });
      }
    } catch (e) {
      console.warn('Failed to load messages:', e);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [myId]);

  // Socket setup
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (myId) socket.emit('join_user', myId);
      if (myRole) socket.emit('join_role', myRole);
    });

    socket.on('message:new', (msg: Message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Update unread count if this chat is not active
      setActiveContact(active => {
        if (!active || makeRoomId(myId, active._id) !== msg.roomId) {
          setUnreadCounts(counts => ({
            ...counts,
            [msg.roomId]: (counts[msg.roomId] || 0) + 1
          }));
        }
        return active;
      });
    });

    return () => { socket.disconnect(); };
  }, [myId, myRole]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadContacts();
    loadUnreadCounts();
  }, [loadContacts, loadUnreadCounts]);

  const handleSelectContact = (contact: Contact) => {
    setActiveContact(contact);
    loadMessages(contact);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact || isSending) return;
    setIsSending(true);

    const optimistic: Message = {
      senderId: myId,
      senderName: myName,
      senderRole: myRole,
      recipientId: activeContact._id,
      recipientName: activeContact.name,
      roomId: makeRoomId(myId, activeContact._id),
      text: messageText.trim(),
      readBy: [myId],
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setMessageText('');

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimistic)
      });
      const data = await res.json();
      if (data.success) {
        // Replace optimistic with real message
        setMessages(prev => prev.map(m => m === optimistic ? data.data : m));
      }
    } catch (e) {
      console.warn('Send failed:', e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return ''; }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch (_) { return ''; }
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = formatDate(m.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last?.date === d) { last.msgs.push(m); }
    else { groupedMessages.push({ date: d, msgs: [m] }); }
  });

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">

      {/* ───────────────── CONTACTS SIDEBAR ───────────────── */}
      <div className={`w-full sm:w-80 shrink-0 border-r border-zinc-200 flex flex-col ${activeContact ? 'hidden sm:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Team Messages
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">{totalUnread}</span>
              )}
            </h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingContacts ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-xs">Loading employees...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="text-xs">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const roomId = makeRoomId(myId, contact._id);
              const unread = unreadCounts[roomId] || 0;
              const isActive = activeContact?._id === contact._id;
              return (
                <button
                  key={contact._id}
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-zinc-50 transition-colors text-left ${
                    isActive ? 'bg-blue-50/60 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.name} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${roleColor(contact.role)} flex items-center justify-center text-white font-bold text-sm`}>
                        {getInitials(contact.name)}
                      </div>
                    )}
                    {/* Online dot */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${contact.isAvailable ? 'bg-green-500' : 'bg-slate-400'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate">{contact.name}</span>
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColor(contact.role)}`}>
                      {contact.role}
                    </span>
                  </div>

                  {/* Unread badge */}
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────────── CHAT AREA ───────────────── */}
      {activeContact ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          
          {/* Chat Header */}
          <div className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveContact(null)} className="sm:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {activeContact.avatar ? (
                <img src={activeContact.avatar} alt={activeContact.name} className="w-9 h-9 rounded-full object-cover hidden sm:block" />
              ) : (
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor(activeContact.role)} flex items-center justify-center text-white font-bold text-xs hidden sm:flex`}>
                  {getInitials(activeContact.name)}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {activeContact.name}
                  {(activeContact.role === 'ADMIN' || activeContact.role === 'HR') && (
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColor(activeContact.role)}`}>
                    {activeContact.role}
                  </span>
                  <span className={`text-[10px] font-medium ${activeContact.isAvailable ? 'text-green-600' : 'text-slate-400'}`}>
                    ● {activeContact.isAvailable ? 'Active' : 'Away'}
                  </span>
                </div>
              </div>
            </div>
            {activeContact.phone && (
              <a
                href={`tel:${activeContact.phone}`}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-green-100 hover:text-green-700 flex items-center justify-center text-slate-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : groupedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                  <p className="text-xs text-slate-400 mt-1">Send a message to start the conversation with {activeContact.name}</p>
                </div>
              </div>
            ) : (
              groupedMessages.map(group => (
                <div key={group.date}>
                  <div className="text-center mb-4">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{group.date}</span>
                  </div>
                  <div className="space-y-2">
                    {group.msgs.map((msg, i) => {
                      const isMe = msg.senderId === myId;
                      return (
                        <div key={msg._id || i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${roleColor(activeContact.role)} flex items-center justify-center text-white font-bold text-[10px] shrink-0 mb-1`}>
                              {getInitials(activeContact.name)}
                            </div>
                          )}
                          <div className={`flex flex-col gap-0.5 max-w-[75%] sm:max-w-sm`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white border border-zinc-200 text-slate-800 rounded-bl-sm'
                            }`}>
                              {msg.text}
                            </div>
                            <span className={`text-[10px] text-slate-400 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                              {formatTime(msg.createdAt)}
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

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-zinc-200 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2.5">
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={`Message ${activeContact.name}...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-md shadow-blue-600/20"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty state for desktop */
        <div className="flex-1 hidden sm:flex flex-col items-center justify-center bg-slate-50/30 text-slate-400 p-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-9 h-9 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-600 mb-1">Team Messages</h3>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Select a contact to chat with Admin, HR, or your fellow technicians in real-time.
          </p>
        </div>
      )}
    </div>
  );
};
