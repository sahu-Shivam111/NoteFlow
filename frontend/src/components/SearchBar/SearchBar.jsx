import React from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

export default function SearchBar({
  value,
  onChange,
  handleSearch,
  clearSearch,
}) {
  return (
    <div className="relative w-80 group">
      {/* Gradient border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 blur transition duration-300"></div>

      <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 shadow-md hover:shadow-lg transition-all duration-300">
        <FaMagnifyingGlass className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" size={18} />
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full text-sm bg-transparent ml-3 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          value={value}
          onChange={onChange}
        />
        {value && (
          <IoMdClose
            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-1 transition-all duration-200"
            size={24}
            onClick={clearSearch}
          />
        )}
      </div>
    </div>
  );
}
