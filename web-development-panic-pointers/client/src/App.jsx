import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login   from './pages/Login'
import Command from './pages/Command'
import Captain from './pages/Captain'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Login />} />
        <Route path="/command"           element={<Command />} />
        <Route path="/captain/:shipId"   element={<Captain />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
