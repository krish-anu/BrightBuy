// src/data/mockData.ts

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  lowStock: boolean;
  supplier: string;
  lastUpdated: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  orderDate: string;
  shippingAddress: string;
  assignedDelivery?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "warehouse" | "delivery" | "customer";
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverName: string;
  driverId: number;
  status: "assigned" | "in_transit" | "delivered" | "failed";
  assignedAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  customerAddress: string;
  customerPhone: string;
}

export interface Reports {
  salesSummary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProduct: string;
  };
  inventoryStats: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
  };
  orderStats: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  deliveryStats: {
    assigned: number;
    inTransit: number;
    delivered: number;
    failed: number;
  };
}

export interface ChartData {
  salesOverTime: { month: string; sales: number }[];
  productCategories: { name: string; value: number; color: string }[];
  orderStatusDistribution: { status: string; count: number; color: string }[];
}

// --- Data ---

export const products: Product[] = [
  { id: 1, name: "Wireless Bluetooth Headphones", sku: "WH-001", category: "Electronics", price: 99.99, stock: 45, lowStock: false, supplier: "TechCorp", lastUpdated: "2024-01-15" },
  { id: 2, name: "Smart Fitness Watch", sku: "SW-002", category: "Wearables", price: 249.99, stock: 12, lowStock: true, supplier: "FitTech", lastUpdated: "2024-01-14" },
  { id: 3, name: "Organic Cotton T-Shirt", sku: "TS-003", category: "Clothing", price: 29.99, stock: 78, lowStock: false, supplier: "EcoFashion", lastUpdated: "2024-01-16" },
  { id: 4, name: "Stainless Steel Water Bottle", sku: "WB-004", category: "Lifestyle", price: 24.99, stock: 5, lowStock: true, supplier: "HydroLife", lastUpdated: "2024-01-13" },
  { id: 5, name: "Gaming Mechanical Keyboard", sku: "KB-005", category: "Electronics", price: 129.99, stock: 23, lowStock: false, supplier: "GameTech", lastUpdated: "2024-01-15" }
];

