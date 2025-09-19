import React from "react";
import { Typography } from "@material-tailwind/react";
import logo from "../../assets/logo_cafe.png";

const Footer = () => {
  return (
    <footer className="w-full bg-[#fdd579] py-6 px-6 border-t border-[#8A4B08]">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          {/* Logo and Company Info */}
          <div className="flex flex-col items-start lg:w-2/5">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="Eatery Cafe Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
            <Typography
              variant="small"
              className="text-[#8A4B08] mb-4 leading-relaxed"
            >
              Your partner in hospitality - Eatery Cafe helps you focus on great
              food and service while we handle the operations.
            </Typography>

            {/* Contact Info */}
            <div className="space-y-2">
              <Typography
                variant="small"
                className="text-[#5C2C06] font-medium flex items-center gap-2"
              >
                <span className="text-[#FF9130]">📧</span> eaterycafe@gmail.com
              </Typography>
              <Typography
                variant="small"
                className="text-[#5C2C06] font-medium flex items-center gap-2"
              >
                <span className="text-[#8A4B08]">☎️</span> +1 (555) 123-4567
              </Typography>
              <Typography
                variant="small"
                className="text-[#8A4B08] flex items-center gap-2"
              >
                <span className="text-[#5C2C06]">📍</span> California 62639,
                United States
              </Typography>
            </div>
          </div>

          {/* General Menu */}
          <div className="flex flex-col lg:w-1/5 lg:ml-12">
            <Typography variant="h6" className="text-[#5C2C06] font-bold mb-4">
              General
            </Typography>
            <ul className="space-y-3">
              {[
                { name: "Home", href: "/" },
                { name: "About", href: "/about" },
                { name: "Menu", href: "/menu" },
                { name: "Reservation", href: "/reservation" },
              ].map((item, index) => (
                <li key={index}>
                  <Typography
                    as="a"
                    href={item.href}
                    className="text-[#8A4B08] font-medium hover:text-[#FF9130] transition-colors text-sm cursor-pointer hover:translate-x-1 transform transition-transform duration-200"
                  >
                    {item.name}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-start lg:items-end lg:w-2/5">
            <Typography variant="h6" className="text-[#5C2C06] font-bold mb-4">
              Connect With Us
            </Typography>

            <div className="flex space-x-4 mb-4">
              <a
                href="#"
                className="w-10 h-10 bg-[#FF9130] rounded-full flex items-center justify-center text-white hover:bg-[#5C2C06] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                aria-label="Facebook"
              >
                <span className="text-base font-bold">f</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#FF9130] rounded-full flex items-center justify-center text-white hover:bg-[#5C2C06] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                aria-label="Twitter"
              >
                <span className="text-base font-bold">𝕏</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#FF9130] rounded-full flex items-center justify-center text-white hover:bg-[#5C2C06] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                aria-label="Instagram"
              >
                <span className="text-base font-bold">📷</span>
              </a>
            </div>

            {/* Business Hours */}
            <div className="text-left lg:text-right">
              <Typography
                variant="small"
                className="text-[#5C2C06] font-bold mb-2"
              >
                Business Hours
              </Typography>
              <Typography
                variant="small"
                className="text-[#8A4B08] font-medium"
              >
                Monday - Sunday
              </Typography>
              <Typography variant="small" className="text-[#8A4B08]">
                10:00 AM - 10:00 PM
              </Typography>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#8A4B08] mt-8 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <Typography variant="small" className="text-[#8A4B08] font-medium">
              © 2025 Eatery Cafe RMS. All rights reserved.
            </Typography>
            <Typography variant="small" className="text-[#8A4B08] font-medium">
              Designed with ❤️ for premium dining experience
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
