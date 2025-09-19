import { useEffect, useState } from "react";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchOrders = async (page = 1, showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const res = await axios.get(`/api/orders?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // Handle both old and new response formats
      if (res.data.orders) {
        setOrders(res.data.orders);
        setPagination(res.data.pagination);
      } else {
        setOrders(res.data);
      }

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Fetch orders error:", err);

      if (err.code === "ECONNABORTED") {
        toast.error("Request timeout. Please try again.");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (err.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment.");
      } else if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        toast.error(
          `Failed to load orders. Retrying... (${retryCount + 1}/${maxRetries})`
        );
        setTimeout(() => fetchOrders(page, false), 2000);
        return;
      } else {
        toast.error("Failed to load orders after multiple attempts.");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async (id, orderNumber) => {
    if (
      !window.confirm(
        `Are you sure you want to delete order ${
          orderNumber || id
        }? This action cannot be undone.`
      )
    )
      return;

    setDeleteLoading(id);

    try {
      await axios.delete(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 10000,
      });

      setOrders((prev) => prev.filter((order) => order._id !== id));

      // Update pagination count
      setPagination((prev) => ({
        ...prev,
        count: prev.count - 1,
      }));

      toast.success("Order deleted successfully.");
    } catch (err) {
      console.error("Delete order error:", err);

      if (err.code === "ECONNABORTED") {
        toast.error("Delete request timeout. Please try again.");
      } else if (err.response?.status === 401) {
        toast.error("Unauthorized. Please login again.");
      } else if (err.response?.status === 404) {
        toast.error("Order not found. It may have been already deleted.");
        setOrders((prev) => prev.filter((order) => order._id !== id));
      } else if (err.response?.status === 429) {
        toast.error("Too many requests. Please wait before trying again.");
      } else {
        toast.error("Failed to delete order. Please try again.");
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchOrders(newPage);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (err) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    try {
      return `${Number(amount).toFixed(2)}`;
    } catch (err) {
      return `${amount}`;
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">All Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found.</p>
          <button
            onClick={() => fetchOrders(1)}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Reload Orders
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {orders.length} orders
            {pagination.count > 0 && ` of ${pagination.count} total`}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Order #
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    User Email
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Total Amount
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Items
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Address
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Created
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border font-mono text-xs">
                      {order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="py-2 px-4 border">{order.userEmail}</td>
                    <td className="py-2 px-4 border font-semibold">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-2 px-4 border">
                      <div className="max-w-xs">
                        {order.items
                          .map((item) => `${item.name} (×${item.quantity})`)
                          .join(", ")}
                      </div>
                    </td>
                    <td className="py-2 px-4 border">
                      <div className="max-w-xs truncate" title={order.address}>
                        {order.address}
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2 px-4 border">
                      <button
                        onClick={() =>
                          handleDelete(order._id, order.orderNumber)
                        }
                        disabled={deleteLoading === order._id}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          deleteLoading === order._id
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {deleteLoading === order._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>

              <span className="px-4 py-1">
                Page {currentPage} of {pagination.total}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.total}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageOrders;
