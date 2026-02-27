import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CustomerHome } from './pages/CustomerHome'
import { CashierLogin } from './pages/CashierLogin'
import { CashierDashboard } from './pages/CashierDashboard'
import { ProtectedRoute } from './components/general/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/cassa" element={<CashierLogin />} />
        <Route
          path="/cassa/dashboard"
          element={
            <ProtectedRoute>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
