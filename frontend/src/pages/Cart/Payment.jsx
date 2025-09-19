import { useState } from "react";
import { useCart } from "../../hooks/useCart.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import axios from "../../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Payment = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePayment = async () => {
    if (!user) {
      setMessage("Please login to place an order.");
      navigate("/login");
      return;
    }
    if (!address) {
      setMessage("Please provide a delivery address.");
      return;
    }

    const order = {
      userEmail: user.email,
      items: cart.map((item) => ({
        name: item.name,
        quantity: 1,
        price: item.price,
      })),
      totalAmount: total,
      address,
    };

    try {
      await axios.post("/api/orders", order, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      clearCart();
      setMessage("Payment successful! Your order has been placed.");
      toast.success("Order placed successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Payment error:", err);
      setMessage("Something went wrong. Try again.");
      toast.error("Payment failed.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-4">Payment</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4 mb-6">
            {cart.map((item) => (
              <li key={item._id} className="flex justify-between border-b pb-2">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Delivery Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter your address"
              required
            />
          </div>
          <p className="text-xl font-bold mb-4">Total: ${total.toFixed(2)}</p>
          <button
            onClick={handlePayment}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Pay Now
          </button>
        </>
      )}
      {message && (
        <p
          className={`mt-4 ${
            message.includes("successful") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Payment;
