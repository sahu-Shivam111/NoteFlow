import React, { useState, useEffect } from "react";
import { MdClose, MdFileDownload, MdPictureAsPdf, MdCode, MdDescription, MdChevronLeft, MdAutoAwesome } from "react-icons/md";
import jsPDF from "jspdf";
import { htmlToText } from 'html-to-text';
import axiosInstance from "../../utils/axiosinstance";
import { toast } from "react-hot-toast";

const ViewNote = ({ note, onCloseNote }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [summary, setSummary] = useState(note?.summary || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryTimer, setRetryTimer] = useState(0);

  // Countdown logic for AI retry
  useEffect(() => {
    let interval;
    if (retryTimer > 0) {
      interval = setInterval(() => {
        setRetryTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [retryTimer]);

  const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:8000').replace(/\/$/, "");
  const token = localStorage.getItem('token');

  const getAttachmentUrl = (att) => {
    if (att.attachmentId && note?._id) {
      return `${BASE_URL}/get-attachment/${note._id}/${att.attachmentId}?token=${token}`;
    }
    // Legacy support
    if (att.url) {
      return `${BASE_URL}/${att.url.replace(/\\/g, '/')}`;
    }
    return "";
  };

  const handleSummarize = async () => {
    if (isGenerating || retryTimer > 0) return;

    setIsGenerating(true);
    try {
      const response = await axiosInstance.post(`/api/ai/summarize/${note._id}`, {}, { timeout: 60000 });
      if (response.data && response.data.summary) {
        setSummary(response.data.summary);
        toast.success("Summary generated!");
      }
    } catch (error) {
      // Handle 429 Rate Limit
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;
        if (retryAfter) {
          // Robust parsing for "14s" or "60"
          const seconds = parseInt(retryAfter.toString().replace('s', '')) || 60;
          setRetryTimer(seconds);
        } else {
          setRetryTimer(60);
        }
      }

      // Handle 409 Conflict (Stuck or active)
      if (error.response?.status === 409) {
        toast.error("Summarization is already running for this note.");
        return;
      }

      const errorMsg = error.response?.data?.message || "Failed to generate summary";

      // Fail-safe: If no timer set but msg mentions limit/quota, set default 60s
      if (retryTimer === 0 && (errorMsg.toLowerCase().includes("limit") || errorMsg.toLowerCase().includes("quota"))) {
        setRetryTimer(60);
      }

      toast.error(errorMsg, { duration: 4000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let cursorY = 20;

    // 1. Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(note.title, maxLineWidth);
    doc.text(titleLines, margin, cursorY);
    cursorY += (titleLines.length * 10) + 5;

    // 2. Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Created on: ${new Date(note.createdAt).toLocaleDateString()}`, margin, cursorY);
    cursorY += 15;
    doc.setTextColor(0);

    // 3. AI Summary (if available)
    if (summary) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AI Smart Summary", margin, cursorY);
      cursorY += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      const summaryLines = doc.splitTextToSize(summary, maxLineWidth);
      doc.text(summaryLines, margin, cursorY);
      cursorY += (summaryLines.length * 6) + 15;
    }

    // 4. Content
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const text = htmlToText(note.content, {
      wordwrap: 130
    });

    const contentLines = doc.splitTextToSize(text, maxLineWidth);

    contentLines.forEach((line) => {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += 7;
    });

    // 5. Footer (Page Numbers)
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    }

    doc.save(`${note.title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportMD = () => {
    const text = htmlToText(note.content);
    const mdContent = `# ${note.title}\n\n**Created on:** ${new Date(note.createdAt).toLocaleDateString()}\n\n${text}`;
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/\s+/g, '_')}.md`;
    link.click();
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  if (!note) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 relative max-w-[98vw] lg:max-w-[95vw] w-full mx-auto shadow-2xl overflow-hidden h-[95vh] flex flex-col transition-colors duration-300">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

      <button
        onClick={onCloseNote}
        className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-2 transition-all duration-200 z-10"
      >
        <MdClose size={24} />
      </button>

      {previewFile ? (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-400"
            >
              <MdChevronLeft size={28} />
            </button>
            <h4 className="text-xl font-semibold dark:text-gray-200 truncate">{previewFile.name}</h4>
          </div>

          <div className="flex-1 bg-slate-100 dark:bg-gray-900 rounded-xl overflow-hidden relative">
            {previewFile.fileType.startsWith('image/') ? (
              <img
                src={getAttachmentUrl(previewFile)}
                className="w-full h-full object-contain"
                alt={previewFile.name}
              />
            ) : previewFile.fileType === 'application/pdf' ? (
              <iframe
                src={`${getAttachmentUrl(previewFile)}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MdDescription size={64} />
                <p className="mt-4">Preview not available for this file type</p>
                <a
                  href={getAttachmentUrl(previewFile)}
                  download
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download to View
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto overflow-x-hidden pr-4 md:pr-12 animate-in fade-in duration-300" style={{ scrollbarWidth: 'thin' }}>

          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 truncate-none break-words">{note.title}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              {new Date(note.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSummarize}
                disabled={isGenerating || retryTimer > 0}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap`}
              >
                <MdAutoAwesome className={isGenerating ? "animate-spin" : ""} size={18} />
                <span className="text-sm font-medium">
                  {isGenerating ? "AI is Thinking..." : retryTimer > 0 ? "AI Limited" : "AI Summarize"}
                </span>
              </button>
              {retryTimer > 0 && (
                <div className="text-[10px] text-red-500 font-bold animate-pulse mt-1">
                  Ready in {retryTimer}s
                </div>
              )}
              <button onClick={handleExportPDF} title="Export PDF" className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:scale-110 transition-transform">
                <MdPictureAsPdf size={20} />
              </button>
              <button onClick={handleExportMD} title="Export Markdown" className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:scale-110 transition-transform">
                <MdDescription size={20} />
              </button>
              <button onClick={handleExportJSON} title="Export JSON" className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:scale-110 transition-transform">
                <MdCode size={20} />
              </button>
            </div>
          </div>

          <div className="attachments-section mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {note.attachments && note.attachments.map((att, idx) => (
              <div
                key={idx}
                onClick={() => (att.fileType.startsWith('image/') || att.fileType === 'application/pdf') && setPreviewFile(att)}
                className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border dark:border-gray-600 group transition-all overflow-hidden ${(att.fileType.startsWith('image/') || att.fileType === 'application/pdf') ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500' : ''
                  }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {att.fileType.startsWith('image/') ? (
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-slate-200">
                      <img src={getAttachmentUrl(att)} className="w-full h-full object-cover" alt="" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded flex-shrink-0">
                      <MdPictureAsPdf size={24} className={att.fileType === 'application/pdf' ? 'text-red-500' : 'text-blue-500'} />
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate dark:text-gray-200">{att.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase truncate">{(att.fileType === 'application/pdf' || att.fileType.startsWith('image/')) ? 'Click to preview' : 'Download only'}</span>
                  </div>
                </div>
                <a
                  href={getAttachmentUrl(att)}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                >
                  <MdFileDownload size={20} />
                </a>
              </div>
            ))}
          </div>

          {summary && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm relative overflow-hidden group break-words">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <MdAutoAwesome size={40} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-blue-800 dark:text-blue-300 font-bold mb-3 flex items-center gap-2">
                <MdAutoAwesome className="text-blue-500" />
                AI Smart Summary
              </h4>
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {summary}
              </div>
            </div>
          )}

          <div
            className="ql-editor text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 prose dark:prose-invert max-w-none break-words overflow-x-hidden"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />

          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              {note.tags.map((tag, index) => (
                <span key={index} className="text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewNote;
