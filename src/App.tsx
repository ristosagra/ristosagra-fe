import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CustomerHome } from './pages/CustomerHome/CustomerHome'
import { CashierLogin } from './pages/CashierLogin/CashierLogin'
import { CashierDashboard } from './pages/CashierDashboard/CashierDashboard'
import { ProtectedRoute } from './components/general/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/cashier" element={<CashierLogin />} />
        <Route
          path="/cashier/dashboard"
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
