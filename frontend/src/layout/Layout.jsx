import React from "react";
import { Outlet } from "react-router-dom";
import StickyNavbar from "../components/Home/StickyNavbar.jsx";
import Footer from "../components/Home/Footer.jsx";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <StickyNavbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
