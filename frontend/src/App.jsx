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

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />

        {/* buyer routes  */}
        <Route path="/buyer/home" element={<Home />} />
        <Route path="/buyer/cart" element={<Cart />} />
        <Route path="/buyer/orders" element={<ViewOrders />} />
        <Route path="/buyer/products" element={<AllProducts />} />
        <Route path="/buyer/product/:id" element={<ProductDetails />} />
        <Route path="/sellers" element={<ListSellers />} />

        {/* <Route path="/buyer/profile" element={<Profile />} /> */}

        {/* seller routes */}
        <Route path="/seller/dashboard" element={<Dashboard />} />
        <Route path="/seller/create" element={<CreateProduct />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/seller/products" element={<ListProducts />} />
        {/* <Route path="/seller/profile" element={<SellerProfile />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
