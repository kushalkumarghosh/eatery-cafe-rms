const Menu = require("../models/Menu");
const cloudinary = require("../config/cloudinary.js");
const fs = require("fs/promises");

const uploadImageToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "menu_images",
    });
    return result.secure_url;
  } catch (err) {
    console.error("Error uploading image to Cloudinary:", err);
    throw new Error("Image upload to Cloudinary failed");
  } finally {
    try {
      await fs.unlink(filePath);
    } catch (unlinkErr) {
      console.error("Error deleting temporary file:", unlinkErr);
    }
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!req.file) {
      return res.status(400).send({ msg: "Image is required" });
    }
    if (!category) {
      return res.status(400).send({ msg: "Category is required" });
    }

    const imgUrl = await uploadImageToCloudinary(req.file.path);
    const menu = await Menu.create({
      name,
      description,
      price,
      imgUrl,
      category: category.toLowerCase(),
    });
    res.status(201).json(menu);
  } catch (err) {
    console.error("Error creating menu item:", err);
    res.status(500).send({ msg: "Error creating menu item" });
  }
};

const getMenuItems = async (req, res) => {
  try {
    const menuItems = await Menu.find();
    res.json(menuItems);
  } catch (err) {
    console.error("Error getting menu items:", err);
    res.status(500).send({ msg: "Server error" });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const menu = await Menu.findById(req.params.id);

    if (!menu) return res.status(404).send({ msg: "Menu item not found" });

    menu.name = name || menu.name;
    menu.description = description || menu.description;
    menu.price = price || menu.price;
    if (category) menu.category = category.toLowerCase();

    if (req.file) {
      const imageUrl = await uploadImageToCloudinary(req.file.path);
      menu.imgUrl = imageUrl;
    }

    await menu.save();
    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).send({ msg: "Server Error" });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);

    if (!menuItem) return res.status(404).send({ msg: "Menu item not found" });

    await menuItem.deleteOne();
    res.send({ msg: "Menu item deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ msg: "Server Error" });
  }
};

module.exports = {
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
};
