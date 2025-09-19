import React, { useState, useEffect, useContext } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SpecialOffer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 11,
    minutes: 52,
    seconds: 30,
  });

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Countdown Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const { days, hours, minutes, seconds } = prevTime;

        if (seconds > 0) {
          return { ...prevTime, seconds: seconds - 1 };
        } else if (minutes > 0) {
          return { ...prevTime, minutes: minutes - 1, seconds: 59 };
        } else if (hours > 0) {
          return { ...prevTime, hours: hours - 1, minutes: 59, seconds: 59 };
        } else if (days > 0) {
          return {
            ...prevTime,
            days: days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        } else {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Special offer item data
  const specialOffer = {
    _id: "special-vegetable-salad",
    name: "Vegetable Salad",
    description:
      "Packed with fresh vegetables, crunchy greens, and a touch of tangy vinaigrette for the perfect healthy bite.",
    price: 90,
    originalPrice: 110,
    imgUrl:
      "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    discount: 20,
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.error("Please log in to add items to cart");
      setTimeout(() => navigate("/login"), 100);
      return;
    }
    setTimeout(() => navigate("/menu"), 100);
  };

  return (
    <div
      className="relative w-full h-[600px] bg-cover bg-center"
      style={{ backgroundImage: `url(${specialOffer.imgUrl})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 flex items-center h-full w-full">
        {/* Left Side - Content */}
        <div className="w-1/2 h-full flex flex-col justify-center px-16 lg:px-28 py-20 text-white">
          {/* Exclusive Offer Badge */}
          <div className="inline-flex items-center mb-6">
            <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
              Exclusive Offer
            </div>
            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
              {specialOffer.discount}% OFF
            </div>
          </div>

          {/* Title */}
          <Typography
            variant="h2"
            className="text-white font-bold text-4xl lg:text-5xl mb-4"
          >
            {specialOffer.name}
          </Typography>

          {/* Price */}
          <div className="flex items-center mb-6">
            <Typography variant="paragraph" className="text-white mr-2">
              From
            </Typography>
            <span className="text-gray-300 line-through text-lg mr-2">
              ${specialOffer.originalPrice}
            </span>
            <Typography
              variant="h3"
              className="text-orange-500 font-bold text-3xl"
            >
              ${specialOffer.price}
            </Typography>
          </div>

          {/* Description */}
          <Typography
            variant="paragraph"
            className="text-white text-lg leading-relaxed mb-8 max-w-md"
          >
            {specialOffer.description}
          </Typography>

          {/* Countdown Timer */}
          <div className="mb-8">
            <Typography
              variant="paragraph"
              className="text-white font-semibold mb-4"
            >
              Offer is valid upto:
            </Typography>

            <div className="flex gap-4">
              <div className="text-center">
                <div className="bg-white bg-opacity-80 rounded-lg p-3 shadow-sm min-w-[60px]">
                  <Typography
                    variant="h3"
                    className="text-gray-800 font-bold text-2xl"
                  >
                    {timeLeft.days}
                  </Typography>
                </div>
                <Typography variant="small" className="text-white mt-2">
                  Days
                </Typography>
              </div>

              <div className="text-center">
                <div className="bg-white bg-opacity-80 rounded-lg p-3 shadow-sm min-w-[60px]">
                  <Typography
                    variant="h3"
                    className="text-gray-800 font-bold text-2xl"
                  >
                    {timeLeft.hours}
                  </Typography>
                </div>
                <Typography variant="small" className="text-white mt-2">
                  Hours
                </Typography>
              </div>

              <div className="text-center">
                <div className="bg-white bg-opacity-80 rounded-lg p-3 shadow-sm min-w-[60px]">
                  <Typography
                    variant="h3"
                    className="text-gray-800 font-bold text-2xl"
                  >
                    {timeLeft.minutes}
                  </Typography>
                </div>
                <Typography variant="small" className="text-white mt-2">
                  Minutes
                </Typography>
              </div>

              <div className="text-center">
                <div className="bg-white bg-opacity-80 rounded-lg p-3 shadow-sm min-w-[60px]">
                  <Typography
                    variant="h3"
                    className="text-gray-800 font-bold text-2xl"
                  >
                    {timeLeft.seconds}
                  </Typography>
                </div>
                <Typography variant="small" className="text-white mt-2">
                  Seconds
                </Typography>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg w-fit !transition-none"
            ripple={false}
            variant="filled"
            size="lg"
            style={{
              minHeight: "56px",
              minWidth: "auto",
            }}
          >
            Add to cart
          </Button>
        </div>

        {/* Right Side - Empty for background image */}
        <div className="w-1/2 h-full"></div>
      </div>
    </div>
  );
};

export default SpecialOffer;
