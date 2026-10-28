import { Navigate, Route, Routes } from "react-router-dom";
import { AccessSagra } from "./AccessSagra";
import { Landing } from "./Landing";

//Dominio principale (ristosagra.it): presentazione, registrazione di una nuova sagra e accesso
//a quella già registrata. Le sagre vivono sui loro sottodomini
export const PlatformApp = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/accedi" element={<AccessSagra />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
