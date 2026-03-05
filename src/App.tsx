import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CustomerHome } from "./pages/CustomerHome";
import { CashierLogin } from "./pages/CashierLogin";
import { ProtectedRoute } from "./components/general/ProtectedRoute";
import { CashierHome } from "./pages/CashierHome";

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
