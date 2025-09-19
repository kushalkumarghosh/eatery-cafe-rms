import { createContext, useState, useCallback, useRef, useEffect } from "react";

export const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cartUpdateQueue = useRef([]);
  const isProcessingQueue = useRef(false);

  // Process cart update queue to prevent race conditions
  const processCartUpdateQueue = useCallback(async () => {
    if (isProcessingQueue.current || cartUpdateQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    setIsLoading(true);

    try {
      while (cartUpdateQueue.current.length > 0) {
        const updateFn = cartUpdateQueue.current.shift();
        await new Promise(resolve => {
          setCart(prevCart => {
            const newCart = updateFn(prevCart);
            resolve();
            return newCart;
          });
        });
        
        // Small delay to prevent too rapid updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      isProcessingQueue.current = false;
      setIsLoading(false);
    }
  }, []);

  // Queue cart updates to prevent race conditions
  const queueCartUpdate = useCallback((updateFn) => {
    cartUpdateQueue.current.push(updateFn);
    processCartUpdateQueue();
  }, [processCartUpdateQueue]);

  const addToCart = useCallback((item) => {
    if (!item || !item._id) {
      console.error('Invalid item provided to addToCart');
      return;
    }

    queueCartUpdate((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem._id === item._id
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1,
          updatedAt: new Date().toISOString()
        };
        return newCart;
      } else {
        // New item, add to cart
        const newItem = {
          ...item,
          quantity: 1,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return [...prevCart, newItem];
      }
    });
  }, [queueCartUpdate]);

  const removeFromCart = useCallback((id) => {
    if (!id) {
      console.error('No ID provided to removeFromCart');
      return;
    }

    queueCartUpdate((prevCart) => {
      return prevCart.filter((item) => item._id !== id);
    });
  }, [queueCartUpdate]);

  const updateQuantity = useCallback((id, newQuantity) => {
    if (!id || newQuantity < 0) {
      console.error('Invalid parameters provided to updateQuantity');
      return;
    }

    queueCartUpdate((prevCart) => {
      if (newQuantity === 0) {
        // Remove item if quantity is 0
        return prevCart.filter((item) => item._id !== id);
      }

      const itemIndex = prevCart.findIndex((item) => item._id === id);
      if (itemIndex === -1) {
        console.warn('Item not found in cart for quantity update');
        return prevCart;
      }

      const newCart = [...prevCart];
      newCart[itemIndex] = {
        ...newCart[itemIndex],
        quantity: Math.max(1, Math.floor(newQuantity)), // Ensure positive integer
        updatedAt: new Date().toISOString()
      };
      return newCart;
    });
  }, [queueCartUpdate]);

  const clearCart = useCallback(() => {
    queueCartUpdate(() => []);
  }, [queueCartUpdate]);

  // Get cart statistics
  const getCartStats = useCallback(() => {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const uniqueItems = cart.length;

    return {
      totalItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      uniqueItems,
      isEmpty: cart.length === 0
    };
  }, [cart]);

  // Check if item exists in cart
  const isInCart = useCallback((itemId) => {
    return cart.some(item => item._id === itemId);
  }, [cart]);

  // Get item quantity in cart
  const getItemQuantity = useCallback((itemId) => {
    const item = cart.find(cartItem => cartItem._id === itemId);
    return item ? item.quantity : 0;
  }, [cart]);

  // Validate cart items (remove invalid items)
  const validateCart = useCallback(() => {
    queueCartUpdate((prevCart) => {
      return prevCart.filter(item => {
        // Remove items without required fields
        if (!item._id || !item.name || !item.price || !item.quantity) {
          console.warn('Removing invalid item from cart:', item);
          return false;
        }
        
        // Remove items with invalid quantity or price
        if (item.quantity <= 0 || item.price <= 0) {
          console.warn('Removing item with invalid quantity/price:', item);
          return false;
        }
        
        return true;
      });
    });
  }, [queueCartUpdate]);

  // Run cart validation on cart changes
  useEffect(() => {
    if (cart.length > 0) {
      // Debounce validation to prevent excessive calls
      const validationTimeout = setTimeout(validateCart, 1000);
      return () => clearTimeout(validationTimeout);
    }
  }, [cart.length, validateCart]);

  const contextValue = {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartStats,
    isInCart,
    getItemQuantity,
    validateCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;