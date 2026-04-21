import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReportPage from './pages/ReportPage'
import HomePage from './pages/HomePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report/:discordId" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
