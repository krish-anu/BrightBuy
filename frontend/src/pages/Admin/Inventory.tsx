import React, { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { getAllProducts } from "@/services/product.services";
import { getAllCategories } from "@/services/category.services";

// Icon props
interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

// API product variant type
interface ProductVariant {
  id: number;
  variantName: string;
  price: number;
  stockQnt: number;
}

// API product type
interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  Categories: { id: number; name: string }[];
  ProductVariants: ProductVariant[];
}

// Flattened variant type used in state
interface ProductVariantFlattened extends ProductVariant {
  productName: string;
  brand: string;
  categories: string;
}

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [products, setProducts] = useState<ProductVariantFlattened[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Icon component
  const IconComponent: React.FC<IconComponentProps> = ({
    iconName,
    size = 20,
  }) => {
    const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
    return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
  };

  // Load products from API and flatten variants
  const loadProducts = async () => {
    const res = await getAllProducts();
    if (res.success) {
      const flattened: ProductVariantFlattened[] = res.data.flatMap(
        (product: Product) =>
          product.ProductVariants.map((variant) => ({
            ...variant,
            productName: product.name,
            brand: product.brand,
            categories:
              product.Categories.map((c) => c.name).join(", ") ||
              "Uncategorized",
          })),
      );
      setProducts(flattened);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(
    (p) =>
      (p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variantName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === "" || p.categories.includes(filterCategory)),
  );

  const loadCategories = async () => {
    try {
      const categories = await getAllCategories();

      setCategories(
        categories.data.map((cat: { id: number; name: string }) => cat.name),
      );
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Stock status helper
  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock <= 10)
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };
  useEffect(() => {
    loadProducts();
    loadCategories();
    console.log("categories", categories);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Inventory Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your product inventory and stock levels
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products or variant..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconComponent iconName="Search" size={16} />
            </div>
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <IconComponent iconName="Plus" size={16} />
            <span className="ml-2">Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((p) => {
                const stockStatus = getStockStatus(p.stockQnt);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {p.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {p.variantName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {p.brand}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {p.categories}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${p.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {p.stockQnt}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <IconComponent iconName="Edit" size={16} />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <IconComponent iconName="Package" size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <IconComponent iconName="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <IconComponent iconName="Package" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {products.length}
              </div>
              <div className="text-sm text-gray-500">Total Products</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <IconComponent iconName="AlertTriangle" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {products.filter((p) => p.stockQnt <= 10).length}
              </div>
              <div className="text-sm text-gray-500">Low Stock Items</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <IconComponent iconName="DollarSign" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                $
                {products
                  .reduce((sum, p) => sum + p.price * p.stockQnt, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
