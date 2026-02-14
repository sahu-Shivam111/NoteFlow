import React from "react";
import { getInitials } from "../../utils/helper";
import { useNavigate } from "react-router-dom";

export default function ProfileInfo({ userInfo }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    userInfo && (
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-all duration-300 group">
        <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-300">
          {getInitials(`${userInfo.firstName} ${userInfo.lastName}`)}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
            {userInfo.firstName} {userInfo.lastName}
          </span>
          <button
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium mt-0.5 flex items-center gap-1 hover:gap-1.5 transition-all duration-200"
            onClick={handleLogout}
          >
            <span>Logout</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    )
  );
}