export const orders: Order[] = [
  { id: "ORD-001", customer: { name: "John Smith", email: "john.smith@email.com", phone: "+1-555-0123" }, items: [{ productId: 1, name: "Wireless Bluetooth Headphones", quantity: 2, price: 99.99 }, { productId: 3, name: "Organic Cotton T-Shirt", quantity: 1, price: 29.99 }], total: 229.97, status: "pending", orderDate: "2024-01-16T10:30:00Z", shippingAddress: "123 Main St, Anytown, AT 12345", assignedDelivery: "DEL-001" },
  { id: "ORD-002", customer: { name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1-555-0124" }, items: [{ productId: 2, name: "Smart Fitness Watch", quantity: 1, price: 249.99 }], total: 249.99, status: "processing", orderDate: "2024-01-16T14:15:00Z", shippingAddress: "456 Oak Ave, Somewhere, ST 67890", assignedDelivery: "DEL-002" },
  { id: "ORD-003", customer: { name: "Mike Wilson", email: "mike.w@email.com", phone: "+1-555-0125" }, items: [{ productId: 4, name: "Stainless Steel Water Bottle", quantity: 3, price: 24.99 }, { productId: 5, name: "Gaming Mechanical Keyboard", quantity: 1, price: 129.99 }], total: 204.96, status: "shipped", orderDate: "2024-01-15T09:45:00Z", shippingAddress: "789 Pine Rd, Elsewhere, ET 13579", assignedDelivery: "DEL-001" },
  { id: "ORD-004", customer: { name: "Emily Davis", email: "emily.d@email.com", phone: "+1-555-0126" }, items: [{ productId: 1, name: "Wireless Bluetooth Headphones", quantity: 1, price: 99.99 }, { productId: 3, name: "Organic Cotton T-Shirt", quantity: 2, price: 29.99 }], total: 159.97, status: "delivered", orderDate: "2024-01-14T16:20:00Z", shippingAddress: "321 Elm St, Another, AT 24680", assignedDelivery: "DEL-003" }
];

export const users: User[] = [
  { id: 1, name: "Admin User", email: "admin@brightbuy.com", role: "admin", status: "active", lastLogin: "2024-01-16T08:30:00Z", createdAt: "2023-06-15T00:00:00Z" },
  { id: 2, name: "warehouse Staff", email: "warehouse@brightbuy.com", role: "warehouse", status: "active", lastLogin: "2024-01-16T07:45:00Z", createdAt: "2023-08-20T00:00:00Z" },
  { id: 3, name: "Delivery Driver 1", email: "delivery1@brightbuy.com", role: "delivery", status: "active", lastLogin: "2024-01-16T06:15:00Z", createdAt: "2023-09-10T00:00:00Z" },
  { id: 4, name: "Delivery Driver 2", email: "delivery2@brightbuy.com", role: "delivery", status: "active", lastLogin: "2024-01-15T18:30:00Z", createdAt: "2023-10-05T00:00:00Z" },
  { id: 5, name: "John Customer", email: "john.smith@email.com", role: "customer", status: "active", lastLogin: "2024-01-16T10:00:00Z", createdAt: "2024-01-10T00:00:00Z" }
];

export const deliveries: Delivery[] = [
  { id: "DEL-001", orderId: "ORD-001", driverName: "Delivery Driver 1", driverId: 3, status: "assigned", assignedAt: "2024-01-16T11:00:00Z", estimatedDelivery: "2024-01-17T15:00:00Z", customerAddress: "123 Main St, Anytown, AT 12345", customerPhone: "+1-555-0123" },
  { id: "DEL-002", orderId: "ORD-002", driverName: "Delivery Driver 2", driverId: 4, status: "in_transit", assignedAt: "2024-01-16T14:30:00Z", estimatedDelivery: "2024-01-17T12:00:00Z", customerAddress: "456 Oak Ave, Somewhere, ST 67890", customerPhone: "+1-555-0124" },
  { id: "DEL-003", orderId: "ORD-004", driverName: "Delivery Driver 1", driverId: 3, status: "delivered", assignedAt: "2024-01-14T17:00:00Z", deliveredAt: "2024-01-15T14:30:00Z", customerAddress: "321 Elm St, Another, AT 24680", customerPhone: "+1-555-0126" }
];

export const reports: Reports = {
  salesSummary: { totalRevenue: 844.89, totalOrders: 4, averageOrderValue: 211.22, topSellingProduct: "Wireless Bluetooth Headphones" },
  inventoryStats: { totalProducts: 5, lowStockItems: 2, outOfStockItems: 0, totalValue: 25847.65 },
  orderStats: { pending: 1, processing: 1, shipped: 1, delivered: 1, cancelled: 0 },
  deliveryStats: { assigned: 1, inTransit: 1, delivered: 1, failed: 0 }
};

export const chartData: ChartData = {
  salesOverTime: [
    { month: "Jan", sales: 4000 },
    { month: "Feb", sales: 3000 },
    { month: "Mar", sales: 5000 },
    { month: "Apr", sales: 4500 },
    { month: "May", sales: 6000 },
    { month: "Jun", sales: 5500 }
  ],
  productCategories: [
    { name: "Electronics", value: 45, color: "#0088FE" },
    { name: "Clothing", value: 25, color: "#00C49F" },
    { name: "Lifestyle", value: 20, color: "#FFBB28" },
    { name: "Wearables", value: 10, color: "#FF8042" }
  ],
  orderStatusDistribution: [
    { status: "Pending", count: 1, color: "#FFA500" },
    { status: "Processing", count: 1, color: "#00BFFF" },
    { status: "Shipped", count: 1, color: "#32CD32" },
    { status: "Delivered", count: 1, color: "#228B22" }
  ]
};
