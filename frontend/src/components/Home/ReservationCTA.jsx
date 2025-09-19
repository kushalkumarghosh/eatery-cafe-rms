import React, { useContext } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

const ReservationCTA = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const handleOrderNow = () => {
    if (token && user) {
      navigate("/reservation");
    } else {
      navigate("/login", {
        state: {
          redirectTo: "/reservation",
          from: "reservation-cta",
        },
      });
    }
  };

  return (
    <div className="w-full py-12 bg-[#ffebcc]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[400px]">
          {/* Left Side - Content */}
          <div className="p-8 lg:p-12 space-y-6">
            {/* Title */}
            <Typography
              variant="h2"
              className="text-gray-800 font-bold text-3xl lg:text-4xl xl:text-5xl leading-tight"
            >
              Are you looking for
              <br />
              <span className="text-orange-500">Delicious food?</span>
            </Typography>

            {/* Description */}
            <Typography
              variant="paragraph"
              className="text-gray-600 text-lg lg:text-xl leading-relaxed max-w-md"
            >
              Are you want to take different delicious food we are available for
              you.
            </Typography>

            {/* Order Now Button */}
            <div className="pt-4">
              <Button
                onClick={handleOrderNow}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg"
              >
                Reserve Now
              </Button>
            </div>
          </div>

          {/* Right Side - Chef Image */}
          <div className="relative p-8 flex justify-center items-center">
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://plus.unsplash.com/premium_photo-1726743831011-e142f90ba717?q=80&w=1117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Professional Chef"
                  className="w-80 h-96 object-cover rounded-2xl shadow-xl"
                />
              </div>

              {/* Floating Food Items */}
              <div className="absolute -top-6 -left-6 transform rotate-12 animate-bounce">
                <div className="bg-white p-4 rounded-full shadow-lg">
                  <span className="text-4xl">🍔</span>
                </div>
              </div>

              <div className="absolute -top-4 -right-8 transform -rotate-12 animate-pulse">
                <div className="bg-white p-3 rounded-full shadow-lg">
                  <span className="text-3xl">🍕</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-4 transform rotate-45 animate-bounce delay-1000">
                <div className="bg-white p-4 rounded-full shadow-lg">
                  <span className="text-4xl">🥗</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-8 transform -rotate-45 animate-pulse delay-500">
                <div className="bg-white p-3 rounded-full shadow-lg">
                  <span className="text-3xl">🍰</span>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-orange-200 rounded-full opacity-30 animate-pulse"></div>
                <div className="absolute bottom-8 left-4 w-24 h-24 bg-yellow-200 rounded-full opacity-40 animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationCTA;
