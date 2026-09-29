import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const API_BASE = (() => {
  let url = import.meta.env.VITE_API_URL || 'https://43.204.218.193.sslip.io';
  return url.replace(/\/$/, '');
})();

interface Contact {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
}

export default function CreateGroupModal({ isOpen, onClose, contacts, myId, onGroupCreated }: { isOpen: boolean; onClose: () => void; contacts: Contact[]; myId: string; onGroupCreated: (g: any) => void }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) return alert('Enter a name and select at least one member');
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), adminId: myId, members: selected })
      });
      const data = await res.json();
      if (data.success) {
        onGroupCreated(data.data);
        onClose();
        setName('');
        setSelected([]);
      } else {
        alert(data.message || 'Failed to create group');
      }
    } catch (err) {
      alert('Error creating group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">Create New Group</h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Group Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Service Team A" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Members ({selected.length})</label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {contacts.map(c => (
                <label key={c._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" checked={selected.includes(c._id)} onChange={(e) => {
                    if (e.target.checked) setSelected(prev => [...prev, c._id]);
                    else setSelected(prev => prev.filter(id => id !== c._id));
                  }} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-[10px] font-bold text-slate-500">{c.role}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
