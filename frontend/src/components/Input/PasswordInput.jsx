import React, { useState } from "react";

import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

export default function PasswordInput({ password, onChange, placeholder, className }) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className={`flex items-center bg-transparent border-[1.5px] dark:border-gray-600 px-5 rounded mb-3 ${className}`}>
      <input
        type={showPass ? "text" : "password"}
        value={password}
        onChange={onChange}
        placeholder={placeholder || "Password"}
        className="w-full text-sm py-3 mr-3 bg-transparent rounded outline-none text-gray-800 dark:text-gray-200"
      />

      {showPass ? (
        <FaRegEye
          size={22}
          className="text-primary dark:text-blue-400 cursor-pointer"
          onClick={() => setShowPass(!showPass)}
        />
      ) : (
        <FaRegEyeSlash
          size={22}
          className="text-primary dark:text-blue-400 cursor-pointer"
          onClick={() => setShowPass(!showPass)}
        />
      )}
    </div>
  );
}
