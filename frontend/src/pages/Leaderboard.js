export default function Leaderboard() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Animated Gear/Loader */}
        <div style={styles.spinnerContainer}>
          <div style={styles.gear}>⚙️</div>
        </div>
        
        <h1 style={styles.title}>Maintenance in Progress</h1>
        <p style={styles.message}>
          We are currently working on this section. It will be fixed very soon! Thank you for your patience.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0f172a",
    color: "white",
    padding: "20px",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    background: "#1e293b",
    padding: "40px 30px",
    borderRadius: "16px",
    border: "1px solid #334155",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
  },
  spinnerContainer: {
    marginBottom: "20px",
  },
  gear: {
    fontSize: "50px",
    display: "inline-block",
    animation: "spin 2s linear infinite",
  },
  title: {
    color: "#22c55e",
    fontSize: "22px",
    marginBottom: "10px",
    fontWeight: "bold"
  },
  message: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.6"
  }
};

// Injecting keyframes for rotation animation dynamically
if (typeof document !== "undefined") {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Fallback if stylesheet isn't accessible
    const tag = document.createElement("style");
    tag.innerHTML = keyframes;
    document.head.appendChild(tag);
  }
}
