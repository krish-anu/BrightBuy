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

type StatsData = {
  totalOrders: number;
  totalRevenue: string;
  categoryWiseOrders: any;
  orderStatusOverview: OrderStatusOverview;
};

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

// --- Stats Card ---
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof LucideIcons;
  color: string;
  change?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
}) => (
  <div
    className="bg-white rounded-lg shadow-md p-6 border-l-4"
    style={{ borderLeftColor: color }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-1">
            +{change}% from last month
          </p>
        )}
      </div>
      <div
        className="p-3 rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <IconComponent iconName={icon} size={24} />
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

    // Fetch monthly sales
    const fetchSales = async () => {
      try {
        const data = await getMonthlySales();
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
        const formatted = data.map((item: any) => {
          const [, month] = item.month.split("-");
          return {
            month: monthNames[parseInt(month) - 1],
            sales: Number(item.totalSales),
          };
        });
        setSalesOverTime(formatted);
      } catch (err) {
        console.error("Error fetching monthly sales:", err);
      }
    };
    fetchSales();

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Revenue" value={`$${totRevenue.toFixed(2)}`} icon="DollarSign" color="#10B981" />
        <StatsCard title="Total Orders" value={totOrder} icon="ShoppingCart" color="#3B82F6" />
        <StatsCard title="Low Stock Items" value={totLowStock} icon="AlertTriangle" color="#F59E0B" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Over Time</h3>
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
