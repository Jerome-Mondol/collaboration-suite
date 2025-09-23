import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./components/AuthForms/Login";
import Signup from "./components/AuthForms/Signup";
import PassRecovery from "./components/AuthForms/PassRecovery";
import ForgotPassword from "./components/AuthForms/ForgotPassword";
import Dashboard from "./components/Dashboard/Dashboard";
import { AuthProvider } from "./Context/Auth/AuthContext";
import PrivateRoute from "./components/AuthForms/PrivateRoute";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recover" element={<ForgotPassword />} />
          <Route path="/recover-password" element={<PassRecovery />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
