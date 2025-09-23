import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./Components/AuthForms/Login";
import Signup from "./Components/AuthForms/Signup";
import PassRecovery from "./Components/AuthForms/PassRecovery";
import ForgotPassword from "./Components/AuthForms/ForgotPassword";
import Dashboard from "./Components/Dashboard/Dashboard";
import { AuthProvider } from "./Context/Auth/AuthContext";
import PrivateRoute from "./Components/AuthForms/PrivateRoute";

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
