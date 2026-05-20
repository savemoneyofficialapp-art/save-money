import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import axios from "axios";

const API = "https://save-money-yyv1.onrender.com";

export default function UserAnalytics() {

  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {

    const res = await fetch(
      `${API}/user-dashboard-chart`,
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          authorization: token
        },
        body: JSON.stringify({
          email
        })
      }
    );

    const result = await res.json();

    setData(result);
  };

  if (!data) {
    return (
      <div style={styles.loading}>
        Loading Analytics...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>
        My Analytics
      </h1>

      <div style={styles.summaryGrid}>

        <div style={styles.card}>
          <h2>₹{data.wallet}</h2>
          <p>Wallet Balance</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalBonus}</h2>
          <p>Total Bonus</p>
        </div>

        <div style={styles.card}>
          <h2>
            {data.activeStatus}
          </h2>
          <p>Account Status</p>
        </div>

      </div>

      <div style={styles.chartBox}>

        <h2>Monthly Income Growth</h2>

        <ResponsiveContainer
          width="100%"
          height={280}
        >

          <LineChart
            data={data.monthlyData}
          >

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      <div style={styles.chartBox}>

        <h2>Investment Growth</h2>

        <ResponsiveContainer
          width="100%"
          height={280}
        >

          <BarChart
            data={data.monthlyData}
          >

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="investment"
              fill="#3b82f6"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

      <div style={styles.chartBox}>

        <h2>Monthly Referral Growth</h2>

        <ResponsiveContainer
          width="100%"
          height={280}
        >

          <BarChart
            data={data.monthlyData}
          >

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="referrals"
              fill="#f59e0b"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

      <div style={styles.chartBox}>

        <h2>Income Breakdown</h2>

        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <PieChart>

            <Pie
              data={data.incomeBreakdown}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label
            >

              <Cell fill="#22c55e" />
              <Cell fill="#3b82f6" />
              <Cell fill="#f59e0b" />
              <Cell fill="#8b5cf6" />

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

const styles = {

  container:{
    minHeight:"100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color:"white",
    padding:"20px"
  },

  loading:{
    minHeight:"100vh",
    background:"#020617",
    color:"white",
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  title:{
    textAlign:"center",
    color:"#22c55e"
  },

  summaryGrid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr",
    gap:"10px",
    marginTop:"20px"
  },

  card:{
    background:"#1e293b",
    padding:"16px",
    borderRadius:"18px",
    textAlign:"center"
  },

  chartBox:{
    background:"#1e293b",
    padding:"18px",
    borderRadius:"20px",
    marginTop:"20px"
  }

};