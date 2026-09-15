import './App.css'
import { HomePage } from './pages/home/HomePage'
import { Routes, Route } from "react-router-dom";
import RSVP from './pages/rsvp/RSVP';
import Login from './pages/login/Login';
import Admin from './pages/admin/Admin';

function App() {

  return (
    <>
    <Routes>
      <Route index element={<HomePage />} />
      <Route path='rsvp'  element={<RSVP />} />
      <Route path='login'  element={<Login />} />
      <Route path='admin'  element={<Admin />} />
      </Routes>
    </>
  )
}

export default App
