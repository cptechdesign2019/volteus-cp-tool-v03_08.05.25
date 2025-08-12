import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Folder, FolderOpen, Upload } from "lucide-react";
import type { PicturesByPhase, PictureInfo } from "../types";

interface PicturesTabProps {
  pictures: PicturesByPhase;
  onAddPictures?: (phase: keyof PicturesByPhase, files: File[]) => void;
}

export function PicturesTab({ pictures: initialPictures, onAddPictures }: PicturesTabProps) {
  const [pictures, setPictures] = useState<PicturesByPhase>(initialPictures);
  const [selectedFolder, setSelectedFolder] = useState<keyof PicturesByPhase | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      createdUrlsRef.current = [];
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newPictures: PictureInfo[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      createdUrlsRef.current.push(url);
      return { url, name: file.name };
    });

    setPictures((prev) => ({ ...prev, [selectedFolder]: [...prev[selectedFolder], ...newPictures] }));
    if (onAddPictures) onAddPictures(selectedFolder, files);
    event.target.value = "";
  };

  if (!selectedFolder) {
    return (
      <div className="p-6 flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[20rem]">
        <button
          onClick={() => setSelectedFolder("before")}
          className="flex flex-col items-center justify-center w-48 h-48 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <Folder size={48} className="mb-4 text-gray-500" /> Before Pictures
        </button>
        <button
          onClick={() => setSelectedFolder("after")}
          className="flex flex-col items-center justify-center w-48 h-48 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <FolderOpen size={48} className="mb-4 text-blue-500" /> After Pictures
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button onClick={() => setSelectedFolder(null)} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Folders
      </button>
      <h3 className="text-2xl font-bold text-[#162944] capitalize">{selectedFolder} Pictures</h3>
      <div className="mt-4 flex flex-wrap gap-4">
        <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileUpload} />
        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 text-sm font-medium rounded-md shadow-sm">
          <Upload size={16} className="mr-2" /> Upload from Library
        </button>
        <button onClick={() => cameraInputRef.current?.click()} className="inline-flex items-center bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-sm font-medium rounded-md shadow-sm">
          <Camera size={16} className="mr-2" /> Use Camera
        </button>
      </div>

      <div className="mt-4">
        {pictures[selectedFolder].length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pictures[selectedFolder].map((pic, index) => (
              <div key={`${pic.url}-${index}`} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pic.url}
                  alt={pic.name}
                  className="w-full h-32 object-cover rounded-md shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://placehold.co/400/ef4444/ffffff?text=Error";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">{pic.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-md border-2 border-dashed">
            <p className="text-gray-500">No pictures uploaded to this folder yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

