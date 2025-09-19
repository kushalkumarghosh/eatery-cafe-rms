import { useEffect } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Cancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("Payment cancelled. Please try again.");
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <Typography variant="h3" className="mb-6 text-[#8A4B08]">
        Payment Cancelled
      </Typography>
      <Typography className="mb-6">
        Your payment was not completed. Would you like to try again?
      </Typography>
      <Button
        onClick={() => navigate("/cart")}
        className="bg-[#FF9130] hover:bg-[#E07B00]"
      >
        Back to Cart
      </Button>
    </div>
  );
};

export default Cancel;
