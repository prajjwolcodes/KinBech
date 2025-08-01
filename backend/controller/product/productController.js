import Product from "../../models/productModel.js";

export async function createProduct(req, res) {
  if (req.user.role !== "seller") {
    return res
      .status(403)
      .json({ message: "Access denied. Only sellers can create products." });
  }

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
      imageUrl: req.file
        ? `/uploads/${req.file.filename}`
        : imageUrl || "/placeholder.svg?height=200&width=200&text=Product",
      sellerId: req.user._id,
    });

    await newProduct.save();

    // ✅ populate categoryId so frontend always has object, not just ID
    await newProduct.populate("categoryId");

    return res.status(201).json({
      message: "Product Created Successfully",
      product: newProduct, // ✅ use "product" key instead of "newProduct"
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function getAllProducts(req, res) {
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
        .json({ message: "No products found for this seller", products: [] });
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
        name: name ?? product.name,
        description: description ?? product.description,
        price: price ?? product.price,
        categoryId: categoryId ?? product.categoryId,
        count: count ?? product.count,
        imageUrl: imageUrl ?? product.imageUrl,
      },
      { new: true }
    ).populate("categoryId"); // ✅ populate categoryId like in create

    return res.status(200).json({
      message: "Product Updated Successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await Product.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product Deleted Successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}
