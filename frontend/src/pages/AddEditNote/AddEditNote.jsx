import React, { useState } from "react";
import TagInput from "../../components/Input/TagInput";
import { MdClose } from "react-icons/md";
import axiosInstance from "../../utils/axiosinstance";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { MdAttachFile, MdInsertDriveFile } from "react-icons/md";

const AddEditNote = ({
  noteData,
  type,
  getAllNotes,
  onClose,
  showToast,
}) => {
  const [title, setTitle] = useState(noteData?.title || "");
  const [content, setContent] = useState(noteData?.content || "");
  const [tags, setTags] = useState(noteData?.tags || []);
  const [attachments, setAttachments] = useState(noteData?.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState([]);

  const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:8000').replace(/\/$/, "");
  const token = localStorage.getItem('token');

  const [error, setError] = useState(null);

  // Add Note
  const addNewNote = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      tags.forEach(tag => formData.append("tags[]", tag));
      newFiles.forEach(file => formData.append("attachments", file));

      const response = await axiosInstance.post("/add-note", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.note) {
        showToast("Note Added Successfully");
        getAllNotes();
        onClose();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      }
    }
  };

  // Edit Note
  const editNote = async () => {
    const noteId = noteData?._id;
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      tags.forEach(tag => formData.append("tags[]", tag));
      newFiles.forEach(file => formData.append("attachments", file));

      if (deletedAttachmentIds.length > 0) {
        deletedAttachmentIds.forEach(id => formData.append("deleteAttachmentId", id));
      }

      const response = await axiosInstance.put(
        "/edit-note/" + noteId,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.note) {
        showToast("Note Updated Successfully");
        getAllNotes();
        onClose();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      }
    }
  };

  const handleRemoveAttachment = (att) => {
    if (att.attachmentId) {
      setAttachments(attachments.filter(a => a.attachmentId !== att.attachmentId));
      setDeletedAttachmentIds([...deletedAttachmentIds, att.attachmentId]);
    } else {
      // Handle legacy if needed (though it likely won't hit this often now)
      setAttachments(attachments.filter(a => a.url !== att.url));
    }
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleAddNote = () => {
    if (!title) {
      setError("Please enter the title");
      return;
    }

    if (!content) {
      setError("Please enter the content");
      return;
    }

    setError("");

    if (type === "edit") {
      editNote();
    } else {
      addNewNote();
    }
  };

  return (
    <div className="relative p-6 bg-white dark:bg-gray-800 transition-colors duration-300">
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center absolute top-3 right-3 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
        onClick={onClose}
      >
        <MdClose className="text-xl text-slate-400 dark:text-gray-500 hover:text-red-500" />
      </button>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
        <input
          type="text"
          className="text-2xl text-slate-950 dark:text-gray-100 outline-none border-b border-l-0 border-r-0 border-t-0 p-0 pb-1 focus:border-b-primary bg-transparent transition-all"
          placeholder="Go To Gym At 5"
          value={title}
          onChange={({ target }) => setTitle(target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Content</label>
        <div className="quill-container bg-slate-50 dark:bg-gray-700/50 rounded-lg overflow-hidden border dark:border-gray-600 focus-within:border-primary transition-all">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            placeholder="Write your note content here..."
            className="text-sm text-slate-950 dark:text-gray-200"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'clean']
              ],
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Tags</label>
        <TagInput tags={tags} setTags={setTags} />
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Attachments</label>

        {/* Existing Attachments */}
        <div className="flex flex-wrap gap-3 mb-3">
          {attachments.map((att, idx) => {
            const fileUrl = (att.attachmentId && noteData?._id)
              ? `${BASE_URL}/get-attachment/${noteData._id}/${att.attachmentId}?token=${token}`
              : (att.url ? `${BASE_URL}/${att.url.replace(/\\/g, '/')}` : "");

            return (
              <div key={idx} className="relative group bg-slate-100 dark:bg-gray-700 p-2 rounded-lg border dark:border-gray-600 flex items-center gap-2">
                {att.fileType && att.fileType.startsWith('image/') ? (
                  <img src={fileUrl} className="w-10 h-10 object-cover rounded" alt="" />
                ) : (
                  <MdInsertDriveFile className="text-3xl text-blue-500" />
                )}
                <div className="text-[10px] max-w-[80px] truncate dark:text-gray-300">{att.name}</div>
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveAttachment(att)}
                >
                  <MdClose size={12} />
                </button>
              </div>
            );
          })}

          {/* New Selected Files */}
          {newFiles.map((file, idx) => (
            <div key={idx} className="relative group bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
              {file.type.startsWith('image/') ? (
                <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                </div>
              ) : (
                <MdInsertDriveFile className="text-3xl text-blue-500" />
              )}
              <div className="text-[10px] max-w-[80px] truncate dark:text-gray-300">{file.name}</div>
              <button
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                onClick={() => handleRemoveNewFile(idx)}
              >
                <MdClose size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="relative border-2 border-dashed border-slate-200 dark:border-gray-600 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              const combined = [...newFiles, ...files].slice(0, 5);
              if (newFiles.length + files.length > 5) {
                setError("Max 5 files allowed. Only the first 5 have been kept.");
              }
              setNewFiles(combined);
            }}
            className="w-full h-full absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="text-center">
            <MdAttachFile className="mx-auto text-2xl text-violet-500 mb-1" />
            <div className="text-violet-500 font-medium text-sm">
              Upload Files
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Images, PDFs, Docs (Max 5)</div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs pt-4 font-medium">{error}</p>}

      <button
        className="btn-primary font-medium mt-8 p-3 w-full rounded-lg hover:shadow-md transition-all"
        onClick={handleAddNote}
      >
        {type === "edit" ? "UPDATE NOTE" : "ADD NOTE"}
      </button>
    </div>
  );
};

export default AddEditNote;
