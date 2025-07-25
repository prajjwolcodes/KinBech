import e from "express";
import Product from "../../models/productModel.js";

export async function getAllProducts(req, res) {
  console.log(req.user);
  try {
    const products = await Product.find()
      .populate("categoryId")
      .populate("sellerId");
    return res
      .status(200)
      .json({ message: "All Products Retrieved", products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function getProductsByCategory(req, res) {
  const { categoryId } = req.params;
  try {
    const products = await Product.find({ categoryId })
      .populate("categoryId")
      .populate("sellerId");
    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in this category" });
    }
    return res
      .status(200)
      .json({ message: "Products Retrieved by Category", products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function getProductsBySeller(req, res) {
  const sellerId = req.user._id;
  try {
    const products = await Product.find({ sellerId })
      .populate("categoryId")
      .populate("sellerId");
    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this seller" });
    }
    return res
      .status(200)
      .json({ message: "All Products Retrieved by Seller", products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function getProductById(req, res) {
  const { id } = req.params;
  try {
    const product = await Product.findById(id)
      .populate("categoryId")
      .populate("sellerId");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res
      .status(200)
      .json({ message: "Product Retrieved by id", product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function createProduct(req, res) {
  console.log(req.user);
  const { name, description, price, categoryId, count, imageUrl } = req.body;
  if (!name || !description || !price || !categoryId) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const newProduct = new Product({
      name,
      description,
      price,
      categoryId,
      count: count || 1,
      imageUrl,
      sellerId: req.user._id, // Assuming user ID is available in req.user
    });
    await newProduct.save();
    return res
      .status(201)
      .json({ message: "Product Created Successfully", newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, price, categoryId, count, imageUrl } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        description: description || product.description,
        price: price || product.price,
        categoryId: categoryId || product.categoryId,
        count: count || product.count,
        imageUrl: imageUrl || product.imageUrl,
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Product Updated Successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}
