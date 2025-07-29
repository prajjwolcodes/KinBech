import React from "react";
import { useSelector } from "react-redux";

const LandingPage = () => {
  const { user } = useSelector((state) => state.auth);
  return <div>{user ? user.username : "Guest"}</div>;
};

export default LandingPage;
