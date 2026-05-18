import { useNavigate } from "react-router-dom";

export default function Footer() {

  const navigate = useNavigate();

  return (
    <div style={styles.footer}>

      <p style={styles.logo}>
        Save Money
      </p>

      <div style={styles.links}>

        <span
          style={styles.link}
          onClick={() => navigate("/legal/privacy")}
        >
          Privacy Policy
        </span>

        <span
          style={styles.link}
          onClick={() => navigate("/legal/terms")}
        >
          Terms
        </span>

        <span
          style={styles.link}
          onClick={() => navigate("/legal/refund")}
        >
          Refund
        </span>

        <span
          style={styles.link}
          onClick={() => navigate("/legal/risk")}
        >
          Risk Disclosure
        </span>

        <span
          style={styles.link}
          onClick={() => navigate("/legal/aml")}
        >
          AML & KYC
        </span>

        <span
          style={styles.link}
          onClick={() => navigate("/legal/disclaimer")}
        >
          Disclaimer
        </span>

      </div>

      <p style={styles.copy}>
        © 2026 Save Money. All Rights Reserved.
      </p>

    </div>
  );
}

const styles = {

  footer:{
    background:"#020617",
    padding:"25px",
    marginTop:"30px",
    borderTop:"1px solid #334155",
    textAlign:"center"
  },

  logo:{
    color:"#22c55e",
    fontSize:"22px",
    fontWeight:"bold"
  },

  links:{
    display:"flex",
    flexWrap:"wrap",
    justifyContent:"center",
    gap:"12px",
    marginTop:"15px"
  },

  link:{
    color:"#38bdf8",
    cursor:"pointer",
    fontSize:"13px"
  },

  copy:{
    marginTop:"15px",
    color:"#94a3b8",
    fontSize:"12px"
  }

};