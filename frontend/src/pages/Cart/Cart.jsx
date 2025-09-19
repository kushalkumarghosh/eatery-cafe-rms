import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Button, Input } from "@material-tailwind/react";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_KEY); 

const Cart = () => {
  const { cart, removeFromCart } = useCart();
  const { token, user } = useContext(AuthContext);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!token) {
      toast.error("Please log in to place an order");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!address) {
      toast.error("Please enter a delivery address");
      return;
    }

    if (!user?.email) {
      toast.error("User email not found. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const orderItems = cart.map((item) => {
        if (
          !item.name ||
          !item.price ||
          !item.quantity ||
          item.price <= 0 ||
          item.quantity <= 0
        ) {
          throw new Error(`Invalid item: ${item.name || "unknown"}`);
        }
        return {
          name: item.name,
          quantity: Math.floor(item.quantity),
          price: Number(item.price),
        };
      });

      const clientReferenceId = `order_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      const sessionResponse = await axios.post(
        "/api/stripe/create-checkout-session",
        {
          items: orderItems,
          totalAmount: calculateTotal(),
          address,
          userEmail: user.email,
          clientReferenceId,
        }
      );

      if (!sessionResponse.data.id) {
        throw new Error(
          "Stripe session creation failed: No session ID returned"
        );
      }

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionResponse.data.id,
      });

      if (error) {
        throw new Error(`Stripe redirect error: ${error.message}`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(
        err.message || "Failed to initiate payment. Please try again."
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Typography variant="h3" className="mb-6 text-[#8A4B08]">
        Your Cart
      </Typography>
      {cart.length === 0 ? (
        <Typography variant="h5" className="text-center">
          Your cart is empty.
        </Typography>
      ) : (
        <div>
          {cart.map((item) => (
            <div
              key={item._id}
              className="flex justify-between items-center mb-4 p-4 bg-white shadow-md rounded-lg"
            >
              <div>
                <Typography variant="h6">{item.name}</Typography>
                <Typography>Price: ${item.price}</Typography>
                <Typography>Quantity: {item.quantity}</Typography>
              </div>
              <Button
                color="red"
                onClick={() => removeFromCart(item._id)}
                className="hover:bg-red-700"
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="mt-6">
            <Input
              type="text"
              label="Delivery Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="mb-4"
            />
            <div className="flex justify-between items-center">
              <Typography variant="h5">
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
              <Button
                onClick={handleCheckout}
                className="bg-[#FF9130] hover:bg-[#E07B00]"
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
