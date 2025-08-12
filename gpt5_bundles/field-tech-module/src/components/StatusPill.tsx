import React from "react";
import { CheckCircle, Play, AlertTriangle } from "lucide-react";
import type { TaskStatus } from "../types";

export function StatusPill({ status }: { status: TaskStatus | string }) {
  switch (status) {
    case "In Progress":
    case "Active":
      return (
        <div className="flex items-center text-xs font-medium text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">
          <Play size={12} className="mr-1.5" />
          {String(status)}
        </div>
      );
    case "Not Started":
    case "Available":
      return (
        <div className="flex items-center text-xs font-medium text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full">
          <AlertTriangle size={12} className="mr-1.5" />
          {String(status)}
        </div>
      );
    case "Completed":
    case "Resolved":
      return (
        <div className="flex items-center text-xs font-medium text-green-800 bg-green-100 px-2.5 py-1 rounded-full">
          <CheckCircle size={12} className="mr-1.5" />
          {String(status)}
        </div>
      );
    default:
      return (
        <div className="flex items-center text-xs font-medium text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full">
          {String(status)}
        </div>
      );
  }
}

