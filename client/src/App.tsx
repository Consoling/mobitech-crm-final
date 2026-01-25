import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import { AnimatePresence } from "framer-motion";
import ProtectedLayout from "./layout/ProtectedLayout";
import TOTPVerify from "./pages/TOTPVerify";
import WalletBalances from "./pages/WalletBalances";
import WalletBalance from "./pages/WalletBalance";
import ModelSelection from "./pages/ModelSelection";
import ModelsView from "./pages/ModelsView";
import MFASetup from "./pages/MFASetup";
import ModelView from "./pages/ModelView";
import AddNewModel from "./pages/AddNewModel";
import Session from "./pages/Session";
import Settings from "./pages/Settings";
import SearchPage from "./pages/SearchPage";
import QCReports from "./pages/reports/QCReports";


const App = () => {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/totp-verify" element={<TOTPVerify />} />
          <Route path="/mfa-setup" element={<MFASetup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />

          <Route path="/wallet/wallet-balances" element={<WalletBalances />} />
          <Route path="/wallet/view-balance" element={<WalletBalance />} />
          <Route path="/models" element={<ModelSelection />} />
          <Route path="/model/:brandId" element={<ModelsView />} />
          <Route path="/model/:brandName/:modelId" element={<ModelView />} />
          <Route path="/model/:brandId/add" element={<AddNewModel />} />

          <Route path="/sessions" element={<Session />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<SearchPage />} />

          <Route path='/reports/qc-reports' element={<QCReports />} />

            {/* Add your protected routes here */}
            {/* Example: <Route path="/dashboard" element={<Dashboard />} /> */}
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;
