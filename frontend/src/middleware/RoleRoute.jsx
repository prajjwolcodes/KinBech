// src/components/RoleRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function RoleRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to home if role mismatch
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleRoute;
