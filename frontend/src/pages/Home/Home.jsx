import React, { useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import NoteCard from "../../components/Cards/NoteCard";
import { MdAdd } from "react-icons/md";
import AddEditNote from "../AddEditNote/AddEditNote";
import { useState } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosinstance";
import Toast from "../../components/Toasts/Toast";
import ViewNote from "../ViewNote/ViewNote";

export default function Home() {
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const [openViewNoteModal, setOpenViewNoteModal] = useState({
    isShown: false,
    note: null,
  });

  const [showToast, setShowToast] = useState({
    isShown: false,
    message: "",
    type: "add",
  });

  const [userInfo, setUserInfo] = useState(null);
  const [notes, setNotes] = useState([]);

  const navigate = useNavigate();

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");

      if (response.data.error) {
        localStorage.removeItem("token");
        navigate("/login");
      }

      if (response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch { }
  };

  const getAllNotes = async () => {
    try {
      const response = await axiosInstance.get("/get-all-notes");

      if (response.data.notes) {
        setNotes(response.data.notes);
      }
    } catch (error) {
    }
  };

  const handleEditNote = (note) => {
    setOpenAddEditModal({ isShown: true, type: "edit", data: note });
  }

  const handleShowToast = (message, type) => {
    setShowToast({ isShown: true, message, type });
  }

  const handleDeleteNote = async (note) => {
    const noteId = note._id;
    try {
      const response = await axiosInstance.delete(`/delete-note/${noteId}`);

      if (response.data.error) {
        return;
      }

      if (!response.data.error) {
        getAllNotes();
        handleShowToast("Note Deleted Successfully", 'delete');
      }
    } catch (error) {
    }
  }

  const onPinNote = async (note) => {
    const noteId = note._id;
    try {
      const response = await axiosInstance.put(`/update-note-pinned/${noteId}`, { isPinned: !note.isPinned });

      if (response.data.error) {
        return;
      }

      if (!response.data.error) {
        getAllNotes();
        handleShowToast("Note Pinned Successfully", 'add');
      }
    } catch (error) {
    }
  }

  const handleSearch = async (searchQuery) => {
    try {
      const response = await axiosInstance.get(`/search-notes?query=${searchQuery}`);
      if (response.data.notes) {
        setNotes(response.data.notes);
      }
    } catch (error) {
    }
  };

  const handleViewNote = (note) => {
    setOpenViewNoteModal({ isShown: true, note });
  };

  useEffect(() => {
    getUserInfo();
    getAllNotes();
  }, []);

  return (
    <>
      <Navbar userInfo={userInfo} handleSearch={handleSearch} getAllNotes={getAllNotes} />

      <div className="container mx-auto min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 m-8">
          {notes.map((note) => (
            <NoteCard
              key={note._id}
              title={note.title}
              date={new Date(
                note?.createdAt || new Date()
              ).toLocaleDateString()}
              content={note.content}
              tags={note.tags}
              isPinned={note.isPinned}
              attachments={note.attachments}
              onEdit={() => { handleEditNote(note) }}
              onPin={() => { }}
              onDelete={() => { handleDeleteNote(note) }}
              onPinNote={() => { onPinNote(note) }}
              onClick={() => handleViewNote(note)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() =>
          setOpenAddEditModal({ isShown: true, type: "add", data: null })
        }
        className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 hover:scale-105 duration-500 absolute right-10 bottom-10 outline-none shadow-lg hover:shadow-xl"
      >
        <MdAdd className="text-[32px] text-white" />
      </button>

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => { }}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
          },
        }}
        contentLabel=""
        className="w-[90%] md:w-[50%] lg:w-[40%] max-h-[80vh] bg-transparent rounded-md mx-auto mt-14 overflow-y-auto outline-none"
      >
        <AddEditNote
          type={openAddEditModal.type}
          noteData={openAddEditModal.data}
          onClose={() =>
            setOpenAddEditModal({ isShown: false, type: "add", data: null })
          }
          getAllNotes={getAllNotes}
          showToast={handleShowToast}
        />
      </Modal>

      <Modal
        isOpen={openViewNoteModal.isShown}
        onRequestClose={() => setOpenViewNoteModal({ isShown: false, note: null })}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 1000,
          },
        }}
        contentLabel=""
        className="w-[98%] md:w-[95%] max-h-[98vh] bg-transparent rounded-2xl mx-auto my-auto overflow-hidden focus:outline-none flex items-center justify-center"
      >
        <ViewNote
          note={openViewNoteModal.note}
          onCloseNote={() => setOpenViewNoteModal({ isShown: false })}
        />
      </Modal>


      <Toast
        isShown={showToast.isShown}
        message={showToast.message}
        onClose={() => setShowToast({ isShown: false, message: "", type: "" })}
        type={showToast.type}
      />
    </>
  );
}
