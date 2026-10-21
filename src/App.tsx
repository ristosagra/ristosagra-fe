import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CustomerHome } from "./pages/Customer/CustomerHome";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toast } from "./components/core/Toast";
import { Loader } from "./components/core/Loader";
import { useTheme } from "./hooks/useTheme";

//Le pagine della cassa si scaricano solo quando servono: i clienti (dal cellulare)
//non caricano piantina, editor del menù e gestione ordini
const CashierHome = lazy(() =>
  import("./pages/Cashier/CashierHome").then((m) => ({
    default: m.CashierHome,
  })),
);
const CashierLogin = lazy(() =>
  import("./pages/Cashier/CashierLogin").then((m) => ({
    default: m.CashierLogin,
  })),
);
//Schermo "Pronti" del ritiro al banco (per una TV): non serve ai clienti sul telefono
const PickupScreen = lazy(() =>
  import("./pages/PickupScreen").then((m) => ({
    default: m.PickupScreen,
  })),
);

function App() {
  useTheme();

  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<CustomerHome />} />
          <Route path="/login" element={<CashierLogin />} />
          <Route path="/pronti" element={<PickupScreen />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CashierHome />
              </ProtectedRoute>
            }
          />
          {/* Indirizzi sconosciuti: si torna alla home dei clienti */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
