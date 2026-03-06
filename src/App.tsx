import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CustomerHome } from "./pages/Customer/CustomerHome";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CashierHome } from "./pages/Cashier/CashierHome";
import { CashierLogin } from "./pages/Cashier/CashierLogin";

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
              <CashierHome />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
