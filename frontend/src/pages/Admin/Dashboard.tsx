import React, { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as LucideIcons from "lucide-react";
import {
  getTotalRevenue,
  getTotalOrders,
  getOrderStats,
} from "../../services/order.services";
import { totalLowStock } from "../../services/variant.services";
import { getMonthlySales, maincategoryproducts } from "../../services/chart.services";

// --- Types ---
interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
  color?: string;
}

interface CategoryProducts {
  categoryId: number;
  categoryName: string;
  productCount: number;
}

type OrderStatusOverview = {
  Pending: number;
  Confirmed: number;
  Shipped: number;
  Delivered: number;
  Cancelled: number;
};

// type StatsData = {
//   totalOrders: number;
//   totalRevenue: string;
//   categoryWiseOrders: any;
//   orderStatusOverview: OrderStatusOverview;
// };

type MonthlySalesChart = {
  month: string;
  sales: number;
};

type CategoryChart = {
  name: string;
  value: number;
  color: string;
};

// --- Icon Component ---
const IconComponent: React.FC<IconComponentProps> = ({
  iconName,
  size = 24,
  color = "currentColor",
}) => {
  const Icon = LucideIcons[iconName] as React.FC<
    React.SVGProps<SVGSVGElement>
  >;
  return Icon ? (
    <Icon width={size} height={size} color={color} />
  ) : (
    <LucideIcons.Circle width={size} height={size} color={color} />
  );
};

// --- Combined Stats Box ---
interface CombinedStatsBoxProps {
  totalRevenue: number;
  totalOrders: number;
  lowStockItems: number;
}

