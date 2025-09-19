import React from "react";
import { Typography, Button } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import restaurantImage from "../../assets/banner.jpg";
import MenuPreview from "../../components/Home/MenuPreview.jsx";
import SpecialOffer from "../../components/Home/SpecialOffer.jsx";
import SpecialOfferSandwich from "../../components/Home/SpecialOfferSandwich.jsx";
import Testimonials from "../../components/Home/Testimonials.jsx";
import ReservationCTA from "../../components/Home/ReservationCTA.jsx";

const Home = () => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate("/reservation");
  };

  return (
    <div className="w-full">
      {/*Banner Section */}
      <div className="w-full min-h-[70vh] bg-gradient-to-r from-orange-50 to-orange-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-32 h-32 bg-orange-400 rounded-full"></div>
          <div className="absolute bottom-20 right-40 w-20 h-20 bg-orange-300 rounded-full"></div>
          <div className="absolute top-40 right-60 w-16 h-16 bg-orange-200 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[50vh]">
            <div className="space-y-6 z-10 relative">
              <div className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                <span className="mr-2">🔥</span>
                OPEN FOR DINE
              </div>

              {/* Main Heading */}
              <Typography
                variant="h1"
                className="text-gray-800 font-bold text-4xl lg:text-6xl xl:text-7xl leading-tight"
              >
                Savor Flavor Simplify
                <br />
                <span className="text-orange-500">Service Online</span>
              </Typography>

              {/* Description */}
              <Typography
                variant="paragraph"
                className="text-gray-600 text-lg lg:text-xl leading-relaxed max-w-lg"
              >
                Welcome to a world of flavor - our restaurant blends stunning
                ambiance with irresistible cuisine, inviting you to savor every
                moment from the very first glance.
              </Typography>

              {/* CTA Button */}
              <div className="pt-4">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div className="text-center">
                  <Typography
                    variant="h3"
                    className="text-orange-500 font-bold text-3xl"
                  >
                    350+
                  </Typography>
                  <Typography variant="small" className="text-gray-600">
                    Happy Customers
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography
                    variant="h3"
                    className="text-orange-500 font-bold text-3xl"
                  >
                    65+
                  </Typography>
                  <Typography variant="small" className="text-gray-600">
                    Special Menu
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography
                    variant="h3"
                    className="text-orange-500 font-bold text-3xl"
                  >
                    65+
                  </Typography>
                  <Typography variant="small" className="text-gray-600">
                    Various Menu
                  </Typography>
                </div>
              </div>
            </div>

            <div className="relative lg:block hidden">
              <div className="relative">
                <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <img
                    src={restaurantImage}
                    alt="Chef presenting food"
                    className="w-full max-w-md mx-auto rounded-2xl shadow-2xl object-cover h-96"
                  />
                </div>

                <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-300 rounded-full opacity-15 animate-pulse delay-1000"></div>

                <div className="absolute top-8 -right-8 bg-white p-4 rounded-xl shadow-lg transform rotate-12 hover:rotate-6 transition-transform duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                    <span className="text-sm font-semibold text-gray-800">
                      Fresh & Hot
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="menu">
        <MenuPreview />
      </section>

      <section id="special-offer">
        <SpecialOffer />
      </section>

      <section id="special-offer-sandwich">
        <SpecialOfferSandwich />
      </section>

      <section id="testimonials">
        <Testimonials />
      </section>

      <section id="reservation">
        <ReservationCTA />
      </section>
    </div>
  );
};

export default Home;
