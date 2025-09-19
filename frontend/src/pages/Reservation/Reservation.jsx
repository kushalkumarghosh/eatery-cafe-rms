import { useState, useContext, useEffect } from "react";
import {
  Typography,
  Button,
  Input,
  Select,
  Option,
  Alert,
} from "@material-tailwind/react";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

const Reservation = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    message: "",
  });

  const [availability, setAvailability] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, date: today }));

    // Pre-fill user data if logged in
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Debounced availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.date && formData.time && formData.guests) {
        checkAvailability();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.date, formData.time, formData.guests]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset availability when key fields change
    if (["date", "time", "guests"].includes(field)) {
      setAvailability(null);
      setShowAvailability(false);
    }
  };

  const checkAvailability = async () => {
    if (!formData.date || !formData.time || !formData.guests) return;

    setIsCheckingAvailability(true);
    try {
      const response = await axios.get("/api/reservations/availability", {
        params: {
          date: formData.date,
          time: formData.time,
          guests: parseInt(formData.guests),
        },
      });

      setAvailability(response.data);
      setShowAvailability(true);
    } catch (err) {
      console.error("Availability check failed:", err);
      toast.error("Failed to check availability");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please log in to make a reservation");
      navigate("/login", {
        state: { redirectTo: "/reservation" },
      });
      return;
    }

    // Final validation
    const { name, email, phone, date, time, guests } = formData;
    if (!name || !email || !phone || !date || !time || !guests) {
      toast.error("Please fill out all required fields");
      return;
    }

    const guestsNum = parseInt(guests);
    if (isNaN(guestsNum) || guestsNum <= 0 || guestsNum > 20) {
      toast.error("Number of guests must be between 1 and 20");
      return;
    }

    // Check if availability was verified
    if (!availability || !availability.available) {
      toast.error("Please select an available time slot");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "/api/reservations",
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          date,
          time,
          guests: guestsNum,
          message: formData.message.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reset form
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
        guests: "",
        message: "",
      });
      setAvailability(null);
      setShowAvailability(false);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to make reservation";
      toast.error(errorMsg, {
        style: {
          background: "#FFEBEE",
          color: "#C62828",
          border: "1px solid #F44336",
          padding: "12px",
          fontWeight: "500",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options (10 AM to 9:30 PM, 30-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 10; hour < 22; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 21) {
        // Don't add 9:30 PM as it's too late
        times.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return times;
  };

  const getAvailabilityColor = () => {
    if (!availability) return "gray";
    return availability.available ? "green" : "red";
  };

  const getAvailabilityMessage = () => {
    if (isCheckingAvailability) return "Checking availability...";
    if (!availability) return "";

    if (availability.available) {
      return `✓ Available! ${availability.availableSlots} of ${availability.totalSlots} ${availability.requiredTableSize} tables remaining.`;
    } else {
      return `✗ Sorry, no ${availability.requiredTableSize} tables available for ${availability.guests} guests at this time.`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-10 z-0"></div>

      <div className="relative z-10">
        <Typography
          variant="h2"
          className="text-4xl font-bold mb-10 text-[#5C2C06] text-center border-b-2 border-[#FF9130] pb-4"
        >
          Book Your Table
        </Typography>

        <div className="bg-[#FFF8E1] p-8 rounded-xl shadow-lg border border-[#FF9130]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                type="text"
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                disabled={isSubmitting}
                crossOrigin=""
              />
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isSubmitting}
                crossOrigin=""
              />
              <Input
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                disabled={isSubmitting}
                crossOrigin=""
              />
            </div>

            {/* Reservation Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                type="date"
                label="Reservation Date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                disabled={isSubmitting}
                crossOrigin=""
              />

              <div className="w-full">
                <Select
                  label="Reservation Time"
                  value={formData.time}
                  onChange={(value) => handleInputChange("time", value)}
                  disabled={isSubmitting}
                >
                  {generateTimeOptions().map((time) => (
                    <Option key={time} value={time}>
                      {time}
                    </Option>
                  ))}
                </Select>
              </div>

              <Input
                type="number"
                label="Number of Guests"
                value={formData.guests}
                onChange={(e) => handleInputChange("guests", e.target.value)}
                required
                min="1"
                max="20"
                disabled={isSubmitting}
                crossOrigin=""
              />
            </div>

            {/* Availability Status */}
            {showAvailability && (
              <Alert
                color={getAvailabilityColor()}
                className="flex items-center space-x-2"
              >
                <span>{getAvailabilityMessage()}</span>
              </Alert>
            )}

            {/* Message */}
            <div>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:border-[#FF9130] min-h-[100px]"
                placeholder="Special requests or dietary requirements (optional)"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !availability?.available ||
                  isCheckingAvailability
                }
                className="w-1/3 rounded-md bg-[#FF9130] hover:bg-[#E07B00] py-3 text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? "Submitting..." : "Submit Reservation"}
              </Button>
            </div>

            {/* Business Hours Info */}
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>Business Hours: 10:00 AM - 10:00 PM</p>
              <p>
                Your reservation will be pending approval. You'll be notified
                once confirmed.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Reservation;