const CombinedStatsBox: React.FC<CombinedStatsBoxProps> = ({
  totalRevenue,
  totalOrders,
  lowStockItems,
}) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Overview</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="flex justify-center mb-2">
          <IconComponent iconName="DollarSign" size={24} color="#10B981" />
        </div>
        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
        <p className="text-xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
      </div>
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-center mb-2">
          <IconComponent iconName="ShoppingCart" size={24} color="#3B82F6" />
        </div>
        <p className="text-sm font-medium text-gray-600">Total Orders</p>
        <p className="text-xl font-bold text-blue-600">{totalOrders}</p>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <div className="flex justify-center mb-2">
          <IconComponent iconName="AlertTriangle" size={24} color="#F59E0B" />
        </div>
        <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
        <p className="text-xl font-bold text-yellow-600">{lowStockItems}</p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [totRevenue, setTotRevenue] = React.useState<number>(0);
  const [totOrder, setTotOrders] = React.useState<number>(0);
  const [totLowStock, setTotLowStock] = React.useState<number>(0);
  const [salesOverTime, setSalesOverTime] = React.useState<MonthlySalesChart[]>(
    []
  );
  const [categoryData, setCategoryData] = React.useState<CategoryChart[]>([]);
  const [orderStatusOverview, setOrderStatusOverview] = React.useState<OrderStatusOverview>({
    Pending: 0,
    Confirmed: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  });
  const [selectedYear, setSelectedYear] = React.useState<string>("all");
  const [availableYears, setAvailableYears] = React.useState<string[]>([]);

  useEffect(() => {
    // Fetch total revenue
    const fetchTotalRevenue = async () => {
      try {
        const revenue = await getTotalRevenue();
        setTotRevenue(Number(revenue));
      } catch (err) {
        console.error("Error fetching total revenue:", err);
      }
    };
    fetchTotalRevenue();

    // Fetch total orders
    const fetchTotalOrders = async () => {
      try {
        const orders = await getTotalOrders();
        setTotOrders(orders);
      } catch (err) {
        console.error("Error fetching total orders:", err);
      }
    };
    fetchTotalOrders();

    // Fetch low stock
    const fetchLowStock = async () => {
      try {
        const lowStock = await totalLowStock();
        setTotLowStock(lowStock);
      } catch (err) {
        console.error("Error fetching low stock:", err);
      }
    };
    fetchLowStock();

    // Fetch product categories
    const fetchCategories = async () => {
      try {
        const categories = await maincategoryproducts();
        const colors = [
          "#8884d8",
          "#82ca9d",
          "#ffc658",
          "#ff8042",
          "#0088fe",
          "#00c49f",
          "#d0ed57",
          "#a4de6c",
          "#ffbb28",
          "#ff6666",
          "#888888",
        ];
        // Filter out categories with zero products before formatting
        const categoriesWithProducts = categories.filter((cat: CategoryProducts) => cat.productCount > 0);
        
        const formatted = categoriesWithProducts.map((cat: CategoryProducts, idx: number) => ({
          name: cat.categoryName,
          value: cat.productCount,
          color: colors[idx % colors.length],
        }));
        setCategoryData(formatted);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();

    // Fetch order stats
    const fetchOrderStats = async () => {
      try {
        const stats = await getOrderStats();
        console.log("stats", stats );
        
        setOrderStatusOverview(stats.orderStatusOverview);
      } catch (err) {
        console.error("Error fetching order stats:", err);
      }
    };
    fetchOrderStats();
  }, []);

  // Separate useEffect for sales data that depends on selectedYear
  React.useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await getMonthlySales();
        console.log("Raw monthly sales data:", data); // Debug log
        
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        
        if (data.length === 0) {
          setSalesOverTime([]);
          return;
        }
        
        // Extract available years from the data
        const years = [...new Set(data.map((item: any) => item.month.split("-")[0]))].sort();
        setAvailableYears(years);
        
        // Filter data by selected year
        const filteredData = selectedYear === "all" 
          ? data 
          : data.filter((item: any) => item.month.startsWith(selectedYear));
        
        if (selectedYear === "all") {
          // Group sales by month name (ignoring year) and combine totals
          const monthlyTotals = new Map();
          
          filteredData.forEach((item: any) => {
            const [, month] = item.month.split("-");
            const monthName = monthNames[parseInt(month) - 1];
            const sales = Number(item.totalSales);
            
            if (monthlyTotals.has(monthName)) {
              // Add to existing month total
              monthlyTotals.set(monthName, monthlyTotals.get(monthName) + sales);
            } else {
              // Create new month entry
              monthlyTotals.set(monthName, sales);
            }
          });
          
          // Convert to array format and maintain month order
          const formattedData = monthNames
            .filter(monthName => monthlyTotals.has(monthName))
            .map(monthName => ({
              month: monthName,
              sales: monthlyTotals.get(monthName),
            }));
          
          setSalesOverTime(formattedData);
        } else {
          // Show specific year data with month-year format
          const formattedData = filteredData.map((item: any) => {
            const [year, month] = item.month.split("-");
            const monthName = monthNames[parseInt(month) - 1];
            return {
              month: `${monthName} ${year.slice(-2)}`,
              sales: Number(item.totalSales),
              fullDate: item.month,
            };
          }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
          
          setSalesOverTime(formattedData);
        }
        
        console.log("Processed monthly data:", selectedYear === "all" ? "Combined years" : `Year ${selectedYear}`); // Debug log
        
      } catch (err) {
        console.error("Error fetching monthly sales:", err);
      }
    };
    
    fetchSales();
  }, [selectedYear]);

  const orderStatusConfig = [
    { key: "Pending", label: "Pending", bg: "bg-orange-50", text: "text-orange-600", subText: "text-orange-700" },
    { key: "Confirmed", label: "Confirmed", bg: "bg-blue-50", text: "text-blue-600", subText: "text-blue-700" },
    { key: "Shipped", label: "Shipped", bg: "bg-yellow-50", text: "text-yellow-600", subText: "text-yellow-700" },
    { key: "Delivered", label: "Delivered", bg: "bg-green-50", text: "text-green-600", subText: "text-green-700" },
    { key: "Cancelled", label: "Cancelled", bg: "bg-red-50", text: "text-red-600", subText: "text-red-700" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to BrightBuy Admin Dashboard</p>
      </div>

      {/* Combined Stats Box */}
      <div className="mb-8">
        <CombinedStatsBox 
          totalRevenue={totRevenue} 
          totalOrders={totOrder} 
          lowStockItems={totLowStock} 
        />
      </div>

      {/* Additional Business Metrics */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <IconComponent iconName="TrendingUp" size={24} color="#6366F1" />
              </div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-xl font-bold text-indigo-600">
                ${totOrder > 0 ? (totRevenue / totOrder).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <IconComponent iconName="Package" size={24} color="#8B5CF6" />
              </div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-xl font-bold text-purple-600">{categoryData.reduce((sum, cat) => sum + cat.value, 0)}</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <IconComponent iconName="Users" size={24} color="#EC4899" />
              </div>
              <p className="text-sm font-medium text-gray-600">Active Categories</p>
              <p className="text-xl font-bold text-pink-600">{categoryData.length}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <IconComponent iconName="Calendar" size={24} color="#F97316" />
              </div>
              <p className="text-sm font-medium text-gray-600">Orders This Month</p>
              <p className="text-xl font-bold text-orange-600">
                {salesOverTime.length > 0 ? salesOverTime[salesOverTime.length - 1]?.sales || 0 : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Over Time</h3>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`$${value}`, "Sales"]} />
              <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {categoryData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {orderStatusConfig.map((status) => (
            <div key={status.key} className={`text-center p-4 rounded-lg ${status.bg}`}>
              <div className={`text-2xl font-bold ${status.text}`}>
                {orderStatusOverview[status.key as keyof OrderStatusOverview]}
              </div>
              <div className={`text-sm ${status.subText}`}>{status.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
