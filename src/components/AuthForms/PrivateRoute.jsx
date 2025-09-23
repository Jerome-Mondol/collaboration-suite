import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/Auth/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>; // or spinner UI
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default PrivateRoute;
