import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { getAllProducts, getProductsPaginated, getInventoryStats, addProduct } from '@/services/product.services';
import { getAllCategories } from '@/services/category.services';
import SingleSelect from '@/components/ui/SingleSelect';

// Icon props
interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}


// Icon props
interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
}

// API product variant type
interface ProductVariant {
  id: number;
  variantName: string;
  price: number | null;
  stockQnt: number | null;
  imageURL?: string | null;
}

// API product type
interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  Categories?: { id: number; name: string }[];
  ProductVariants?: ProductVariant[];
}

// Flattened variant type used in state
interface ProductVariantFlattened extends ProductVariant {
  productName: string;
  brand: string;
  categories: string;
  isDefaultVariant?: boolean;
}

const IconComponent: React.FC<IconComponentProps> = ({ iconName, size = 20 }) => {
  const Icon = LucideIcons[iconName] as React.ComponentType<LucideProps>;
  return Icon ? <Icon size={size} /> : <LucideIcons.Circle size={size} />;
};

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  const [products, setProducts] = useState<ProductVariantFlattened[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    totalVariants: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalInventoryValue: 0,
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<any>({
    name: '',
    description: '',
    brand: '',
    price: '',
    stockQnt: 1,
    categoryIds: [] as number[],
    attributes: [] as any[],
    imageFile: null as File | null,
    _brands: [] as { id: number; name: string }[],
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const flattenProducts = (list: Product[]): ProductVariantFlattened[] => {
    const out: ProductVariantFlattened[] = [];
    for (const product of list) {
      const variants = product.ProductVariants || [];
      const categories = product.Categories || [];
      if (!product || variants.length === 0) {
        out.push({
          id: product.id,
          variantName: 'Default',
          price: product ? ((product as any).price ?? null) : null,
          stockQnt: product ? ((product as any).stockQnt ?? null) : null,
          imageURL: product ? ((product as any).imageURL ?? null) : null,
          isDefaultVariant: true,
          productName: product.name || 'Unknown Product',
          brand: product.brand || 'Unknown Brand',
          categories: categories.map((c: any) => c?.name || `Category ${c?.id || 'unknown'}`).join(', ') || 'Uncategorized',
        });
        continue;
      }
      for (const variant of variants) {
        // skip null/undefined variants (some API responses may include null entries)
        if (!variant) continue;
        out.push({
          ...variant,
          imageURL: (variant as any).imageURL ?? null,
          isDefaultVariant: false,
          price: (variant as any).price ?? (product ? (product as any).price ?? null : null),
          stockQnt: (variant as any).stockQnt ?? (product ? (product as any).stockQnt ?? null : null),
          productName: product.name || 'Unknown Product',
          brand: product.brand || 'Unknown Brand',
          categories: categories.map((c: any) => c?.name || `Category ${c?.id || 'unknown'}`).join(', ') || 'Uncategorized',
        });
      }
    }
    return out;
  };

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantFlattened | null>(null);
  // Edit/Delete modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({ variantName: '', price: 0, stockQnt: 0 });

  const openViewModal = (variant: ProductVariantFlattened) => {
    (async () => {
      try {
        // If this is a default/no-variant row, there's no variant endpoint to call; use available data
        if (variant.isDefaultVariant) {
          setSelectedVariant({ ...variant, imageURL: variant.imageURL ?? null });
          setViewModalOpen(true);
          return;
        }

        const { getVariant } = await import('@/services/variant.services');
        const res = await getVariant(variant.id);
        const data = res?.data || res || null;
        if (!data) {
          // Variant missing on server (deleted elsewhere) — remove from current list
          setProducts(prev => prev.filter(p => p.id !== variant.id));
          setTotalCount(c => Math.max(0, c - 1));
          await loadInventoryStats();
          // Inform user
          alert('Variant not found — it appears to have been deleted and was removed from the list');
          return;
        }
        setSelectedVariant({ ...variant, imageURL: data?.imageURL ?? variant.imageURL ?? null });
        setViewModalOpen(true);
      } catch (err) {
        console.error('Failed to load variant for view', err);
        setSelectedVariant({ ...variant, imageURL: variant.imageURL ?? null });
        setViewModalOpen(true);
      }
    })();
  };

  const handleEditVariant = (variant: ProductVariantFlattened) => {
    (async () => {
      try {
        if (variant.isDefaultVariant) {
          alert('This is a default product entry with no editable variant. Create a variant to edit details.');
          return;
        }
        const { getVariant } = await import('@/services/variant.services');
        const res = await getVariant(variant.id);
        const data = res?.data || res || null;
        // If variant not found (deleted), show a message and refresh list
        if (!data) {
          // Variant missing on server (deleted elsewhere) — remove from current list
          setProducts(prev => prev.filter(p => p.id !== variant.id));
          setTotalCount(c => Math.max(0, c - 1));
          await loadInventoryStats();
          alert('Variant not found — it appears to have been deleted and was removed from the list');
          return;
        }
        // data shape from backend: { id, SKU, variantName, price, stockQnt, productId, imageURL, attributes }
        setSelectedVariant({ ...variant, imageURL: data?.imageURL ?? variant.imageURL ?? null });
  setEditForm({ variantName: data?.variantName ?? variant.variantName, price: data?.price ?? variant.price ?? 0, currentStock: data?.stockQnt ?? variant.stockQnt ?? 0, addStock: 0 });
        setEditModalOpen(true);
      } catch (err) {
        console.error('Failed to load variant details', err);
        alert('Failed to load variant details');
      }
    })();
  };

  const handleDeleteVariant = (variant: ProductVariantFlattened) => {
    setSelectedVariant(variant);
    setDeleteModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedVariant(null);
    setViewModalOpen(false);
  };

  // Live search: update searchTerm immediately when typing

  const loadProducts = async (page: number = 1) => {
    setProductsLoading(true);
    try {
      // If searching OR a stock-status filter is active, fetch the full dataset and filter client-side
      if ((searchTerm && searchTerm.trim() !== '') || (filterStockStatus && filterStockStatus !== '')) {
        const res = await getAllProducts();
        if (res && res.success && res.data) {
          let flattened = flattenProducts(res.data as Product[]);

          // Apply search term filter if present
          if (searchTerm && searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            flattened = flattened.filter((p) => (p.productName && p.productName.toLowerCase().includes(q)) || (p.variantName && p.variantName.toLowerCase().includes(q)));
          }

          // Apply stock status filter if present (global)
          if (filterStockStatus && filterStockStatus !== '') {
            switch (filterStockStatus) {
              case 'low-stock':
                flattened = flattened.filter(p => (p.stockQnt ?? -1) <= 10 && (p.stockQnt ?? -1) > 0);
                break;
              case 'out-of-stock':
                flattened = flattened.filter(p => (p.stockQnt ?? -1) === 0);
                break;
              case 'in-stock':
                flattened = flattened.filter(p => (p.stockQnt ?? -1) > 10);
                break;
              default:
                break;
            }
          }

          // Also apply category filter client-side if selected
          const afterCategory = filterCategory && filterCategory !== '' ? flattened.filter(p => p.categories.includes(filterCategory)) : flattened;

          const startIndex = (page - 1) * itemsPerPage;
          const paginated = afterCategory.slice(startIndex, startIndex + itemsPerPage);
          setProducts(paginated);
          setCurrentPage(page);
          setTotalPages(Math.ceil(afterCategory.length / itemsPerPage));
          setTotalCount(afterCategory.length);
          setError(null);
          return;
        }
      }

      // normal paginated fetch
      const res = await getProductsPaginated(page, itemsPerPage);
      if (res && res.success && res.data) {
        const flattened = flattenProducts(res.data as Product[]);
        setProducts(flattened);
        setCurrentPage(res.pagination.currentPage);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.totalCount);
        setError(null);
        return;
      }

      // fallback to all products if paginated fails
      const fallback = await getAllProducts();
      if (fallback && fallback.success && fallback.data) {
        const flattened = flattenProducts(fallback.data as Product[]);
        const startIndex = (page - 1) * itemsPerPage;
        const paginated = flattened.slice(startIndex, startIndex + itemsPerPage);
        setProducts(paginated);
        setCurrentPage(page);
        setTotalPages(Math.ceil(flattened.length / itemsPerPage));
        setTotalCount(flattened.length);
        setError(null);
        return;
      }

      throw new Error('Failed to fetch products');
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // filters are applied client-side on the loaded products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = true; // search already applied during loadProducts when searching
    const matchesCategory = filterCategory === '' || p.categories.includes(filterCategory);
    // stock status and search are applied globally in loadProducts when active
    return matchesSearch && matchesCategory;
  });

  const loadCategories = async () => {
    try {
      const resp = await getAllCategories();
      if (resp && resp.success && Array.isArray(resp.data)) {
        const mapped = resp.data.map((cat: any) => ({ id: Number(cat.categoryId ?? cat.id ?? 0) || 0, name: (cat.categoryName ?? cat.name ?? '').toString() || '', parentId: cat.parentId ?? cat.parent ?? null }));
        const topLevel = mapped.filter((c: any) => !c.parentId).map((c: any) => ({ id: c.id, name: c.name || `Category ${c.id}` }));
        setCategories(topLevel);
      } else if (Array.isArray(resp.data)) {
        const mapped = resp.data.map((cat: any) => ({ id: Number(cat.categoryId ?? cat.id ?? 0) || 0, name: (cat.categoryName ?? cat.name ?? '').toString() || '', parentId: cat.parentId ?? cat.parent ?? null }));
        const topLevel = mapped.filter((c: any) => !c.parentId).map((c: any) => ({ id: c.id, name: c.name || `Category ${c.id}` }));
        setCategories(topLevel);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      setCategories([]);
    }
  };

  const loadInventoryStats = async () => {
    try {
      const statsResponse = await getInventoryStats();
      if (statsResponse.success && statsResponse.data) setInventoryStats(statsResponse.data);
    } catch (err) {
      console.error('Error loading inventory stats:', err);
    }
  };

  // pagination handlers
  const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handleItemsPerPageChange = (newItemsPerPage: number) => { setItemsPerPage(newItemsPerPage); setCurrentPage(1); };

  const getStockStatus = (stock: number | null | undefined) => {
    if (stock === null || stock === undefined) return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  useEffect(() => {
    const fetchData = async () => {
      // Keep initial loading separate from subsequent product fetches
      if (!searchTerm && currentPage === 1 && itemsPerPage === 10) {
        setLoading(true);
      }
      setError(null);
      try {
        // When searching, always load page 1
        const pageToLoad = searchTerm ? 1 : currentPage;
        await Promise.all([loadProducts(pageToLoad), loadCategories(), loadInventoryStats()]);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [currentPage, itemsPerPage, searchTerm, filterStockStatus, filterCategory]);

  // Load brands once when the component mounts so the Add Product modal has data even if user opens it later
  useEffect(() => {
    (async () => {
      try {
        await loadBrands();
      } catch (err) {
        console.error('Failed to preload brands on mount', err);
      }
    })();
  }, []);

  // Load brands for Add Product modal
  const loadBrands = async () => {
    try {
      const { getBrands } = await import('@/services/product.services');
      const brands = await getBrands();
  setNewProductForm((prev: any) => ({ ...prev, _brands: brands }));
    } catch (err) {
      console.error('Failed to load brands', err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Inventory Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your product inventory and stock levels
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="text-gray-500">Loading inventory...</div></div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <input type="text" placeholder="Search products or variant..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); loadProducts(1); }} />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconComponent iconName="Search" size={16} /></div>
                {productsLoading && <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500">Searching...</div>}
              </div>

              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories && categories.length > 0 ? categories.map(cat => (<option key={cat.id} value={cat.name}>{cat.name}</option>)) : <option disabled>No categories available</option>}
              </select>

              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={filterStockStatus} onChange={e => setFilterStockStatus(e.target.value)}>
                <option value="">All Stock Status</option>
                <option value="in-stock">In Stock (&gt;10)</option>
                <option value="low-stock">Low Stock (1-10)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>

              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <button onClick={async () => { await loadBrands(); setAddModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><IconComponent iconName="Plus" size={16} /><span className="ml-2">Add Product</span></button>
            </div>

            {addModalOpen && (
              <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-3/4 md:w-1/2 shadow-xl rounded-lg bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
                    <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input type="text" value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea value={newProductForm.description} onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Brand</label>
                        <div className="mt-1 flex space-x-2 items-center">
                          <select className="flex-1 px-3 py-2 border rounded" value={newProductForm.brand} onChange={e => setNewProductForm({ ...newProductForm, brand: e.target.value })}>
                            <option value="">Select brand</option>
                            {/** brands loaded into state */}
                            {Array.isArray((newProductForm as any)._brands) && (newProductForm as any)._brands.length > 0 ? (
                              (newProductForm as any)._brands.map((b: any) => (
                                <option key={b.id} value={b.name}>{b.name}</option>
                              ))
                            ) : (
                              <option disabled>No brands available</option>
                            )}
                          </select>
                          <div className="flex items-center space-x-2">
                            <button type="button" onClick={() => setNewProductForm({ ...newProductForm, _showAddBrand: true })} className="px-2 py-1 text-xs bg-gray-100 rounded">Add</button>
                            <button type="button" onClick={async () => { try { await loadBrands(); alert('Brands refreshed'); } catch (err) { console.error('Failed to refresh brands', err); alert('Failed to refresh brands'); } }} className="px-2 py-1 text-xs bg-gray-50 border rounded">Reload</button>
                          </div>
                        </div>

                        {newProductForm._showAddBrand && (
                          <div className="mt-2 flex items-center space-x-2">
                            <input type="text" placeholder="New brand name" value={newProductForm._newBrandName || ''} onChange={(e) => setNewProductForm({ ...newProductForm, _newBrandName: e.target.value })} className="px-2 py-1 border rounded w-full" />
                            <button onClick={async () => {
                              try {
                                const name = (newProductForm._newBrandName || '').toString().trim();
                                if (!name) return;
                                const { createBrand } = await import('@/services/product.services');
                                const created = await createBrand(name);
                                // refresh brands list in the modal state
                                const brands = await (await import('@/services/product.services')).getBrands();
                                setNewProductForm({ ...newProductForm, brand: created?.name || name, _brands: brands, _showAddBrand: false, _newBrandName: '' });
                              } catch (err) {
                                console.error('Failed to create brand', err);
                                alert('Failed to create brand');
                              }
                            }} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                            <button onClick={() => setNewProductForm({ ...newProductForm, _showAddBrand: false, _newBrandName: '' })} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input type="number" value={newProductForm.price} onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                        <input type="number" value={newProductForm.stockQnt} onChange={(e) => setNewProductForm({ ...newProductForm, stockQnt: Number(e.target.value) })} className="mt-1 block w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <div className="mt-1">
                          <div className="flex space-x-2 items-center">
                            <div className="flex-1">
                              <SingleSelect options={categories} value={newProductForm.categoryIds && newProductForm.categoryIds.length ? newProductForm.categoryIds[0] : null} onChange={(selectedId) => setNewProductForm({ ...newProductForm, categoryIds: selectedId ? [selectedId] : [] })} placeholder="Select main category" />
                            </div>
                            <div>
                              <button type="button" onClick={() => setShowAddCategory(true)} className="px-2 py-1 text-xs bg-gray-100 rounded">Add</button>
                            </div>
                          </div>
                          {typeof showAddCategory !== 'undefined' && showAddCategory && (
                            <div className="mt-2 flex items-center space-x-2">
                              <input type="text" placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="px-2 py-1 border rounded w-full" />
                              <button onClick={async () => {
                                try {
                                  if (!newCategoryName || newCategoryName.trim() === '') return;
                                  const resp = await (await import('@/services/category.services')).createCategory(newCategoryName.trim(), null);
                                  if (resp && resp.success) {
                                    // refresh categories
                                    await loadCategories();
                                    setNewCategoryName('');
                                    setShowAddCategory(false);
                                  }
                                } catch (err) {
                                  console.error('Failed to create category', err);
                                  alert('Failed to create category');
                                }
                              }} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                              <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <input type="file" accept="image/*" onChange={(e) => setNewProductForm({ ...newProductForm, imageFile: e.target.files?.[0] || null })} className="mt-1 block w-full" />
                    </div>

                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={() => setAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">Cancel</button>
                    <button onClick={async () => {
                      try {
                        const categoryIds: number[] = Array.isArray(newProductForm.categoryIds) ? newProductForm.categoryIds : [];
                        const productPayload = {
                          name: newProductForm.name,
                          description: newProductForm.description,
                          brand: newProductForm.brand,
                          price: Number(newProductForm.price),
                          stockQnt: Number(newProductForm.stockQnt),
                          categoryIds,
                          attributes: [],
                        };

                        // Create product + variant first
                        const createRes = await addProduct(productPayload);
                        const variantId = createRes?.variantId || (createRes?.data && createRes.data.variantId) || null;

                        // If image file provided and we have variantId, upload with entity=variant
                        if (newProductForm.imageFile && variantId) {
                          const uploadRes = await (await import('@/services/product.services')).uploadImageForEntity(newProductForm.imageFile, 'variant', variantId);
                          const imageUrl = uploadRes?.url || uploadRes?.data?.url || uploadRes?.data?.message || uploadRes?.url;
                          if (imageUrl) {
                            await (await import('@/services/product.services')).setVariantImage(variantId, imageUrl);
                          }
                        }

                        setAddModalOpen(false);
                        await loadProducts(1);
                        // Refresh global inventory stats so tiles show counts from all products
                        await loadInventoryStats();
                      } catch (err) {
                        console.error('Error adding product:', err);
                        alert('Failed to add product');
                      }
                    }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">Add Product</button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(searchTerm || filterCategory || filterStockStatus) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Search: "{searchTerm}"
                    <button onClick={() => { setSearchTerm(''); }} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {filterCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Category: {filterCategory}
                    <button onClick={() => setFilterCategory('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
                {filterStockStatus && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Stock: {filterStockStatus === 'low-stock' ? 'Low Stock' : filterStockStatus === 'out-of-stock' ? 'Out of Stock' : 'In Stock'}
                    <button onClick={() => setFilterStockStatus('')} className="ml-1 text-yellow-600 hover:text-yellow-800">×</button>
                  </span>
                )}
                <button onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterStockStatus(''); }} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200">Clear all</button>
              </div>
            )}
          </div>

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
                        <tr key={`${p.id}-${p.variantName}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.productName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.variantName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.brand}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.categories}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.price != null ? `$${p.price}` : null}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.stockQnt != null ? p.stockQnt : null}</td>
                          <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>{stockStatus.label}</span></td>
                          <td className="px-6 py-4 text-sm font-medium"><div className="flex space-x-2">
                            <button onClick={() => openViewModal(p)} className="text-gray-700 hover:text-gray-900" title="View"><IconComponent iconName="Eye" size={16} /></button>
                            <button onClick={() => handleEditVariant(p)} disabled={p.isDefaultVariant} className={`text-blue-600 hover:text-blue-900 ${p.isDefaultVariant ? 'opacity-50 cursor-not-allowed' : ''}`} title="Edit"><IconComponent iconName="Edit" size={16} /></button>
                            <button className="text-green-600 hover:text-green-900"><IconComponent iconName="Package" size={16} /></button>
                            <button onClick={() => handleDeleteVariant(p)} disabled={p.isDefaultVariant} className={`text-red-600 hover:text-red-900 ${p.isDefaultVariant ? 'opacity-50 cursor-not-allowed' : ''}`} title="Delete"><IconComponent iconName="Trash2" size={16} /></button>
                          </div></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">{loading ? 'Loading products...' : 'No products found'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results</div>
                  <div className="flex items-center space-x-2">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <div className="flex space-x-1">{Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pageNum; if (totalPages <= 5) { pageNum = i + 1; } else { const start = Math.max(1, currentPage - 2); const end = Math.min(totalPages, start + 4); pageNum = start + i; if (pageNum > end) return null; } return (<button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 text-sm border rounded-md ${ currentPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50' }`}>{pageNum}</button>); })}</div>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-md"><IconComponent iconName="Package" size={24} /></div><div className="ml-4"><div className="text-2xl font-bold text-gray-900">{inventoryStats.totalVariants}</div><div className="text-sm text-gray-500">Total Product Variants</div></div></div><div><button onClick={loadInventoryStats} className="px-2 py-1 text-sm bg-gray-100 rounded">Refresh</button></div></div></div>
            <div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div className="flex items-center"><div className="p-2 bg-yellow-100 rounded-md"><IconComponent iconName="AlertTriangle" size={24} /></div><div className="ml-4"><div className="text-2xl font-bold text-gray-900">{inventoryStats.lowStockItems}</div><div className="text-sm text-gray-500">Low Stock Items</div></div></div><div><button onClick={loadInventoryStats} className="px-2 py-1 text-sm bg-gray-100 rounded">Refresh</button></div></div></div>
            <div className="bg-white rounded-lg shadow-md p-6"><div className="flex items-center justify-between"><div className="flex items-center"><div className="p-2 bg-green-100 rounded-md"><IconComponent iconName="DollarSign" size={24} /></div><div className="ml-4"><div className="text-2xl font-bold text-gray-900">${inventoryStats.totalInventoryValue.toLocaleString()}</div><div className="text-sm text-gray-500">Total Inventory Value</div></div></div><div><button onClick={loadInventoryStats} className="px-2 py-1 text-sm bg-gray-100 rounded">Refresh</button></div></div></div>
          </div>
        </>
      )}
        {/* View Variant Modal (UserManagement style) */}
        {viewModalOpen && selectedVariant && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                  <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedVariant?.productName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variant</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedVariant?.variantName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedVariant?.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedVariant?.categories || 'N/A'}</p>
                  </div>
                  {selectedVariant?.price != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <p className="mt-1 text-sm text-gray-900">${selectedVariant.price}</p>
                    </div>
                  )}
                  {selectedVariant?.stockQnt != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVariant.stockQnt}</p>
                    </div>
                  )}
                  {(selectedVariant as any)?.SKU && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedVariant as any).SKU}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image</label>
                    <div className="mt-1">
                      {selectedVariant?.imageURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedVariant.imageURL} alt={`${selectedVariant?.productName || 'Product'}`} className="w-full h-40 object-contain rounded-md" />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-md text-gray-500">No image</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Edit Variant Modal */}
        {editModalOpen && selectedVariant && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Variant</h3>
                  <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variant Name</label>
                    <input type="text" value={editForm.variantName} onChange={(e) => setEditForm({ ...editForm, variantName: e.target.value })} className="mt-1 block w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="mt-1 block w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                    <input type="number" value={editForm.currentStock ?? 0} readOnly className="mt-1 block w-full px-3 py-2 border rounded bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Add Stock</label>
                    <input type="number" value={editForm.addStock} onChange={(e) => setEditForm({ ...editForm, addStock: Number(e.target.value) })} className="mt-1 block w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image</label>
                    <div className="mt-1">
                      {selectedVariant?.imageURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedVariant.imageURL} alt={`${selectedVariant.productName}`} className="w-full h-40 object-contain rounded-md" />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-md text-gray-500">No image</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <button onClick={() => setEditModalOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                  <button onClick={async () => {
                    try {
                      const { updateVariant } = await import('@/services/variant.services');
                      const variantId = selectedVariant.id;
                      const newStock = (Number(editForm.currentStock) || 0) + (Number(editForm.addStock) || 0);
                      await updateVariant(variantId, { variantName: editForm.variantName, price: editForm.price ?? 0, stockQnt: newStock });
                      setEditModalOpen(false);
                      // refresh products
                      await loadProducts(currentPage);
                      await loadInventoryStats();
                    } catch (err) {
                      console.error('Failed to update variant', err);
                      alert('Failed to update variant');
                    }
                  }} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Variant Modal */}
        {deleteModalOpen && selectedVariant && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-lg bg-white border-gray-200">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Variant</h3>
                  <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600"><IconComponent iconName="X" size={20} /></button>
                </div>
                <p>Are you sure you want to delete <strong>{selectedVariant.variantName}</strong> of product <strong>{selectedVariant.productName}</strong>?</p>
                <div className="flex justify-end mt-4 space-x-2">
                  <button onClick={() => setDeleteModalOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                  <button onClick={async () => {
                    try {
                      const { deleteVariant } = await import('@/services/variant.services');
                      const deletedId = selectedVariant.id;
                      await deleteVariant(deletedId);
                      // Optimistically remove the row from current list
                      // Remove from UI immediately (coerce to number to avoid string/number mismatches)
                      setProducts(prev => prev.filter(p => Number(p.id) !== Number(deletedId)));
                      setTotalCount(c => Math.max(0, c - 1));
                      setDeleteModalOpen(false);
                      setSelectedVariant(null);
                      // Refresh inventory stats
                      await loadInventoryStats();
                      // Try to reload current page to fill rows (non-blocking)
                      try { 
                        await loadProducts(currentPage);
                        // After reload, ensure row is not present (defensive): remove if still there
                        setProducts(prev => prev.filter(p => Number(p.id) !== Number(deletedId)));
                      } catch (e) { console.error('Failed to reload products after delete', e); }
                    } catch (err) {
                      console.error('Failed to delete variant', err);
                      // Rollback UI removal if it was removed optimistically
                      if (selectedVariant) {
                        setProducts(prev => {
                          // If the row already exists, keep it; otherwise restore selectedVariant at the top
                          const exists = prev.some(p => p.id === selectedVariant.id);
                          if (exists) return prev;
                          return [selectedVariant, ...prev];
                        });
                        setTotalCount(c => c + 1);
                      }
                      alert('Failed to delete variant. It has been restored in the list.');
                    }
                  }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Inventory;

