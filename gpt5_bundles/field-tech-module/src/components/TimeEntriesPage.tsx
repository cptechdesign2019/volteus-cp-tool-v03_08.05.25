import React from "react";
import type { TimeEntry } from "../types";
import { formatDuration } from "../utils/date";

interface TimeEntriesPageProps {
  entries: TimeEntry[];
}

export function TimeEntriesPage({ entries }: TimeEntriesPageProps) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-[#162944] mb-4">Time Entries</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.startTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.taskName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.startTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.endTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(entry.durationMs)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No time entries recorded yet. Clock in to a task to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

