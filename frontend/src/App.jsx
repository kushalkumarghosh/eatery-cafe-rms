import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home.jsx";
import About from "./pages/About/About.jsx";
import Menu from "./pages/Menu/Menu.jsx";
import Reservation from "./pages/Reservation/Reservation.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import ResetPassword from "./pages/Auth/ResetPassword.jsx";
import Cart from "./pages/Cart/Cart.jsx";
import Layout from "./layout/Layout.jsx";
import Admin from "./pages/Admin/Admin.jsx";
import Success from "./pages/Cart/Success.jsx";
import Cancel from "./pages/Cart/Cancel.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="menu" element={<Menu />} />
        <Route path="reservation" element={<Reservation />} />
        <Route path="cart" element={<Cart />} />
        <Route path="payment/success" element={<Success />} />
        <Route path="payment/cancel" element={<Cancel />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password/:token" element={<ResetPassword />} />
      <Route path="admin-dashboard" element={<Admin />} />
    </Routes>
  );
};

export default App;