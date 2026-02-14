import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import ProtectedRoute from './ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext'

import { Toaster } from 'react-hot-toast'

function App() {

  return (
    <ThemeProvider>
      <Router>
        <Toaster position='top-center' toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
