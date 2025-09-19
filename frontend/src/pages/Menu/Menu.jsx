import { useEffect, useState, useContext } from "react";
import axios from "../../api/axios.js";
import Slider from "react-slick";
import { useCart } from "../../hooks/useCart.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute left-[-2.5rem] top-1/2 transform -translate-y-1/2 bg-[#FF9130] text-white p-3 rounded-full opacity-80 hover:opacity-100 z-20 shadow-md transition-all duration-300"
  >
    ❮
  </button>
);

const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute right-[-2.5rem] top-1/2 transform -translate-y-1/2 bg-[#FF9130] text-white p-3 rounded-full opacity-80 hover:opacity-100 z-20 shadow-md transition-all duration-300"
  >
    ❯
  </button>
);

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState("all");
  const { addToCart } = useCart();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await axios.get("/api/menu");
        const items = res.data;
        console.log("Fetched menu items:", items); // Debug log
        const uniqueItems = Array.from(
          new Map(items.map((item) => [item._id, item])).values()
        );
        // Log categories present in data
        uniqueItems.forEach((item) =>
          console.log(
            `Item: ${item.name}, Category: ${item.category || "No category"}`
          )
        );
        setMenuItems(uniqueItems);
      } catch (err) {
        console.error("Failed to fetch menu:", err);
        toast.error("Failed to load menu");
      }
    };

    fetchMenuItems();
  }, []);

  const settings = {
    dots: true,
    infinite: menuItems.length > 6,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    arrows: true,
    autoplay: false,
    autoplaySpeed: 3000,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 3,
        },
      },
    ],
  };

  const filteredItems =
    category === "all"
      ? menuItems
      : menuItems.filter(
          (item) =>
            item.category &&
            item.category.toLowerCase() === category.toLowerCase()
        );

  const handleAddToCart = (item) => {
    if (!token) {
      toast.error("Please log in to add items to cart");
      navigate("/login");
      return;
    }
    addToCart(item);
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white">
      <Typography
        variant="h2"
        className="text-4xl font-bold mb-8 text-center text-[#5C2C06] border-b-2 border-[#FF9130] pb-2"
      >
        Our Menu
      </Typography>
      <div className="mb-6 flex justify-center gap-4">
        {["all", "Appetizers", "Main Course", "Desserts", "Drinks"].map(
          (cat) => (
            <Button
              key={cat}
              onClick={() => setCategory(cat.toLowerCase())}
              className={`${
                category === cat.toLowerCase()
                  ? "bg-[#FF9130] text-white"
                  : "bg-[#FFF8E1] text-[#8A4B08] hover:bg-[#FF9130] hover:text-white"
              } rounded-md py-2 px-4 transition-all duration-300`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          )
        )}
      </div>
      {filteredItems.length === 0 ? (
        <p className="text-center text-[#8A4B08]">
          No menu items available in this category.
        </p>
      ) : (
        <div className="relative">
          <Slider {...settings}>
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="px-2 transform transition-all duration-300 hover:scale-105"
              >
                <div className="bg-[#FFF8E1] shadow-lg p-4 rounded-xl text-center border border-[#FF9130]">
                  <img
                    src={item.imgUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4 mx-auto"
                    onError={(e) => {
                      console.error(`Image load error: ${item.imgUrl}`);
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                  <Typography
                    variant="h6"
                    className="text-[#5C2C06] font-semibold mb-2"
                  >
                    {item.name}
                  </Typography>
                  <Typography variant="small" className="text-[#8A4B08] mb-2">
                    {item.description}
                  </Typography>
                  <Typography
                    variant="h6"
                    className="font-bold text-[#FF9130] mb-4"
                  >
                    ${item.price}
                  </Typography>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full rounded-md bg-[#FF9130] hover:bg-[#E07B00] py-2 text-white transition-colors duration-300"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
};

export default Menu;
