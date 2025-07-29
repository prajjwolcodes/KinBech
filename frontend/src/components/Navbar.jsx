// src/components/Navbar.jsx
import { logout } from "@/redux/authSlice";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-lg">
        KinBech
      </Link>

      <div className="space-x-4">
        {!isAuthenticated && (
          <>
            <Link to="/auth/login" className="hover:underline">
              Login
            </Link>
            <Link to="/auth/signup" className="hover:underline">
              Signup
            </Link>
          </>
        )}

        {isAuthenticated && user.role === "buyer" && (
          <>
            <Link to="/buyer/home" className="hover:underline">
              Home
            </Link>
            <Link to="/buyer/cart" className="hover:underline">
              Cart
            </Link>
            <Link to="/buyer/orders" className="hover:underline">
              Orders
            </Link>
            <Link to="/buyer/products" className="hover:underline">
              Products
            </Link>
            <Link to="/sellers" className="hover:underline">
              Sellers
            </Link>
          </>
        )}

        {isAuthenticated && user.role === "seller" && (
          <>
            <Link to="/seller/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link to="/seller/create" className="hover:underline">
              Create Product
            </Link>
            <Link to="/seller/orders" className="hover:underline">
              Orders
            </Link>
            <Link to="/seller/products" className="hover:underline">
              My Products
            </Link>
          </>
        )}

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
