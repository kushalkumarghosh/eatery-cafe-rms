import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [shownToasts, setShownToasts] = useState(new Set());

  const showReservationToast = () => {
    toast.success("Thanks for reservation. Your reservation is pending approval.", {
      duration: 7000,
      position: 'top-right',
      style: {
        background: '#FFF3E0',
        color: '#5C2C06',
        border: '1px solid #FF9130',
        padding: '12px',
        fontWeight: '500'
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log('No token found - user not authenticated');
      return;
    }

    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id;
    } catch (error) {
      console.error('Invalid token format:', error);
      return;
    }

    const newSocket = io("http://localhost:5000", {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit("register", userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on("new_notification", (notification) => {
      console.log('Received new notification:', notification);
      
      const notificationKey = `${notification.type}_${notification.data?.reservationId}_${notification.data?.status}`;
      
      if (!shownToasts.has(notificationKey)) {
        let toastStyle = {
          background: '#FFF3E0',
          color: '#5C2C06',
          border: '1px solid #FF9130',
          padding: '12px',
          fontWeight: '500'
        };

        if (notification.priority === 'high' || notification.data?.status === 'cancelled') {
          toastStyle = {
            background: '#FFEBEE',
            color: '#C62828',
            border: '1px solid #F44336',
            padding: '12px',
            fontWeight: '500'
          };
        } else if (notification.data?.status === 'confirmed') {
          toastStyle = {
            background: '#E8F5E8',
            color: '#2E7D32',
            border: '1px solid #4CAF50',
            padding: '12px',
            fontWeight: '500'
          };
        } else if (notification.data?.status === 'completed') {
          toastStyle = {
            background: '#E3F2FD',
            color: '#1565C0',
            border: '1px solid #2196F3',
            padding: '12px',
            fontWeight: '500'
          };
        }

        toast.success(notification.message, {
          duration: 7000,
          position: 'top-right',
          style: toastStyle
        });

        setShownToasts(prev => new Set(prev).add(notificationKey));
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [shownToasts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShownToasts(new Set());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    showReservationToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};