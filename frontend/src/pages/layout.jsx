import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function Layout() {

  return (
    <div className="page">
      <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
        <Sidebar />
        <div className="page">
          <Header />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
