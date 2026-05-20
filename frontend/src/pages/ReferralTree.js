import { useEffect, useState } from "react";
import axios from "axios";
import API from "../api.js";

export default function ReferralTree() {

  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [tree, setTree] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [filter, setFilter] = useState("all");

  const [openNodes, setOpenNodes] = useState({});

  useEffect(() => {
    loadTree();
  }, [filter]);

  const loadTree = async () => {

    const res = await fetch(
      `${API}/referral-tree`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          filter
        })
      }
    );

    const data = await res.json();

    setTree(data.tree);
    setAnalytics(data.analytics);
  };

  const toggleNode = (key) => {

    setOpenNodes({
      ...openNodes,
      [key]: !openNodes[key]
    });
  };

  const renderNode = (
    node,
    indexPath = "root"
  ) => {

    const isOpen =
      openNodes[indexPath] ||
      indexPath === "root";

    return (
      <div
        style={styles.nodeWrap}
        key={indexPath}
      >

        <div style={styles.line}></div>

        <div
          style={{
            ...styles.nodeCard,
            borderColor:
              node.kycStatus === "approved"
                ? "#22c55e"
                : "#f59e0b"
          }}
          onClick={() => toggleNode(indexPath)}
        >

          <div>

            <h3 style={styles.level}>
              {
                node.level === 0
                ? "You"
                : `Level ${node.level}`
              }
            </h3>

            <p style={styles.name}>
              {node.name}

              {
                node.kycStatus === "approved" &&
                <span style={styles.badge}>
                  ✔
                </span>
              }
            </p>

            <p style={styles.small}>
              {node.email}
            </p>

            <p style={styles.small}>
              Code: {node.referCode}
            </p>

            <p style={styles.income}>
              Team Business:
              ₹{node.business || 0}
            </p>

          </div>

          <div>

            <span
              style={{
                ...styles.status,
                background:
                  node.kycStatus === "approved"
                    ? "#22c55e"
                    : "#f59e0b"
              }}
            >
              {
                node.kycStatus === "approved"
                ? "Active"
                : "Pending"
              }
            </span>

            {
              node.children &&
              node.children.length > 0 && (

                <p style={styles.childCount}>
                  {
                    isOpen
                    ? "▼"
                    : "▶"
                  }

                  {" "}

                  {node.children.length}
                </p>

              )
            }

          </div>

        </div>

        {
          isOpen &&
          node.children &&
          node.children.length > 0 && (

            <div style={styles.children}>

              {
                node.children.map((child, i) =>
                  renderNode(
                    child,
                    `${indexPath}-${i}`
                  )
                )
              }

            </div>

          )
        }

      </div>
    );
  };

  if (!tree) {
    return (
      <div style={styles.container}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>
        7 Level Referral Tree
      </h2>

      <div style={styles.analytics}>

        <div style={styles.analyticsCard}>
          <h3>{analytics.totalUsers}</h3>
          <p>Total Network</p>
        </div>

        <div style={styles.analyticsCard}>
          <h3>{analytics.activeUsers}</h3>
          <p>Active Users</p>
        </div>

        <div style={styles.analyticsCard}>
          <h3>₹{analytics.totalBusiness}</h3>
          <p>Total Business</p>
        </div>

      </div>

      <div style={styles.filterRow}>

        <button
          style={styles.filterBtn}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          style={styles.filterBtn}
          onClick={() => setFilter("active")}
        >
          Active
        </button>

        <button
          style={styles.filterBtn}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>

      </div>

      <div style={styles.levelBox}>

        {
          Object.keys(analytics.levels).map((lvl) => (

            <div
              key={lvl}
              style={styles.levelCard}
            >

              <h4>
                Level {lvl}
              </h4>

              <p>
                Users:
                {
                  analytics.levels[lvl].users
                }
              </p>

              <p>
                Active:
                {
                  analytics.levels[lvl].active
                }
              </p>

              <p>
                Business:
                ₹{
                  analytics.levels[lvl].income
                }
              </p>

            </div>

          ))
        }

      </div>

      {renderNode(tree)}

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

  title:{
    textAlign:"center",
    color:"#22c55e"
  },

  analytics:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr",
    gap:"10px",
    marginTop:"15px"
  },

  analyticsCard:{
    background:"#1e293b",
    padding:"14px",
    borderRadius:"14px",
    textAlign:"center"
  },

  filterRow:{
    display:"flex",
    gap:"10px",
    marginTop:"15px"
  },

  filterBtn:{
    flex:1,
    padding:"10px",
    border:"none",
    borderRadius:"10px",
    background:"#22c55e",
    color:"#020617",
    fontWeight:"bold"
  },

  levelBox:{
    marginTop:"18px"
  },

  levelCard:{
    background:"#1e293b",
    padding:"12px",
    borderRadius:"12px",
    marginTop:"10px"
  },

  nodeWrap:{
    marginTop:"12px",
    position:"relative"
  },

  line:{
    position:"absolute",
    left:"10px",
    top:"0",
    bottom:"0",
    width:"2px",
    background:"#334155"
  },

  nodeCard:{
    background:"#1e293b",
    border:"2px solid #334155",
    borderRadius:"16px",
    padding:"14px",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    marginLeft:"15px"
  },

  level:{
    color:"#94a3b8",
    fontSize:"13px",
    margin:0
  },

  name:{
    fontWeight:"bold",
    fontSize:"17px"
  },

  small:{
    fontSize:"12px",
    color:"#cbd5e1"
  },

  badge:{
    background:"#2563eb",
    borderRadius:"50%",
    padding:"2px 6px",
    marginLeft:"6px",
    fontSize:"11px"
  },

  income:{
    color:"#22c55e",
    fontWeight:"bold"
  },

  status:{
    padding:"5px 10px",
    borderRadius:"20px",
    color:"#020617",
    fontWeight:"bold",
    fontSize:"11px"
  },

  childCount:{
    marginTop:"10px",
    color:"#38bdf8",
    fontWeight:"bold"
  },

  children:{
    marginLeft:"20px",
    paddingLeft:"12px",
    borderLeft:"2px dashed #334155"
  }

};