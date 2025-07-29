// src/utils/api.js

import store from "@/redux/store";

export const apiFetch = async (url, options = {}) => {
  const token = store.getState().auth.token;

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  return fetch(url, { ...options, headers });
};
