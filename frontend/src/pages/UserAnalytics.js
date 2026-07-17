import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";

const UserAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        let token = localStorage.getItem("token");
        if (token && !token.startsWith("Bearer ")) {
          token = `Bearer ${token}`;
        }

        const response = await axios.get("http://localhost:5000/api/analytics", {
          headers: { Authorization: token },
        });

        setAnalyticsData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "অ্যানালিটিক্স ডাটা লোড করতে ব্যর্থ হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <span className="ml-3 text-lg font-medium text-gray-600">ডাটা লোড হচ্ছে...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-lg shadow-sm border border-red-200 text-center">
          <p className="font-semibold text-lg">⚠️ দুঃখিত!</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // COLORS for Pie Chart
  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  // Formatted data for charts
  const taskStatusData = [
    { name: "সম্পন্ন", value: analyticsData?.completedTasks || 0 },
    { name: "চলমান", value: analyticsData?.pendingTasks || 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            📊 আপনার কাজের অ্যানালিটিক্স
          </h1>
          <p className="mt-2 text-md text-slate-500">
            এখানে আপনার টাস্ক ম্যানেজমেন্ট ও পারফরম্যান্সের একটি সামগ্রিক চিত্র দেওয়া হলো।
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
          {/* Card 1: Total Tasks */}
          <div className="bg-white overflow-hidden shadow-sm border border-slate-100 rounded-xl p-6 transition-transform hover:scale-[1.02]">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">মোট টাস্ক</p>
            <p className="mt-2 text-4xl font-bold text-indigo-600">{analyticsData?.totalTasks || 0}</p>
          </div>
          {/* Card 2: Completed Tasks */}
          <div className="bg-white overflow-hidden shadow-sm border border-slate-100 rounded-xl p-6 transition-transform hover:scale-[1.02]">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">সম্পন্ন হয়েছে</p>
            <p className="mt-2 text-4xl font-bold text-emerald-500">{analyticsData?.completedTasks || 0}</p>
          </div>
          {/* Card 3: Pending Tasks */}
          <div className="bg-white overflow-hidden shadow-sm border border-slate-100 rounded-xl p-6 transition-transform hover:scale-[1.02]">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">চলমান/বাকি আছে</p>
            <p className="mt-2 text-4xl font-bold text-amber-500">{analyticsData?.pendingTasks || 0}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Bar Chart (Task Overview) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">📉 টাস্ক ওভারভিউ (বার চার্ট)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={13} />
                  <YAxis stroke="#94a3b8" fontSize={13} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ color: "#38bdf8" }}
                  />
                  <Bar dataKey="value" name="টাস্ক সংখ্যা" radius={[8, 8, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Area/Line Chart (Performance Trend) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">📈 প্রগ্রেস ট্রেন্ড (এরিয়া চার্ট)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={13} />
                  <YAxis stroke="#94a3b8" fontSize={13} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff" }} />
                  <Area type="monotone" dataKey="value" name="টাস্ক সংখ্যা" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Pie Chart (Distribution) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">🍕 টাস্ক বন্টন অনুপাত (পাই চার্ট)</h3>
            <div className="h-80 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff" }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserAnalytics;
