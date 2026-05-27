import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "./socket";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Refer from "./pages/Refer";
import SaveMoney from "./pages/SaveMoney";
import InvestHistory from "./pages/InvestHistory";
import KYC from "./pages/KYC";
import Notifications from "./pages/Notifications";
import ForgotPassword from "./pages/ForgotPassword";
import UserAnalytics from "./pages/UserAnalytics";

import AdminKYC from "./pages/AdminKYC";
import AdminNotification from "./pages/AdminNotification";
import AdminDashboard from "./pages/AdminDashboard";

import PerformanceBonus from "./pages/PerformanceBonus";
import TeamBonus from "./pages/TeamBonus";
import RoyaltyBonus from "./pages/RoyaltyBonus";
import BonusHistory from "./pages/BonusHistory";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Leaderboard from "./pages/Leaderboard";

import DailyReward from "./pages/DailyReward";
import InvestmentAssistant from "./pages/InvestmentAssistant";

import Support from "./pages/Support";
import AdminSupport from "./pages/AdminSupport";
import ReferralTree from "./pages/ReferralTree";
import LegalPages from "./pages/LegalPages";
import AdvancedAdminAnalytics from "./pages/AdvancedAdminAnalytics";
import AdminUserControl from "./pages/AdminUserControl";
import AboutCompany from "./pages/AboutCompany";





function App() {
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem("email");

    if (email) {
      socket.emit("join", email);
    }

    socket.on("new_notification", (data) => {
      setPopup(data);

      setTimeout(() => {
        setPopup(null);
      }, 5000);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  return (
    <BrowserRouter>

      {popup && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "#22c55e",
          color: "white",
          padding: "15px",
          borderRadius: "10px",
          zIndex: 9999
        }}>
          <h4>{popup.title}</h4>
          <p>{popup.message}</p>
        </div>
      )}

      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
  path="/leaderboard"
  element={
    <ProtectedRoute>
      <Leaderboard />
    </ProtectedRoute>
  }
/>

<Route path="/about" element={<AboutCompany />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/refer"
          element={
            <ProtectedRoute>
              <Refer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/save-money"
          element={
            <ProtectedRoute>
              <SaveMoney />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invest-history"
          element={
            <ProtectedRoute>
              <InvestHistory />
            </ProtectedRoute>
          }
        />

        <Route
  path="/bonus-history"
  element={
    <ProtectedRoute>
      <BonusHistory />
    </ProtectedRoute>
  }
/>

        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <KYC />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
  path="/legal/:type"
  element={<LegalPages />}
/>

        <Route
          path="/performance-bonus"
          element={
            <ProtectedRoute>
              <PerformanceBonus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/team-bonus"
          element={
            <ProtectedRoute>
              <TeamBonus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/royalty-bonus"
          element={
            <ProtectedRoute>
              <RoyaltyBonus />
            </ProtectedRoute>
          }
        />

        <Route
  path="/referral-tree"
  element={
    <ProtectedRoute>
      <ReferralTree />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>


        <Route
          path="/admin-kyc"
          element={
            <AdminRoute>
              <AdminKYC />
            </AdminRoute>
          }
        />

      <Route
  path="/admin-analytics"
  element={
    <AdminRoute>
      <AdvancedAdminAnalytics />
    </AdminRoute>
  }
/>

<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <UserAnalytics />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-user-control"
  element={
    <AdminRoute>
      <AdminUserControl />
    </AdminRoute>
  }
/>

        <Route
  path="/daily-reward"
  element={
    <ProtectedRoute>
      <DailyReward />
    </ProtectedRoute>
  }
/>

<Route
  path="/assistant"
  element={
    <ProtectedRoute>
      <InvestmentAssistant />
    </ProtectedRoute>
  }
/>

<Route
  path="/support"
  element={
    <ProtectedRoute>
      <Support />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-support"
  element={
    <AdminRoute>
      <AdminSupport />
    </AdminRoute>
  }
/>

        <Route
          path="/admin-notify"
          element={
            <AdminRoute>
              <AdminNotification />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Login />} />

      </Routes>

      <ToastContainer
        position="top-center"
        autoClose={2500}
        theme="dark"
      />

      <Toaster
        position="top-center"
        reverseOrder={false}
      />

    </BrowserRouter>
  );
}

export default App;