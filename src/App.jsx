import './App.css'
import { HomePage } from './pages/home/HomePage'
import { Routes, Route } from "react-router-dom";

function App() {

  return (
    <>
    <Routes>
      <Route index element={<HomePage />} />
      </Routes>
    </>
  )
}

export default App
