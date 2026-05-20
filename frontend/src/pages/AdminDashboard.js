import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import axios from "axios";


const API = "https://save-money-yyv1.onrender.com";

export default function AdminDashboard(){

  const [data,setData] = useState(null);

  const [kyc,setKyc] = useState([]);

  const [cash,setCash] = useState([]);

  const [users,setUsers] = useState([]);

  const [title,setTitle] = useState("");

const [message,setMessage] = useState("");

  useEffect(()=>{
    load();
  },[]);

  const token =
    localStorage.getItem("token");

  const load = async ()=>{

    // analytics
    const a = await fetch(
      `${API}/admin-analytics`,
      {
        headers:{
          authorization: token
        }
      }
    );

    const ad = await a.json();

    setData(ad);

    // kyc
    const k = await fetch(
      `${API}/pending-kyc`,
      {
        headers:{
          authorization: token
        }
      }
    );

const kData = await k.json();

console.log(kData);

setKyc(Array.isArray(kData) ? kData : []);

    // cash
    const c = await fetch(
      `${API}/cash-requests`,
      {
        headers:{
          authorization: token
        }
      }
    );

const cData = await c.json();

setCash(Array.isArray(cData) ? cData : []);

    // users
    const u = await fetch(
      `${API}/all-users`,
      {
        headers:{
          authorization: token
        }
      }
    );

const uData = await u.json();

setUsers(Array.isArray(uData) ? uData : []);  };

  // approve kyc
  const approveKYC = async (id) => {
  const res = await fetch(`${API}/approve-kyc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token
    },
    body: JSON.stringify({ userId: id })
  });

  const data = await res.json();

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

  return;
}

  alert(data.msg);

  load();
};

  

  // approve cash
  const approveCash = async(id)=>{

    await fetch(
      `${API}/approve-cash`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          authorization: token
        },
        body: JSON.stringify({
          requestId:id
        })
      }
    );

    load();
  };

  // ban
  const banUser = async(id)=>{

    await fetch(
      `${API}/ban-user`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          authorization: token
        },
        body: JSON.stringify({
          userId:id
        })
      }
    );

    load();
  };

  if(!data){
    return <div>Loading...</div>
  }

  const broadcast = async ()=>{

  await fetch(
    `${API}/broadcast`,
    {

      method:"POST",

      headers:{
        "Content-Type":"application/json",

        authorization:
        localStorage.getItem("token")
      },

      body: JSON.stringify({

        title,
        message

      })

    }
  );

  alert("Broadcast Sent");

};

  const chartData = [
    {
      name:"Users",
      value:data.totalUsers
    },
    {
      name:"KYC",
      value:data.kycApproved
    },
    {
      name:"Plans",
      value:data.activePlans
    }
  ];

  return(
    <div style={styles.container}>

      <h1 style={styles.title}>
        Admin Dashboard
      </h1>

      {/* cards */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h2>{data.totalUsers}</h2>
          <p>Total Users</p>
        </div>

        <div style={styles.card}>
          <h2>{data.todayUsers}</h2>
          <p>Today Users</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalInvestment}</h2>
          <p>Total Investment</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalWallet}</h2>
          <p>Total Wallet</p>
        </div>

        <div style={styles.card}>
          <h2>{data.kycApproved}</h2>
          <p>KYC Approved</p>
        </div>

        <div style={styles.card}>
          <h2>{data.pendingCash}</h2>
          <p>Cash Requests</p>
        </div>

      </div>

      {/* chart */}
      <div style={styles.chartBox}>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={chartData}>

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar dataKey="value" />

          </BarChart>

        </ResponsiveContainer>

      </div>

      {/* kyc */}
      <div style={styles.section}>

        <h2>Pending KYC</h2>

        {kyc.map((u,i)=>(

          <div key={i} style={styles.row}>

            <div>
              <b>{u.name}</b>
              <p>{u.email}</p>
            </div>

            <div>

              <button
                style={styles.green}
                onClick={()=>approveKYC(u._id)}
              >
                Approve
              </button>

              <button
  style={styles.green}
  onClick={() => window.location.href = "/admin-support"}
>
  Support Tickets
</button>

            </div>

          </div>

          

        ))}

      </div>

      {/* cash */}
      <div style={styles.section}>

        <h2>Cash Requests</h2>

        {cash.map((c,i)=>(

          <div key={i} style={styles.row}>

            <div>

              <b>{c.email}</b>

              <p>
                ₹{c.amount}
              </p>

            </div>

            <button
              style={styles.green}
              onClick={()=>approveCash(c._id)}
            >
              Approve
            </button>

            <button
  style={styles.green}
  onClick={() => window.location.href = "/admin-analytics"}
>
  Advanced Analytics
</button>

<button
  style={styles.green}
  onClick={() => window.location.href = "/admin-user-control"}
>
  User Control
</button>

          </div>

        ))}

      </div>

      <div style={styles.section}>

  <h2>
    Broadcast Message
  </h2>

  <input

    style={styles.input}

    placeholder="Notification Title"

    value={title}

    onChange={(e)=>
      setTitle(e.target.value)
    }

  />

  <textarea

    style={styles.input}

    placeholder="Write Message"

    value={message}

    onChange={(e)=>
      setMessage(e.target.value)
    }

  />

  <button

    style={styles.green}

    onClick={broadcast}

  >

    Send To All Users

  </button>

</div>

      {/* users */}
      <div style={styles.section}>

        <h2>All Users</h2>

        {users.map((u,i)=>(

          <div key={i} style={styles.row}>

            <div>

              <b>{u.name}</b>

              <p>{u.email}</p>

            </div>

            <button
              style={styles.red}
              onClick={()=>banUser(u._id)}
            >
              Ban
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

const styles = {

  container:{
    minHeight:"100vh",
    background:"#020617",
    padding:"20px",
    color:"white"
  },

  title:{
    textAlign:"center",
    color:"#22c55e"
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:"10px",
    marginTop:"20px"
  },

  card:{
    background:"#1e293b",
    padding:"20px",
    borderRadius:"15px",
    textAlign:"center"
  },

  input:{
  width:"100%",
  padding:"12px",
  borderRadius:"10px",
  border:"none",
  marginTop:"10px"
},

  chartBox:{
    background:"#1e293b",
    marginTop:"20px",
    padding:"15px",
    borderRadius:"15px"
  },

  section:{
    background:"#1e293b",
    marginTop:"20px",
    padding:"15px",
    borderRadius:"15px"
  },

  row:{
    background:"#0f172a",
    marginTop:"10px",
    padding:"12px",
    borderRadius:"10px",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  },

  green:{
    background:"#22c55e",
    border:"none",
    padding:"10px",
    borderRadius:"8px",
    color:"white"
  },

  red:{
    background:"#ef4444",
    border:"none",
    padding:"10px",
    borderRadius:"8px",
    color:"white"
  }

};