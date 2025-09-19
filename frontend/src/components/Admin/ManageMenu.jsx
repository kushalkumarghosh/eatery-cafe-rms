import { useEffect, useState } from "react";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";

const ManageMenu = () => {
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imgUrl: null,
  });

  const categories = [
    { value: "appetizers", label: "Appetizers" },
    { value: "main course", label: "Main Course" },
    { value: "desserts", label: "Desserts" },
    { value: "drinks", label: "Drinks" },
  ];

  const fetchMenu = async () => {
    try {
      const res = await axios.get("/api/menu");
      setMenu(res.data);
    } catch (err) {
      toast.error("Failed to fetch menu.");
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.imgUrl) {
      toast.error("Image is required.");
      return;
    }
    if (!newItem.category) {
      toast.error("Category is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", newItem.name);
    formData.append("description", newItem.description);
    formData.append("price", newItem.price);
    formData.append("category", newItem.category);
    formData.append("image", newItem.imgUrl);

    try {
      await axios.post("/api/menu", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Menu item added!");
      setNewItem({
        name: "",
        description: "",
        price: "",
        category: "",
        imgUrl: null,
      });
      fetchMenu();
    } catch (err) {
      toast.error("Failed to add menu item.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`/api/menu/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Menu item deleted!");
      fetchMenu();
    } catch (err) {
      toast.error("Failed to delete menu item.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Menu Management</h2>

      <form
        onSubmit={handleAdd}
        className="mb-8 bg-[#FFF8E1] p-6 rounded-lg shadow-md"
      >
        <h4 className="text-lg font-semibold mb-4 text-[#8A4B08]">
          Add New Menu Item
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Food Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="w-full border border-[#FF9130] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9130] focus:border-transparent"
            required
          />

          <select
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
            className="w-full border border-[#FF9130] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9130] focus:border-transparent"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          placeholder="Description"
          value={newItem.description}
          onChange={(e) =>
            setNewItem({ ...newItem, description: e.target.value })
          }
          className="w-full border border-[#FF9130] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#FF9130] focus:border-transparent h-24 resize-none"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="number"
            placeholder="Price ($)"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            className="w-full border border-[#FF9130] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9130] focus:border-transparent"
            required
            min="0"
            step="0.01"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setNewItem({ ...newItem, imgUrl: e.target.files[0] })
            }
            className="w-full border border-[#FF9130] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9130] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#FF9130] file:text-white hover:file:bg-[#E07B00]"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#FF9130] hover:bg-[#E07B00] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF9130] focus:ring-offset-2"
        >
          Add Menu Item
        </button>
      </form>

      <h2 className="text-3xl font-bold mb-6">All Menu Items</h2>

      {menu.length === 0 ? (
        <p>No menu items found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">Image</th>
                <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">Name</th>
                <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">Description</th>
                <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">Category</th>
                <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">Price</th>
                <th className="py-2 px-4 border text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menu.map((item) => (
                <tr key={item._id}>
                  <td className="py-2 px-4 border text-center">
                    <div className="flex justify-center">
                      <img
                        src={item.imgUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded border border-gray-200"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 border text-center">{item.name}</td>
                  <td className="py-2 px-4 border max-w-xs text-center">
                    <div className="truncate" title={item.description}>
                      {item.description}
                    </div>
                  </td>
                  <td className="py-2 px-4 border capitalize text-center">
                    {item.category || "No Category"}
                  </td>
                  <td className="py-2 px-4 border text-center">${item.price}</td>
                  <td className="py-2 px-4 border text-center">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageMenu;