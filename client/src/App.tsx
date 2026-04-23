import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import { AnimatePresence } from "framer-motion";
import ProtectedLayout from "./layout/ProtectedLayout";
import PublicLayout from "./layout/PublicLayout";
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
import ViewQCReport from "./pages/reports/ViewQCReport";
import APKDownload from "./pages/APKDownload";

import  TeamDashboard from './pages/team/TeamDashboard'
import EditEmployee from "./pages/team/EditEmployee";
import ViewEmployee from "./pages/team/ViewEmployee";
import ViewStore from "./pages/team/ViewStore";
import EditStore from "./pages/team/EditStore";


const App = () => {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/mdt" element={<APKDownload />} />
          
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/totp-verify" element={<TOTPVerify />} />
            <Route path="/mfa-setup" element={<MFASetup />} />
          </Route>

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
          <Route path='/reports/qc-reports/view/:reportId' element={<ViewQCReport />} />

          <Route path='/manage-team/employees' element={<TeamDashboard />} />
          <Route path='/manage-team/edit-employee/:employeeID' element={<EditEmployee />} />
          <Route path='/manage-team/view-employee/:employeeID' element={<ViewEmployee />} />
          <Route path='/manage-team/view-store/:storeID' element={<ViewStore />} />
          <Route path='/manage-team/edit-store/:storeID' element={<EditStore />} />

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
