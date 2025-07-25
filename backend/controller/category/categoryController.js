import Category from "../../models/categoryModel.js";

export async function getAllCategories(req, res) {
  try {
    const categories = await Category.find();
    return res
      .status(200)
      .json({ message: "All Categories Retrieved", categories });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch categories " || error.message });
  }
}

export async function createCategory(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const newCategory = new Category({ name });
    await newCategory.save();
    return res
      .status(201)
      .json({ message: "Category Created Successfully", newCategory });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create category" || error.message });
  }
}
export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res
      .status(200)
      .json({ message: "Category Updated Successfully", updatedCategory });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update category" || error.message });
  }
}
