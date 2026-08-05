"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "@/config/api";

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  endpointUrl?: string; // default `/api/inventory/upload-excel`
  title?: string;
}

export function ExcelUploadModal({
  isOpen,
  onClose,
  onSuccess,
  endpointUrl = `${API_BASE_URL}/api/inventory/upload-excel`,
  title = "Import Excel Workbook"
}: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.error || "Failed to process Excel file");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">Sync database with your latest Excel sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Dropzone — Entire Box Clickable */}
          {!result && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]"
                  : file
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet size={42} className="text-emerald-600 animate-bounce-short" />
                  <span className="text-sm font-extrabold text-slate-900">{file.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline mt-2 cursor-pointer"
                  >
                    Change / Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                    <UploadCloud size={30} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      Click anywhere here to select & upload Excel file
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      or drag & drop your .xlsx / .xls file into this box
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/80 mt-1">
                    Supports Job Master, Item Master, Stock IN, Stock OUT sheets
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
              <CheckCircle2 size={36} className="text-emerald-600" />
              <h4 className="text-sm font-bold text-emerald-950">{result.message || "Import Complete!"}</h4>
              {result.summary && (
                <div className="grid grid-cols-2 gap-2 w-full text-xs font-medium text-emerald-900 pt-2 border-t border-emerald-200/60">
                  <div>Jobs: {result.summary.jobsProcessed}</div>
                  <div>Items: {result.summary.itemsProcessed}</div>
                  <div>Stock IN: {result.summary.receiptsProcessed}</div>
                  <div>Stock OUT: {result.summary.issuesProcessed}</div>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        {!result && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upload & Import</span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
