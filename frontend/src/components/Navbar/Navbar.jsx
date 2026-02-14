import React from "react";
import ProfileInfo from "../Cards/ProfileInfo";
import SearchBar from "../SearchBar/SearchBar";
import { useState, useEffect } from "react";
import { FaRegStickyNote } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

export default function Navbar({ userInfo, handleSearch, getAllNotes }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkMode, toggleTheme } = useTheme();

  const clearSearch = () => {
    setSearchQuery("");
    if (getAllNotes) getAllNotes();
  };

  const navigate = useNavigate();

  const handleIconClick = () => {
    const token = localStorage.getItem('token');
    token ? navigate('/dashboard') : navigate('/login');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else if (getAllNotes) {
        getAllNotes();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50 flex items-center justify-between px-6 py-3 shadow-lg sticky top-0 z-50 transition-colors duration-300">
      <a onClick={handleIconClick} className="cursor-pointer flex items-center gap-3">
        <FaRegStickyNote size={32} className="text-blue-600 dark:text-blue-400" />
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          NoteFlow
        </span>
      </a>
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle (Always Visible) */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <MdLightMode size={22} className="text-yellow-400" />
          ) : (
            <MdDarkMode size={22} className="text-gray-600" />
          )}
        </button>

        {userInfo && (
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              handleSearch={() => handleSearch(searchQuery)}
              clearSearch={clearSearch}
            />
            <ProfileInfo userInfo={userInfo} />
          </div>
        )}
      </div>
    </nav>
  );
}
