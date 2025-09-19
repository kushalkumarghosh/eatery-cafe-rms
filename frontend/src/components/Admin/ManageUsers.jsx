import { useEffect, useState } from "react";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const res = await axios.get("/api/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
        toast.error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching users:", err);

      if (err.response?.status === 401) {
        toast.error("Unauthorized. Please login again.");
        localStorage.removeItem("token");
      } else if (err.response?.status === 403) {
        toast.error("Access denied. Admin rights required.");
      } else {
        toast.error("Error fetching users. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, role, userName) => {
    if (role === "admin") {
      toast.error("Admin users cannot be deleted.");
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleteLoading(id);
      const token = localStorage.getItem("token");

      await axios.delete(`/api/auth/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== id));
      toast.success(`User "${userName}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting user:", err);

      if (err.response?.status === 404) {
        toast.error("User not found.");
      } else if (err.response?.status === 403) {
        toast.error("Cannot delete admin users.");
      } else {
        toast.error("Error deleting user. Please try again.");
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || user.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9130]"></div>
          <span className="ml-3 text-lg text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-6">User Management</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130]"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130]"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredAndSortedUsers.length} of {users.length} users
          {searchTerm && ` matching "${searchTerm}"`}
          {filterRole !== "all" && ` with role "${filterRole}"`}
        </p>
      </div>

      {filteredAndSortedUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No users found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterRole !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No users available"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    className="py-2 px-4 border text-center text-sm font-semibold text-gray-600"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center justify-center">
                      Name
                      {sortBy === "name" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="py-2 px-4 border text-center text-sm font-semibold text-gray-600"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center justify-center">
                      Email
                      {sortBy === "email" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Role
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Phone
                  </th>
                  <th
                    className="py-2 px-4 border text-center text-sm font-semibold text-gray-600"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center justify-center">
                      Joined
                      {sortBy === "createdAt" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-25"
                    }`}
                  >
                    <td className="py-2 px-4 border text-center">
                      <div className="flex items-center justify-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-[#FF9130] flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          {user.address && (
                            <div
                              className="text-sm text-gray-500 truncate max-w-xs"
                              title={user.address}
                            >
                              {user.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-4 border text-center text-sm text-gray-900">
                      {user.phone || "N/A"}
                    </td>
                    <td className="py-2 px-4 border text-center text-sm text-gray-500">
                      {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                    </td>
                    <td className="py-2 px-4 border text-center text-sm font-medium">
                      <button
                        onClick={() =>
                          handleDelete(user._id, user.role, user.name)
                        }
                        disabled={
                          user.role === "admin" || deleteLoading === user._id
                        }
                        className={`inline-flex items-center px-3 py-1 rounded font-medium text-sm transition-colors ${
                          user.role === "admin"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : deleteLoading === user._id
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {deleteLoading === user._id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
