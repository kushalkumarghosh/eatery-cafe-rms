import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios.js";
import { useCart } from "../../hooks/useCart.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { Button, Typography } from "@material-tailwind/react";
import toast from "react-hot-toast";

const MenuPreview = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const { addToCart } = useCart();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const res = await axios.get("/api/menu");
        const items = res.data;
        // Get unique items and limit to 8 for preview
        const uniqueItems = Array.from(
          new Map(items.map((item) => [item._id, item])).values()
        );
        // Take only first 8 items for homepage preview
        setFeaturedItems(uniqueItems.slice(0, 8));
      } catch (err) {
        console.error("Failed to fetch menu:", err);
        toast.error("Failed to load menu preview");
      }
    };

    fetchFeaturedItems();
  }, []);

  const handleAddToCart = (item) => {
    if (!token) {
      toast.error("Please log in to add items to cart");
      navigate("/login");
      return;
    }
    addToCart(item);
    toast.success(`${item.name} added to cart!`);
  };

  const handleViewFullMenu = () => {
    navigate("/menu");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-white">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <span className="mr-2">🍽️</span>
          FEATURED MENU
        </div>

        <Typography
          variant="h2"
          className="text-gray-800 font-bold text-3xl lg:text-4xl mb-4"
        >
          Our <span className="text-orange-500">Special Menu</span>
        </Typography>

        <Typography
          variant="paragraph"
          className="text-gray-600 text-lg max-w-2xl mx-auto"
        >
          Discover our chef's handpicked selection of the most popular and
          delicious dishes
        </Typography>
      </div>

      {/* Menu Grid */}
      {featuredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredItems.map((item, index) => (
              <div
                key={item._id}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 group"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Image */}
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={item.imgUrl}
                    alt={item.name}
                    className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = "/placeholder.jpg";
                    }}
                  />

                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ${item.price}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-3 rounded-lg font-semibold transition-colors duration-300 shadow-md hover:shadow-lg"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* View Full Menu Button */}
          <div className="text-center">
            <Button
              onClick={handleViewFullMenu}
              size="lg"
              className="bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              View Full Menu
              <span className="ml-2">→</span>
            </Button>

            <p className="text-gray-500 text-sm mt-3">
              Explore our complete collection of delicious dishes
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MenuPreview;
