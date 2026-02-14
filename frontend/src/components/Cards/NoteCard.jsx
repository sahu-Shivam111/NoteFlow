import React from 'react';
import { MdOutlinePushPin, MdCreate, MdDelete, MdInsertDriveFile } from 'react-icons/md';

export default function NoteCard({
  title, date, content, tags, isPinned, attachments, onEdit, onDelete, onPinNote, onClick
}) {
  // Prevent event propagation to avoid triggering onClick of the parent element
  const handleEditClick = (event) => {
    event.stopPropagation();
    onEdit();
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDelete();
  };

  const handlePinClick = (event) => {
    event.stopPropagation();
    onPinNote();
  };

  return (
    <div className='border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-lg transition-all ease-in-out cursor-pointer' onClick={onClick}>
      {attachments && attachments.length > 0 && (
        <div className="w-full h-52 bg-slate-100 dark:bg-gray-700 rounded-t-lg overflow-hidden flex items-center justify-center relative">
          {attachments[0].fileType.startsWith('image/') ? (
            <img
              src={`http://localhost:8000/${attachments[0].url}`}
              alt="Note Attachment"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-gray-500">
              <MdInsertDriveFile size={48} />
              <span className="text-xs uppercase font-semibold">{attachments[0].name.split('.').pop()} File</span>
            </div>
          )}
          {attachments.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
              +{attachments.length - 1} more
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className='flex justify-between items-start'>
          <div>
            <h5 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>{title}</h5>
            <p className='text-sm text-gray-500 dark:text-gray-400'>{date}</p>
          </div>
          <button
            className={`p-2 rounded-full ${isPinned ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
            onClick={handlePinClick}
            aria-label="Pin Note"
          >
            <MdOutlinePushPin />
          </button>
        </div>

        <p className='text-sm text-gray-600 dark:text-gray-300 mt-3 mb-2 break-words line-clamp-2'>
          {content.replace(/<[^>]*>/g, '').slice(0, 100)}{content.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
        </p>

        <div className='flex justify-between items-center'>
          <div className='flex flex-wrap gap-1'>
            {tags.map(tag => (
              <span key={tag} className='text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full'>
                #{tag}
              </span>
            ))}
          </div>
          <div className='flex gap-2'>
            <button
              className='p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
              onClick={handleEditClick}
              aria-label="Edit Note"
            >
              <MdCreate />
            </button>
            <button
              className='p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
              onClick={handleDeleteClick}
              aria-label="Delete Note"
            >
              <MdDelete />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}