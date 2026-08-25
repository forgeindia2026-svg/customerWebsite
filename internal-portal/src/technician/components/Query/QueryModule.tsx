import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Send, 
  Plus
} from 'lucide-react';
import { getApiUrl } from '../../../utils/config';
import { formatDate } from '../../services/dateUtils';

interface QueryItem {
  id: string;
  ticketId: string;
  subject: string;
  category: 'PARTS_REQUEST' | 'TECHNICAL_HELP' | 'SCHEDULE_CHANGE' | 'SAFETY_ISSUE' | string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'In Progress' | 'Open' | 'Resolved';
  createdDate: string;
  lastReply: string;
  lastActivityTimestamp: number;
  messages: { sender: string; time: string; text: string }[];
}

export const QueryModule: React.FC = () => {
  const techName = localStorage.getItem('user_name') || 'Technician';

  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [newQuerySubject, setNewQuerySubject] = useState('');
  const [newQueryCategory, setNewQueryCategory] = useState<string>('TECHNICAL_HELP');
  const [newQueryMessage, setNewQueryMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch technician queries from backend API
  const fetchQueries = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/queries?type=Technician`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: QueryItem[] = data.map((q: any) => ({
          id: q.ticketId || q.id,
          ticketId: q.ticketId || q.id,
          subject: q.subject,
          category: q.category || 'TECHNICAL_HELP',
          status: q.status || 'OPEN',
          createdDate: q.date || new Date().toLocaleDateString(),
          lastReply: q.messages?.[q.messages.length - 1]?.text ? `${q.messages[q.messages.length - 1].sender}: ${q.messages[q.messages.length - 1].text}` : 'Open Ticket Registered',
          lastActivityTimestamp: Date.now(),
          messages: q.messages || []
        }));
        setQueries(mapped);
        if (mapped.length > 0 && !selectedQuery) {
          setSelectedQuery(mapped[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load technician queries:', err);
    }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (queries.length > 0 && (!selectedQuery || !queries.find(q => q.id === selectedQuery.id))) {
      setSelectedQuery(queries[0]);
    } else if (queries.length === 0) {
      setSelectedQuery(null);
    }
  }, [queries]);

  const getTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedQuery) return;
    const now = Date.now();
    const textToSend = replyText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentId = selectedQuery.ticketId || selectedQuery.id;

    const updated: QueryItem = {
      ...selectedQuery,
      lastReply: `${techName} (You): ${textToSend}`,
      lastActivityTimestamp: now,
      messages: [
        ...selectedQuery.messages,
        { sender: `${techName} (You)`, time: timeStr, text: textToSend }
      ]
    };
    setSelectedQuery(updated);
    setQueries(queries.map(q => q.id === updated.id ? updated : q));
    setReplyText('');

    try {
      await fetch(`${getApiUrl()}/api/queries/${currentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: `${techName} (Technician)`,
          role: 'TECHNICIAN',
          text: textToSend
        })
      });
    } catch (err) {
      console.error('Failed to post reply to server:', err);
    }
  };

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuerySubject.trim() || !newQueryMessage.trim()) return;

    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const payload = {
      type: 'Technician',
      raisedBy: techName,
      subject: newQuerySubject.trim(),
      category: newQueryCategory,
      priority: 'Medium',
      description: newQueryMessage.trim()
    };

    try {
      const res = await fetch(`${getApiUrl()}/api/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newTicket: QueryItem = {
          id: data.data.ticketId || data.data.id,
          ticketId: data.data.ticketId || data.data.id,
          subject: data.data.subject,
          category: data.data.category,
          status: 'OPEN',
          createdDate: new Date().toLocaleString(),
          lastReply: `${techName}: ${newQueryMessage}`,
          lastActivityTimestamp: now,
          messages: [
            { sender: `${techName} (You)`, time: timeStr, text: newQueryMessage }
          ]
        };
        const updatedList = [newTicket, ...queries];
        setQueries(updatedList);
        setSelectedQuery(newTicket);
      }
    } catch (err) {
      console.error('Failed to create ticket on server:', err);
    }

    setNewQuerySubject('');
    setNewQueryMessage('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                HELPDESK & DISPATCH SUPPORT
              </span>
              <span className="text-xs text-zinc-400 font-mono">Alex Vance (SK-TECH-9042)</span>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mt-1 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-zinc-700" />
              <span>Technician Field Queries & Support Tickets</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Submit technical inquiries, request emergency spare parts, or request schedule changes from central dispatch.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>SUBMIT NEW QUERY</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Query Ticket List */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-3 shadow-2xs">
          <h3 className="text-sm font-bold text-zinc-900 pb-2 border-b border-zinc-100">
            Active Query Tickets ({queries.length})
          </h3>

          <div className="space-y-2">
            {queries.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl space-y-2">
                <HelpCircle className="w-8 h-8 text-zinc-300 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-800">No Support Queries</h4>
                <p className="text-[11px] text-zinc-500">You currently have no open or past helpdesk tickets.</p>
              </div>
            ) : (
              queries.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuery(q)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    selectedQuery?.id === q.id 
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm' 
                      : 'border-zinc-200/80 bg-white hover:border-zinc-300 text-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${selectedQuery?.id === q.id ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {q.ticketId}
                      </span>
                      <span className={`text-[10px] font-sans font-medium px-1.5 py-0.5 rounded ${
                        selectedQuery?.id === q.id ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {getTimeAgo(q.lastActivityTimestamp)}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.status === 'RESOLVED' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold leading-snug line-clamp-2">{q.subject}</h4>
                  <p className={`text-[11px] truncate ${selectedQuery?.id === q.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {q.lastReply}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Reply */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-6 shadow-2xs flex flex-col justify-between">
          {selectedQuery ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-zinc-100 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-500">{selectedQuery.ticketId} • {selectedQuery.category}</span>
                  <span className="text-xs font-mono text-zinc-400">{formatDate(selectedQuery.createdDate.split(' ')[0])} {selectedQuery.createdDate.split(' ').slice(1).join(' ')}</span>
                </div>
                <h3 className="text-base font-extrabold text-zinc-900">{selectedQuery.subject}</h3>
              </div>

              {/* Messages Feed */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {selectedQuery.messages.map((msg, idx) => (
                  <div key={idx} className="p-4 bg-zinc-50 border border-zinc-200/70 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900">{msg.sender}</span>
                      <span className="text-zinc-400 font-mono text-[11px]">{msg.time}</span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="pt-2 border-t border-zinc-100 flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type your response to dispatch..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  onClick={handleSendReply}
                  className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>REPLY</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs">Select a query ticket to view details.</div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 border border-zinc-200 shadow-xl">
            <h3 className="text-base font-extrabold text-zinc-900">Submit New Technical Query</h3>
            <form onSubmit={handleCreateQuery} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Query Category</label>
                <select
                  value={newQueryCategory}
                  onChange={(e: any) => setNewQueryCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="TECHNICAL_HELP">Technical Help / Schematics</option>
                  <option value="PARTS_REQUEST">Emergency Spare Parts</option>
                  <option value="SCHEDULE_CHANGE">Schedule / Slot Adjustment</option>
                  <option value="SAFETY_ISSUE">Safety Protocol Question</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need 480V breaker replacement for job SK-JOB-8492"
                  value={newQuerySubject}
                  onChange={(e) => setNewQuerySubject(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Message Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain your inquiry or issue for the dispatch team..."
                  value={newQueryMessage}
                  onChange={(e) => setNewQueryMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
