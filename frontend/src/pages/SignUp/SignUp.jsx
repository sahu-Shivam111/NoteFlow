import React from "react";
import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import PasswordInput from "../../components/Input/PasswordInput";
import { Link, useNavigate } from "react-router-dom";
import { validEmail } from "../../utils/helper";

import axiosInstance from "../../utils/axiosinstance"

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (!validEmail(email)) {
      setError("Invalid Email");
      return;
    }

    setError("");

    try {
      const response = await axiosInstance.post("/create-user", {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
      });

      if (response.data.error) {
        setError(response.data.message);
        return;
      }

      if (response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }

    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }

  };

  return (
    <>
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="w-96 border dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 px-7 py-10 shadow-2xl relative overflow-hidden transition-colors duration-300">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

          <form onSubmit={handleSignUp}>
            <h4 className="text-3xl font-bold mb-7 text-gray-800 dark:text-gray-200 text-center">Create Account</h4>

            <div className="mb-4">
              <input
                type="text"
                placeholder="First Name"
                className="input-box w-full bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-600 text-gray-800 dark:text-gray-200 transition-all duration-300 rounded-lg py-3 px-4"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                }}
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Last Name"
                className="input-box w-full bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-600 text-gray-800 dark:text-gray-200 transition-all duration-300 rounded-lg py-3 px-4"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                }}
              />
            </div>

            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                className="input-box w-full bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-600 text-gray-800 dark:text-gray-200 transition-all duration-300 rounded-lg py-3 px-4"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>

            <div className="mb-6">
              <PasswordInput
                password={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300 rounded-lg py-3 px-4"
              />
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-xs pb-1 text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded mb-4">{error}</p>}

            <button type="submit" className="w-full py-3 rounded-lg font-semibold text-lg text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 border-none">
              Create Account
            </button>

            <p className="text-sm text-center mt-6 text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
