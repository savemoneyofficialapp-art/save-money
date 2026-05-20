import { useEffect, useState } from "react";
import axios from "axios";
const API = "https://save-money-yyv1.onrender.com";
export default function Leaderboard() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {

    const res = await fetch(
      `${API}/leaderboard`
    );

    const data = await res.json();

    setUsers(data);
  };

  const rankColor = (rank) => {

    if(rank === "Bronze")
      return "#cd7f32";

    if(rank === "Silver")
      return "#cbd5e1";

    if(rank === "Gold")
      return "#facc15";

    if(rank === "Diamond")
      return "#38bdf8";

    if(rank === "Crown")
      return "#a855f7";

    return "#22c55e";
  };

  const rankIcon = (rank) => {

    if(rank === "Bronze")
      return "🥉";

    if(rank === "Silver")
      return "🥈";

    if(rank === "Gold")
      return "🥇";

    if(rank === "Diamond")
      return "💎";

    if(rank === "Crown")
      return "👑";

    return "⭐";
  };

  return (

    <div style={styles.container}>

      <h1 style={styles.title}>
        🏆 Live Leaderboard
      </h1>

      {/* TOP 3 */}

      <div style={styles.topWrap}>

        {users.slice(0,3).map((u,i)=>(

          <div
            key={i}
            style={{
              ...styles.topCard,
              borderColor: rankColor(u.rank)
            }}
          >

            <h2>
              {i===0 ? "🥇" :
               i===1 ? "🥈" : "🥉"}
            </h2>

            <h3>{u.name}</h3>

            <p style={{
              color: rankColor(u.rank),
              fontWeight:"bold"
            }}>
              {rankIcon(u.rank)} {u.rank}
            </p>

            <p>
              {u.totalDirect || 0} Direct
            </p>

          </div>

        ))}

      </div>

      {/* ALL USERS */}

      <div style={{marginTop:"25px"}}>

        {users.map((u,i)=>(

          <div
            key={i}
            style={styles.row}
          >

            <div style={styles.left}>

              <div style={styles.number}>
                #{i+1}
              </div>

              <div>

                <b>{u.name}</b>

                <p style={{
                  margin:0,
                  color:"#94a3b8"
                }}>
                  {u.totalDirect || 0}
                  {" "}Direct Referrals
                </p>

              </div>

            </div>

            <div style={{
              color: rankColor(u.rank),
              fontWeight:"bold"
            }}>
              {rankIcon(u.rank)}
              {" "}
              {u.rank}
            </div>

          </div>

        ))}

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

  title:{
    textAlign:"center",
    color:"#22c55e"
  },

  topWrap:{
    display:"flex",
    gap:"10px",
    marginTop:"25px"
  },

  topCard:{
    flex:1,
    background:"#1e293b",
    border:"2px solid",
    borderRadius:"20px",
    padding:"15px",
    textAlign:"center"
  },

  row:{
    background:"#1e293b",
    borderRadius:"15px",
    padding:"14px",
    marginTop:"10px",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  },

  left:{
    display:"flex",
    gap:"12px",
    alignItems:"center"
  },

  number:{
    width:"40px",
    height:"40px",
    borderRadius:"50%",
    background:"#0f172a",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    fontWeight:"bold"
  }

};