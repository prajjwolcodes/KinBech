import { configureStore } from "@reduxjs/toolkit";
// import cartSlice from "./features/cart/cartSlice";
// import productSlice from "./features/products/productSlice";
// import orderSlice from "./features/orders/orderSlice";
import authSlice from "./authSlice.js";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    // cart: cartSlice,
    // products: productSlice,
    // orders: orderSlice,
  },
});

export default store;
// Type aliases removed because they are only valid in TypeScript files
