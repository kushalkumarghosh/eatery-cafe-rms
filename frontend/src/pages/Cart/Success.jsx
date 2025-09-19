import { useEffect, useRef } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axios.js";
import { useCart } from "../../hooks/useCart.jsx";

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) {
      console.log("Skipping createOrder: already processing");
      return;
    }

    isProcessing.current = true;
    console.log("Starting createOrder");

    const createOrder = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const orderDataRaw = params.get("orderData");

        if (!orderDataRaw) {
          console.log("No orderData, redirecting to home");
          navigate("/");
          return;
        }

        let orderData;
        try {
          orderData = JSON.parse(decodeURIComponent(orderDataRaw));
        } catch (parseErr) {
          console.error("Order data parse error:", parseErr);
          navigate("/");
          return;
        }

        if (
          !orderData.items ||
          !orderData.totalAmount ||
          !orderData.address ||
          !orderData.userEmail ||
          !orderData.clientReferenceId
        ) {
          console.error("Incomplete order data:", orderData);
          navigate("/");
          return;
        }

        console.log(
          "Sending order with clientReferenceId:",
          orderData.clientReferenceId
        );

        const requestId = `req_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const response = await axios.post("/api/orders", {
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          address: orderData.address,
          userEmail: orderData.userEmail,
          clientReferenceId: orderData.clientReferenceId,
          requestId,
        });

        if (!response.data.order?._id) {
          throw new Error("Order creation failed");
        }

        console.log("Order created successfully, clearing cart");
        clearCart();
        toast.success("Payment successful! Your order is confirmed.", {
          id: "order-success",
        });
      } catch (err) {
        console.error("Order creation error:", err);
        if (err.response?.status !== 409) {
          toast.error("Failed to confirm order. Please contact support.", {
            id: "order-error",
          });
        }
      } finally {
        isProcessing.current = false;
      }
    };

    createOrder();
  }, [location.search]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <Typography variant="h3" className="mb-6 text-[#8A4B08]">
        Payment Successful
      </Typography>
      <Typography className="mb-6">
        Thank you for your order! You'll receive a confirmation soon.
      </Typography>
      <Button
        onClick={() => navigate("/")}
        className="bg-[#FF9130] hover:bg-[#E07B00]"
      >
        Back to Home
      </Button>
    </div>
  );
};

export default Success;
