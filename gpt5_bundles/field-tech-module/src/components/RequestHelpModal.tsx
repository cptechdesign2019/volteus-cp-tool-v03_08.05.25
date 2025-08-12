import React, { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import type { AnyTask } from "../types";

interface RequestHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AnyTask[];
  onSubmit: (args: { selectedTask: AnyTask["id"]; recipient: string; message: string }) => void;
  defaultTaskId?: AnyTask["id"] | null;
}

export function RequestHelpModal({ isOpen, onClose, tasks, onSubmit, defaultTaskId }: RequestHelpModalProps) {
  const [selectedTask, setSelectedTask] = useState<AnyTask["id"] | "">(defaultTaskId ?? "");
  const [recipient, setRecipient] = useState<string>("Project Manager");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (defaultTaskId) setSelectedTask(defaultTaskId);
    else if (tasks.length > 0) setSelectedTask(tasks[0].id);
  }, [tasks, defaultTaskId]);

  const handleSubmit = () => {
    if (!selectedTask || !recipient || !message.trim()) return;
    onSubmit({ selectedTask, recipient, message: message.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={24} />
        </button>
        <h3 className="text-xl font-bold text-[#162944]">Request Help</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="task-select" className="block text-sm font-medium text-gray-700">
              Project / Service Call
            </label>
            <select
              id="task-select"
              value={String(selectedTask)}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {tasks.map((task) => (
                <option key={String(task.id)} value={String(task.id)}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recipient-select" className="block text-sm font-medium text-gray-700">
              Recipient
            </label>
            <select
              id="recipient-select"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option>Project Manager</option>
              <option>Engineer</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full p-2 border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              placeholder="Please describe the issue or question..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#162944] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Send size={16} className="mr-2" /> Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

