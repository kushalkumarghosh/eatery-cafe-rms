import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Select,
  Option,
  Input,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";

const ManageReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: "",
    status: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const statusColors = {
    pending: "amber",
    confirmed: "green",
    cancelled: "red",
    completed: "blue",
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.status) params.append("status", filters.status);
      params.append("page", filters.page);
      params.append("limit", "20");

      const res = await axios.get(`/api/reservations?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.reservations) {
        setReservations(res.data.reservations);
        setPagination(
          res.data.pagination || {
            current: 1,
            pages: 1,
            total: res.data.reservations.length,
          }
        );
      } else {
        setReservations(res.data);
        setPagination({ current: 1, pages: 1, total: res.data.length });
      }
    } catch (err) {
      console.error("Fetch reservations error:", err);
      toast.error("Failed to load reservations.");
    }
    setLoading(false);
  };

  const handleStatusChange = async () => {
    if (!selectedReservation || !newStatus) return;

    try {
      await axios.put(
        `/api/reservations/${selectedReservation._id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setReservations((prev) =>
        prev.map((res) =>
          res._id === selectedReservation._id
            ? { ...res, status: newStatus }
            : res
        )
      );

      toast.success(`Reservation ${newStatus} successfully`);
      setShowStatusDialog(false);
      setSelectedReservation(null);
      setNewStatus("");
    } catch (err) {
      console.error("Status change error:", err);
      toast.error("Failed to update reservation status.");
    }
  };

  const handleDelete = async () => {
    if (!selectedReservation) return;

    try {
      await axios.delete(`/api/reservations/${selectedReservation._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setReservations((prev) =>
        prev.filter((r) => r._id !== selectedReservation._id)
      );
      toast.success("Reservation deleted successfully.");
      setShowDeleteDialog(false);
      setSelectedReservation(null);
    } catch (err) {
      console.error("Delete reservation error:", err);
      const errorMsg =
        err.response?.data?.msg || "Failed to delete reservation.";
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const getTotalGuests = () => {
    return reservations
      .filter((res) => res.status === "confirmed")
      .reduce((total, res) => total + res.guests, 0);
  };

  const getTableSizeStats = () => {
    const stats = { small: 0, medium: 0, large: 0, vip: 0 };
    reservations
      .filter((res) => res.status === "confirmed")
      .forEach((res) => {
        // Fix: Use Object.prototype.hasOwnProperty.call instead of direct access
        if (res.tableSize && Object.prototype.hasOwnProperty.call(stats, res.tableSize)) {
          stats[res.tableSize]++;
        }
      });
    return stats;
  };

  useEffect(() => {
    fetchReservations();
  }, [filters]);

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Add filter handlers that are actually used
  const handleDateFilter = (date) => {
    setFilters((prev) => ({
      ...prev,
      date,
      page: 1,
    }));
  };

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({
      ...prev,
      status,
      page: 1,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9130]"></div>
      </div>
    );
  }

  const tableStats = getTableSizeStats();

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-6">Manage Reservations</h2>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          type="date"
          label="Filter by Date"
          value={filters.date}
          onChange={(e) => handleDateFilter(e.target.value)}
          crossOrigin=""
        />
        <Select
          label="Filter by Status"
          value={filters.status}
          onChange={(value) => handleStatusFilter(value)}
        >
          <Option value="">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="confirmed">Confirmed</Option>
          <Option value="cancelled">Cancelled</Option>
          <Option value="completed">Completed</Option>
        </Select>
        <Button
          onClick={() => {
            setFilters({ date: "", status: "", page: 1 });
          }}
          variant="outlined"
          className="border-[#FF9130] text-[#FF9130]"
        >
          Clear Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <Typography variant="h4" color="blue-gray">
              {reservations.length}
            </Typography>
            <Typography color="gray">Total Reservations</Typography>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Typography variant="h4" color="green">
              {reservations.filter((r) => r.status === "confirmed").length}
            </Typography>
            <Typography color="gray">Confirmed</Typography>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Typography variant="h4" color="orange">
              {getTotalGuests()}
            </Typography>
            <Typography color="gray">Total Guests</Typography>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Typography variant="h4" color="purple">
              {Object.values(tableStats).reduce((a, b) => a + b, 0)}
            </Typography>
            <Typography color="gray">Tables Booked</Typography>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <Typography color="gray">No reservations found.</Typography>
            </div>
          ) : (
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Contact
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Date & Time
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Guests
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Table
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation, index) => (
                  <tr
                    key={reservation._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-25"}
                  >
                    <td className="py-2 px-4 border text-center">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-medium"
                        >
                          {reservation.name}
                        </Typography>
                        {reservation.user?.name &&
                          reservation.user.name !== reservation.name && (
                            <Typography
                              variant="small"
                              color="gray"
                              className="text-xs"
                            >
                              Account: {reservation.user.name}
                            </Typography>
                          )}
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <div>
                        <Typography variant="small" color="blue-gray">
                          {reservation.email}
                        </Typography>
                        <Typography variant="small" color="gray">
                          {reservation.phone}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-medium"
                        >
                          {formatDate(reservation.date)}
                        </Typography>
                        <Typography variant="small" color="gray">
                          {formatTime(reservation.time)}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <Typography variant="small" color="blue-gray">
                        {reservation.guests}
                      </Typography>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <Chip
                        variant="ghost"
                        color="blue-gray"
                        size="sm"
                        value={reservation.tableSize || "standard"}
                        className="capitalize"
                      />
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <Chip
                        variant="ghost"
                        color={statusColors[reservation.status] || "gray"}
                        size="sm"
                        value={reservation.status}
                        className="capitalize"
                      />
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setNewStatus(reservation.status);
                            setShowStatusDialog(true);
                          }}
                          size="sm"
                          variant="outlined"
                          className="border-[#FF9130] text-[#FF9130]"
                        >
                          Status
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowDeleteDialog(true);
                          }}
                          size="sm"
                          color="red"
                          variant="outlined"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            disabled={pagination.current === 1}
            onClick={() => handlePageChange(pagination.current - 1)}
            variant="outlined"
            size="sm"
          >
            Previous
          </Button>
          <Typography variant="small" color="gray">
            Page {pagination.current} of {pagination.pages} ({pagination.total}{" "}
            total)
          </Typography>
          <Button
            disabled={pagination.current === pagination.pages}
            onClick={() => handlePageChange(pagination.current + 1)}
            variant="outlined"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={showStatusDialog}
        handler={() => setShowStatusDialog(false)}
      >
        <DialogHeader>Update Reservation Status</DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <Typography>
              Change status for <strong>{selectedReservation?.name}</strong>'s
              reservation?
            </Typography>
            <Select
              label="New Status"
              value={newStatus}
              onChange={(value) => setNewStatus(value)}
            >
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setShowStatusDialog(false)}
            className="mr-1"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={handleStatusChange}
            disabled={!newStatus}
          >
            Update Status
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        handler={() => setShowDeleteDialog(false)}
      >
        <DialogHeader>Delete Reservation</DialogHeader>
        <DialogBody>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedReservation?.name}</strong>'s reservation?
          </Typography>
          <Typography color="red" className="mt-2 text-sm">
            This action cannot be undone.
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="blue-gray"
            onClick={() => setShowDeleteDialog(false)}
            className="mr-1"
          >
            Cancel
          </Button>
          <Button variant="gradient" color="red" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ManageReservations;