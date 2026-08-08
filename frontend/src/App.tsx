
// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/App.tsx
// ─────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing            from './pages/Landing'
import Login              from './pages/Login'
import Register           from './pages/Register'
import Activate           from './pages/Activate'
import PatientDashboard   from './pages/patient/Dashboard'
import DoctorDashboard    from './pages/doctor/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import RadiologistDashboard from './pages/radiologist/Dashboard'

const Placeholder = ({ label }: { label: string }) => (
  <div style={{
    height:'100vh', display:'grid', placeItems:'center',
    background:'#0a0a0a', fontFamily:'monospace',
    color:'rgba(242,242,242,0.4)', fontSize:13,
  }}>
    {label} — coming soon
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />

        <Route path="/patient/dashboard" element={<PatientDashboard />} />

        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/query"     element={<Placeholder label="Doctor / Query" />} />
        <Route path="/doctor/hitl"      element={<Placeholder label="Doctor / HITL" />} />
        <Route path="/doctor/chat"      element={<Placeholder label="Doctor / Chat" />} />
        <Route path="/doctor/reports"   element={<Placeholder label="Doctor / Reports" />} />

        <Route path="/radiologist/dashboard" element={<RadiologistDashboard />} />
        <Route path="/radiologist/queue"     element={<Placeholder label="Radiologist / Queue" />} />
        <Route path="/radiologist/chat"      element={<Placeholder label="Radiologist / Chat" />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        
        

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
