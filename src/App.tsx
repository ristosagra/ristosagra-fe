import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CustomerHome } from "./pages/Customer/CustomerHome";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CashierHome } from "./pages/Cashier/CashierHome";
import { CashierLogin } from "./pages/Cashier/CashierLogin";
import { Toast } from "./components/core/Toast";

function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/login" element={<CashierLogin />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CashierHome />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
