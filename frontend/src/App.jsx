import React, { useEffect } from 'react'
import Navbar from './componets/Navbar'
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";

import {Route,Routes,Navigate} from "react-router-dom"
import { useAuthStore } from './store/useAuthStore.js';
import { useThemeStore } from './store/useThemeStore.js';

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => { checkAuth() }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar/>
      <Routes>
        <Route path= "/" element={authUser ? <HomePage/> : <Navigate to="/login" />} />
        <Route path= "/signup" element={authUser ? <Navigate to="/" /> : <SignUpPage />} />
        <Route path= "/login" element={authUser ? <Navigate to="/" /> : <LoginPage />} />
        <Route path= "/settings" element={authUser ? <SettingPage /> : <Navigate to="/login" />} />
        <Route path= "/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
      <Toaster/>
    </div>
  )
}

export default App

