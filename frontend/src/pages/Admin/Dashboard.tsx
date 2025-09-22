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
import { reports, chartData } from "../../../data/mockData";
import * as LucideIcons from "lucide-react";
// import { get } from 'http';
import { getTotalRevenue } from "../../services/order.services";

// import type { Icon as LucideIconType } from 'lucide-react';

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
  color?: string;
}

const IconComponent: React.FC<IconComponentProps> = ({
  iconName,
  size = 24,
  color = "currentColor",
}) => {
  // Cast the dynamic icon to a React component that accepts SVG props
  const Icon = LucideIcons[iconName] as React.FC<React.SVGProps<SVGSVGElement>>;
  return Icon ? (
    <Icon width={size} height={size} color={color} />
  ) : (
    <LucideIcons.Circle width={size} height={size} color={color} />
  );
};

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
  useEffect(() => {
    const fetchTotalRevenue = async () => {
      const revenue = await getTotalRevenue();
      setTotRevenue(revenue);
    };
    fetchTotalRevenue();

  console.log("Revenue called");
}, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to BrightBuy Admin Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={totRevenue.toString()}
          icon="DollarSign"
          color="#10B981"
          change="12.5"
        />
        <StatsCard
          title="Total Orders"
          value={reports.salesSummary.totalOrders}
          icon="ShoppingCart"
          color="#3B82F6"
          change="8.2"
        />
        <StatsCard
          title="Low Stock Items"
          value={reports.inventoryStats.lowStockItems}
          icon="AlertTriangle"
          color="#F59E0B"
        />
        <StatsCard
          title="Active Deliveries"
          value={
            reports.deliveryStats.assigned + reports.deliveryStats.inTransit
          }
          icon="Truck"
          color="#8B5CF6"
          change="5.1"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Over Time Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`$${value}`, "Sales"]} />
              <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Categories Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Product Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.productCategories}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {chartData.productCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Status Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {reports.orderStats.pending}
            </div>
            <div className="text-sm text-orange-700">Pending</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {reports.orderStats.processing}
            </div>
            <div className="text-sm text-blue-700">Processing</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {reports.orderStats.shipped}
            </div>
            <div className="text-sm text-yellow-700">Shipped</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {reports.orderStats.delivered}
            </div>
            <div className="text-sm text-green-700">Delivered</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
