import React, { useState } from "react";
import { Send } from "lucide-react";
import type { NoteItem } from "../types";

interface NotesTabProps {
  notes: NoteItem[];
  currentUser: string;
  onAddNote: (note: NoteItem) => void;
}

export function NotesTab({ notes: initialNotes, currentUser, onAddNote }: NotesTabProps) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [newNote, setNewNote] = useState<string>("");

  const handleSubmit = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    const note: NoteItem = { user: currentUser, timestamp: new Date().toISOString(), text: trimmed };
    setNotes((prev) => [note, ...prev]);
    onAddNote(note);
    setNewNote("");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#162944] mb-2">Add a New Note</h3>
        <div className="relative">
          <textarea
            className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            rows={4}
            placeholder="Type a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          className="mt-3 flex items-center bg-[#162944] text-white hover:opacity-90 px-4 py-2 text-sm font-medium rounded-md shadow-sm"
        >
          <Send size={16} className="mr-2" /> Submit Note
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#162944] mb-4">Notes Log</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {notes.length > 0 ? (
            notes.map((note, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-800">{note.text}</p>
                <div className="text-right text-xs text-gray-500 mt-2">
                  <span>{note.user}</span> – <span>{new Date(note.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No notes have been added for this project yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

