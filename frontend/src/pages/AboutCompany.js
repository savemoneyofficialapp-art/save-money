export default function AboutCompany() {

  return (

    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          SAVE MONEY
        </h1>

        <p style={styles.slogan}>
          Save & Earn
        </p>

        <div style={styles.section}>

          <h2>About Us</h2>

          <p>
            Save Money is a private investment and
            systematic saving platform designed to
            help users grow their savings and create
            earning opportunities through digital
            financial activities.
          </p>

        </div>

        <div style={styles.section}>

          <h2>Our Mission</h2>

          <p>
            Our mission is to build disciplined
            saving habits and provide users with
            modern digital earning opportunities.
          </p>

        </div>

        <div style={styles.section}>

          <h2>Our Vision</h2>

          <p>
            Our vision is to transform Save Money
            into a trusted financial technology
            platform in the future.
          </p>

        </div>

        <div style={styles.notice}>

          This is a private initiative platform.
          Users should read all terms, conditions,
          and policies before investing.

        </div>

      </div>

    </div>

  );

}

const styles = {

  container:{
    minHeight:"100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    padding:"20px",
    color:"white"
  },

  card:{
    background:"#1e293b",
    borderRadius:"25px",
    padding:"22px",
    border:"1px solid #334155"
  },

  title:{
    textAlign:"center",
    color:"#22c55e"
  },

  slogan:{
    textAlign:"center",
    color:"#38bdf8",
    fontWeight:"bold"
  },

  section:{
    marginTop:"18px",
    background:"#0f172a",
    padding:"16px",
    borderRadius:"18px",
    lineHeight:"28px"
  },

  notice:{
    marginTop:"20px",
    padding:"15px",
    borderRadius:"18px",
    background:"#f59e0b",
    color:"#020617",
    fontWeight:"bold"
  }

};