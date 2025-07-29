import React from "react";
import LandingPage from "./pages/LandingPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import Home from "./pages/buyer/Home";
import Cart from "./pages/buyer/Cart";
import ViewOrders from "./pages/buyer/ViewOrders";
import AllProducts from "./pages/buyer/AllProducts";
import ProductDetails from "./pages/buyer/ProductDetails";
import ListSellers from "./pages/buyer/ListSellers";
import Dashboard from "./pages/seller/Dashboard";
import CreateProduct from "./pages/seller/CreateProduct";
import SellerOrders from "./pages/seller/SellerOrders";
import ListProducts from "./pages/seller/ListProducts";
import Navbar from "./components/Navbar";
import RoleRoute from "./middleware/RoleRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="w-full flex flex-col gap-2 justify-center items-center">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />

          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />

          {/* Buyer routes */}
          <Route
            path="/buyer/home"
            element={
              <RoleRoute allowedRoles={["buyer"]}>
                <Home />
              </RoleRoute>
            }
          />
          <Route
            path="/buyer/cart"
            element={
              <RoleRoute allowedRoles={["buyer"]}>
                <Cart />
              </RoleRoute>
            }
          />
          <Route
            path="/buyer/orders"
            element={
              <RoleRoute allowedRoles={["buyer"]}>
                <ViewOrders />
              </RoleRoute>
            }
          />
          <Route
            path="/buyer/products"
            element={
              <RoleRoute allowedRoles={["buyer"]}>
                <AllProducts />
              </RoleRoute>
            }
          />
          <Route
            path="/buyer/product/:id"
            element={
              <RoleRoute allowedRoles={["buyer"]}>
                <ProductDetails />
              </RoleRoute>
            }
          />
          <Route
            path="/sellers"
            element={
              <RoleRoute allowedRoles={["buyer"]}>
                <ListSellers />
              </RoleRoute>
            }
          />

          {/* Seller routes */}
          <Route
            path="/seller/dashboard"
            element={
              <RoleRoute allowedRoles={["seller"]}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/seller/create"
            element={
              <RoleRoute allowedRoles={["seller"]}>
                <CreateProduct />
              </RoleRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <RoleRoute allowedRoles={["seller"]}>
                <SellerOrders />
              </RoleRoute>
            }
          />
          <Route
            path="/seller/products"
            element={
              <RoleRoute allowedRoles={["seller"]}>
                <ListProducts />
              </RoleRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
