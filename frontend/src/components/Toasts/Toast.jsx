import React, { useEffect } from "react";
import { MdCheck, MdDeleteOutline } from "react-icons/md";

export default function Toast({ isShown, message, type, onClose }) {

  useEffect(()=>{
    const timeOut = setTimeout(() => {
      onClose();
    }, 3000);

    return () =>{
      clearTimeout(timeOut);
    }
  }, [onClose]);

  return (
    <div className={`absolute top-20 right-6 transition-all duration-500 ${
          isShown ? "block" : "hidden"
        }`}>
      <div
        className={`min-w-52 after:rounded-l-lg after:top-0 after:left-0 z-50 after:w-[5px] after:h-full shadow-md rounded-md ${type === "delete" ? "bg-red-500" : "bg-green-500"}`}
      >
        <div className="flex items-center gap-3 py-2 px-4">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full ${
              type === "delete" ? "bg-red-100" : "bg-green-100"
            }`}
          >
             {type==='delete' ? <MdDeleteOutline className="text-xl text-red-500"/> : <MdCheck className="text-xl text-green-500" />}
          </div>
          <p className="text-sm text-slate-100">{message}</p>
        </div>
      </div>
    </div>
  );
}
