import React, { useContext } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SpecialOfferSandwich = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleProceedToOrder = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.error("Please log in to proceed");
      setTimeout(() => navigate("/login"), 100);
      return;
    }
    setTimeout(() => navigate("/menu"), 100);
  };

  return (
    <div className="relative w-full h-[400px] bg-white flex items-center">
      <div className="w-1/2 h-full flex flex-col justify-center px-16 lg:px-28 py-20 bg-[#ffebcc]">
        <Typography
          variant="h2"
          className="text-gray-800 font-bold text-4xl lg:text-5xl mb-4"
        >
          Best Deals Sandwich
        </Typography>
        <Typography
          variant="paragraph"
          className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md"
        >
          Enjoy the large size of sandwiches. Complete your meal with the
          perfect slice of sandwich.
        </Typography>
        <Button
          onClick={handleProceedToOrder}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg w-fit !transition-none"
          ripple={false}
          variant="filled"
          size="lg"
          style={{
            minHeight: "56px",
            minWidth: "auto",
          }}
        >
          Proceed to order →
        </Button>
      </div>
      <div
        className="w-1/2 h-full bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1567234669003-dce7a7a88821?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      ></div>
    </div>
  );
};

export default SpecialOfferSandwich;
