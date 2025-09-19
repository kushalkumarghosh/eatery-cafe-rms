import React, { useState, useEffect } from "react";
import { Typography } from "@material-tailwind/react";

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      quote:
        "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
      name: "Caitlyn King",
      position: "Head of Design, Layerr",
      avatar:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 5,
    },
    {
      id: 2,
      quote:
        "Great taste, smooth ordering, and a team that truly cares about customers.",
      name: "Michael Chen",
      position: "Software Engineer, TechCorp",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      rating: 5,
    },
    {
      id: 3,
      quote: "The food is always spot on, and the service never disappoints.",
      name: "Sarah Johnson",
      position: "Marketing Director, Creative Co",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
      rating: 5,
    },
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`text-xl ${
          index < rating ? "text-orange-400" : "text-gray-600"
        }`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="w-full py-20 mt-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-gray-900 rounded-3xl py-20 px-8 relative overflow-hidden">
          {/* Content Container */}
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Testimonial Content */}
            <div className="mb-16">
              <div className="relative min-h-[280px] flex items-center justify-center">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === activeTestimonial
                        ? "opacity-100 transform translate-y-0"
                        : "opacity-0 transform translate-y-8"
                    }`}
                  >
                    {/* Quote */}
                    <div className="mb-12">
                      <Typography
                        variant="paragraph"
                        className="text-white text-2xl lg:text-3xl leading-relaxed italic max-w-4xl mx-auto font-light tracking-wide"
                      >
                        "{testimonial.quote}"
                      </Typography>
                    </div>

                    {/* Customer Info */}
                    <div className="flex flex-col items-center">
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-6 ring-4 ring-orange-400 ring-opacity-30">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Name */}
                      <Typography
                        variant="h4"
                        className="text-white font-semibold text-xl mb-2"
                      >
                        {testimonial.name}
                      </Typography>

                      {/* Position */}
                      <Typography
                        variant="paragraph"
                        className="text-gray-400 text-base mb-4"
                      >
                        {testimonial.position}
                      </Typography>

                      {/* Rating */}
                      <div className="flex space-x-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial
                      ? "bg-white shadow-lg shadow-white/30"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
