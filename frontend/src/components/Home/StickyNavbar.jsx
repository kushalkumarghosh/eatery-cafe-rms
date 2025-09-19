import { useState, useEffect, useContext } from "react";
import {
  Navbar,
  Typography,
  IconButton,
  Collapse,
  Badge,
} from "@material-tailwind/react";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useCart } from "../../hooks/useCart.jsx";
import logo from "../../assets/logo_cafe.png";

const StickyNavbar = () => {
  const [openNav, setOpenNav] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const { token, role, logout } = useContext(AuthContext);
  const { cart } = useCart();
  const navigate = useNavigate();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const scrollToFooter = () => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Scroll detect
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => window.innerWidth >= 960 && setOpenNav(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col items-center gap-6 lg:mb-0 lg:mt-0 lg:flex-row lg:gap-10">
      {["Home", "About", "Menu", "Reservation", "Contact"].map((item) => (
        <Typography
          key={item}
          as="li"
          variant="small"
          color="blue-gray"
          className="text-lg font-medium"
        >
          {item === "Contact" ? (
            <button
              onClick={scrollToFooter}
              className="flex items-center text-[#5A3E36] hover:text-[#FF9130] transition-colors"
            >
              {item}
            </button>
          ) : (
            <Link
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className="flex items-center text-[#5A3E36] hover:text-[#FF9130] transition-colors"
            >
              {item}
            </Link>
          )}
        </Typography>
      ))}
    </ul>
  );

  const buttonStyle =
    "px-5 py-2 rounded-md font-medium transition-all duration-200 " +
    "bg-orange-500 text-[#5A3E36] hover:bg-orange-600";

  return (
    <Navbar
      className={`sticky top-0 z-50 h-max max-w-full rounded-none px-6 py-3 lg:px-12 lg:py-4 bg-white shadow-md transition-transform duration-300 ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Eatery Cafe Logo" className="h-16 w-auto" />
        </Link>

        <div className="hidden lg:flex">{navList}</div>

        <div className="flex items-center gap-5">
          {token ? (
            <>
              {role === "admin" && (
                <button
                  onClick={() => navigate("/admin-dashboard")}
                  className={buttonStyle}
                >
                  Dashboard
                </button>
              )}
              <button onClick={logout} className={buttonStyle}>
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className={buttonStyle}>
              Login
            </button>
          )}

          {/* Cart */}
          <Badge content={cartItemCount} invisible={cartItemCount === 0}>
            <IconButton
              variant="text"
              className="h-7 w-7 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCartIcon className="h-7 w-7 text-[#5A3E36]" />
            </IconButton>
          </Badge>

          {/* Mobile Menu Toggle */}
          <IconButton
            variant="text"
            className="ml-2 h-7 w-7 text-inherit lg:hidden"
            ripple={false}
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                className="h-7 w-7"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </IconButton>
        </div>
      </div>

      {/* Mobile Nav */}
      <Collapse open={openNav}>
        <div className="flex flex-col items-center gap-4 mt-4">
          {navList}
          {token ? (
            <>
              {role === "admin" && (
                <button
                  onClick={() => navigate("/admin-dashboard")}
                  className={buttonStyle + " w-32"}
                >
                  Dashboard
                </button>
              )}
              <button onClick={logout} className={buttonStyle + " w-32"}>
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className={buttonStyle + " w-32"}
            >
              Login
            </button>
          )}
          <button
            onClick={() => navigate("/cart")}
            className="w-32 px-5 py-2 rounded-md font-medium bg-[#FDCB58] text-[#5A3E36] hover:brightness-95"
          >
            Go to Cart
          </button>
        </div>
      </Collapse>
    </Navbar>
  );
};

export default StickyNavbar;
