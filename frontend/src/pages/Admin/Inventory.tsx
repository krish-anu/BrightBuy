import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { getAllProducts, getProductsPaginated, getInventoryStats } from '@/services/product.services';
import { getAllCategories } from '@/services/category.services';

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

// API product type - updated based on actual API structure
interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  price?: number; // May exist on product level
  stockQnt?: number; // May exist on product level
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [products, setProducts] = useState<ProductVariantFlattened[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    totalVariants: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalInventoryValue: 0
  });  

  // Icon component
  const IconComponent: React.FC<IconComponentProps> = ({ iconName, size = 20 }) => {
    const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
    return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
  };

  // Load products from API with pagination
  const loadProducts = async (page: number = currentPage) => {
    try {
      console.log(`Fetching products for page ${page}...`);
      
      // Try paginated API first
      try {
        const res = await getProductsPaginated(page, itemsPerPage);
        console.log('Paginated products API response:', res);
        
        if (res.success && res.data) {
          console.log('Sample product structure:', res.data[0]); // Log first product to see structure
          console.log('All products:', res.data.slice(0, 3)); // Log first 3 products
          
          const flattened: ProductVariantFlattened[] = res.data.flatMap((product: Product) => {
            // Ensure ProductVariants exists and is an array
            const variants = product.ProductVariants || [];
            const categories = product.Categories || [];
            
            console.log(`Product ${product.name}:`, {
              hasVariants: !!product.ProductVariants,
              variantsLength: variants.length,
              hasCategories: !!product.Categories,
              categoriesLength: categories.length,
              productStructure: Object.keys(product)
            });
            
            // If no variants, create a default variant from the product itself
            if (variants.length === 0) {
              console.log(`No variants found for ${product.name}, creating default variant`);
              return [{
                id: product.id,
                variantName: 'Default',
                price: (product as any).price || 0, // Use any to access potentially dynamic properties
                stockQnt: (product as any).stockQnt || 0,
                productName: product.name || 'Unknown Product',
                brand: product.brand || 'Unknown Brand',
                categories: categories.map(c => c.name).join(', ') || 'Uncategorized',
              }];
            }
            
            return variants.map(variant => ({
              ...variant,
              productName: product.name || 'Unknown Product',
              brand: product.brand || 'Unknown Brand',
              categories: categories.map(c => c.name).join(', ') || 'Uncategorized',
            }));
          });
          console.log('Flattened products:', flattened);
          setProducts(flattened);
          
          // Set pagination data
          setCurrentPage(res.pagination.currentPage);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.totalCount);
          
          setError(null);
          return;
        }
      } catch (paginationError) {
        console.warn('Pagination API failed, falling back to regular API:', paginationError);
        
        // Fallback to regular API
        const res = await getAllProducts();
        console.log('Fallback products API response:', res);
        
        if (res.success && res.data) {
          console.log('Sample product structure (fallback):', res.data[0]);
          
          const flattened: ProductVariantFlattened[] = res.data.flatMap((product: Product) => {
            const variants = product.ProductVariants || [];
            const categories = product.Categories || [];
            
            if (variants.length === 0) {
              return [{
                id: product.id,
                variantName: 'Default',
                price: (product as any).price || 0,
                stockQnt: (product as any).stockQnt || 0,
                productName: product.name || 'Unknown Product',
                brand: product.brand || 'Unknown Brand',
                categories: categories.map(c => c.name).join(', ') || 'Uncategorized',
              }];
            }
            
            return variants.map(variant => ({
              ...variant,
              productName: product.name || 'Unknown Product',
              brand: product.brand || 'Unknown Brand',
              categories: categories.map(c => c.name).join(', ') || 'Uncategorized',
            }));
          });
          
          // Implement client-side pagination
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedProducts = flattened.slice(startIndex, endIndex);
          
          setProducts(paginatedProducts);
          setCurrentPage(page);
          setTotalPages(Math.ceil(flattened.length / itemsPerPage));
          setTotalCount(flattened.length);
          setError(null);
          return;
        }
      }
      
      throw new Error('Failed to fetch products: All API attempts failed');
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : 'Failed to load products');
      setProducts([]);
    }
  };



  // Filter products by search and category
  const filteredProducts = products.filter(p =>
    (p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variantName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === '' || p.categories.includes(filterCategory))
  );

const loadCategories = async () => {
  try {
    console.log('Fetching categories...');
    const categories = await getAllCategories();
    console.log('Categories API response:', categories);
    
    if (categories && categories.success && Array.isArray(categories.data)) {
      const categoryNames = categories.data.map((cat: { id: number; name: string }) => cat.name || 'Unknown Category');
      console.log('Category names:', categoryNames);
      setCategories(categoryNames);
    } else if (categories && Array.isArray(categories.data)) {
      // Handle case where success field might not exist but data is valid
      const categoryNames = categories.data.map((cat: { id: number; name: string }) => cat.name || 'Unknown Category');
      console.log('Category names (no success field):', categoryNames);
      setCategories(categoryNames);
    } else {
      console.warn('Categories response structure unexpected:', categories);
      setCategories([]);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    setError(error instanceof Error ? error.message : 'Failed to load categories');
    setCategories([]);
  }
};

// Load inventory statistics
const loadInventoryStats = async () => {
  try {
    console.log('Fetching inventory statistics...');
    const statsResponse = await getInventoryStats();
    console.log('Inventory stats response:', statsResponse);
    
    if (statsResponse.success && statsResponse.data) {
      setInventoryStats(statsResponse.data);
    } else {
      console.warn('Failed to fetch inventory stats');
    }
  } catch (error) {
    console.error('Error loading inventory stats:', error);
    // Don't set error state for stats failure, just log it
  }
};

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Stock status helper
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadProducts(currentPage), 
          loadCategories(), 
          loadInventoryStats() // Add inventory stats loading
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage]); // Add currentPage as dependency

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Manage your product inventory and stock levels</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading inventory...</div>
        </div>
      ) : (
        <>
          {/* Search & Filter */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products or variant..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconComponent iconName="Search" size={16} />
            </div>
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories && categories.length > 0 ? (
              categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            ) : (
              <option disabled>No categories available</option>
            )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map(p => {
                  const stockStatus = getStockStatus(p.stockQnt);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{p.variantName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{p.brand}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{p.categories}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${p.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{p.stockQnt}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900"><IconComponent iconName="Edit" size={16} /></button>
                          <button className="text-green-600 hover:text-green-900"><IconComponent iconName="Package" size={16} /></button>
                          <button className="text-red-600 hover:text-red-900"><IconComponent iconName="Trash2" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading products...' : 'No products found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, start + 4);
                      pageNum = start + i;
                      if (pageNum > end) return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <IconComponent iconName="Package" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{inventoryStats.totalVariants}</div>
              <div className="text-sm text-gray-500">Total Product Variants</div>
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
                {inventoryStats.lowStockItems}
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
                ${inventoryStats.totalInventoryValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Inventory Value</div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
