import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  bgColor: string;
  accentColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, bgColor, accentColor }) => {
  const isPositive = change >= 0;
  
  return (
    <div className={`${bgColor} rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-gray-light cursor-pointer group`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-charcoal">{value}</h3>
        </div>
        <div className={`${accentColor} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? "+" : ""}{change}% this month
        </span>
      </div>
    </div>
  );
};

const StatsBadge: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ 
  label, 
  value, 
  icon, 
  color 
}) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-cream rounded-lg border border-gray-light hover:bg-gray-light transition-colors">
    <div className={`${color} p-2 rounded-md`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      <p className="text-lg font-bold text-charcoal">{value}</p>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light via-white to-gray-light">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your business performance overview.</p>
        </div>

        {/* Primary KPIs - 4 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Transactions"
            value="24,580"
            change={12.5}
            icon={<Activity className="w-6 h-6 text-white" />}
            bgColor="bg-white border-l-4 border-blue"
            accentColor="bg-blue"
          />
          <KPICard
            title="Verifications"
            value="1,248"
            change={8.2}
            icon={<CheckCircle2 className="w-6 h-6 text-white" />}
            bgColor="bg-white border-l-4 border-blue-dark"
            accentColor="bg-blue-dark"
          />
          <KPICard
            title="Active Customers"
            value="3,421"
            change={15.8}
            icon={<Users className="w-6 h-6 text-white" />}
            bgColor="bg-white border-l-4 border-blue-dark"
            accentColor="bg-blue-dark"
          />
          <KPICard
            title="Pending Tasks"
            value="45"
            change={-3.2}
            icon={<Clock className="w-6 h-6 text-white" />}
            bgColor="bg-white border-l-4 border-blue"
            accentColor="bg-blue"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatsBadge
            label="Completion Rate"
            value="94%"
            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
            color="bg-blue"
          />
          <StatsBadge
            label="Avg Response Time"
            value="2.4s"
            icon={<Clock className="w-5 h-5 text-white" />}
            color="bg-blue-dark"
          />
          <StatsBadge
            label="Success Rate"
            value="98.5%"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-blue-dark"
          />
        </div>

        {/* Charts and Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Transactions Trend - Takes up 2 columns */}
          <Card className="lg:col-span-2 bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-charcoal">Transactions Trend</h2>
                <a href="#" className="flex items-center gap-2 text-blue hover:text-blue-dark text-sm font-medium">
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-cream to-gray-light rounded-lg border border-gray-light">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-mid mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Chart placeholder</p>
                  <p className="text-sm text-gray-500">Connect to your data visualization library</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-charcoal">Quick Stats</h2>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">This Month</span>
                  <span className="text-2xl font-bold text-blue">+24%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">This Quarter</span>
                  <span className="text-2xl font-bold text-blue">+18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Year to Date</span>
                  <span className="text-2xl font-bold text-blue">+42%</span>
                </div>
              </div>
              <button className="w-full mt-6 px-4 py-2 bg-blue text-white rounded-lg font-medium hover:bg-blue-dark transition-colors">
                View Report
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mt-6 bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal">Recent Transactions</h2>
              <a href="#" className="text-blue hover:text-blue-dark text-sm font-medium">
                View All
              </a>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">ID</th>
                    <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">Customer</th>
                    <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((_, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-cream transition-colors">
                      <td className="text-sm text-charcoal py-3 px-4 font-medium">#TXN{2024 + idx}</td>
                      <td className="text-sm text-charcoal py-3 px-4">Customer {idx + 1}</td>
                      <td className="text-sm text-charcoal py-3 px-4 font-semibold text-blue">$1,200.00</td>
                      <td className="text-sm py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Completed
                        </span>
                      </td>
                      <td className="text-sm text-gray-600 py-3 px-4">Today</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600">Showing 5 of 248 transactions</span>
              <div className="flex gap-2">
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                <button className="px-3 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-dark transition-colors">
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};