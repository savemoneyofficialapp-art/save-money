import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";



export default function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
const [otpVerified, setOtpVerified] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

  const sendOTP = async () => {

  if (!email) {
    alert("Enter email");
    return;
  }

  try {

    setLoading(true);

    const res = await fetch(`${API}/send-forgot-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase()
      })
    });

    const data = await res.json();

    alert(data.msg || "OTP Sent");

    if (res.ok) {

      setOtpSent(true);

      let count = 30;

      setTimer(count);

      const interval = setInterval(() => {

        count--;

        setTimer(count);

        if (count <= 0) {
          clearInterval(interval);
        }

      }, 1000);

    }

  } catch (err) {

    console.log(err);

    alert("OTP send failed");

  } finally {

    setLoading(false);

  }
};

const verifyOTP = async () => {

  const finalOtp = otp.join("");

  if (finalOtp.length !== 6) {
    toast.warning("Enter complete OTP");
    return;
  }

  try {

    const res = await fetch(
      `${API}/verify-forgot-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          otp: finalOtp
        })
      }
    );

    const data = await res.json();

    if (data.success) {
  toast.success("OTP Verified");
  setOtpVerified(true);
} else {
  alert(data.msg);
}

  } catch (err) {

    console.log(err);

    toast.error("Verification Failed");

  }

};

  const handleOtp = (value, index) => {

    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (

    <div style={styles.container}>

      <div style={styles.wrapper}>

      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>

      <button
        style={styles.backBtn}
        onClick={() => navigate("/login")}
      >
        ←
      </button>

      <div style={styles.topSection}>

        <div style={styles.piggyWrap}>

          <div style={styles.shield}></div>

          <div style={styles.piggy}>
            🐷
          </div>

          <div style={styles.coin}>
            $
          </div>

        </div>

        <div style={styles.floating1}>🔒</div>
        <div style={styles.floating2}>✉</div>
        <div style={styles.floating3}>✔</div>

        <h1 style={styles.title}>
          Forgot <span>Password?</span>
        </h1>

        <p style={styles.subtitle}>
          No worries! Enter your email address and
          we’ll send you an OTP to reset your password.
        </p>

      </div>

      <div style={styles.card}>

        <div style={styles.stepWrap}>

          <div style={styles.stepCircle}>
            1
          </div>

          <div>

            <h3 style={styles.stepTitle}>
              Enter Eamil address
            </h3>

            <p style={styles.stepSub}>
              We’ll send you a 6-digit OTP
            </p>

          </div>

        </div>

        <div style={styles.inputBox}>

          <div style={styles.phoneIcon}>
            📞
          </div>

          <div style={styles.countryCode}>
            ✉
          </div>

          <input
            type="email"
            placeholder="Enter Eamil Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

        </div>

        <button
          style={styles.otpBtn}
          onClick={sendOTP}
        >

          {loading ? "Sending..." : "Send OTP"}

          <div style={styles.sendIcon}>
            ➤
          </div>

        </button>

      </div>

      <div style={styles.card}>

        <div style={styles.stepWrap}>

          <div style={styles.stepCircle}>
            2
          </div>

          <div>

            <h3 style={styles.stepTitle}>
              Enter OTP
            </h3>

            <p style={styles.stepSub}>
              Enter the 6-digit code sent to your email
            </p>

          </div>

        </div>

        <div style={styles.otpRow}>

          {otp.map((item, index) => (

            <input
              key={index}
              id={`otp-${index}`}
              maxLength={1}
              value={item}
              onChange={(e) =>
                handleOtp(e.target.value, index)
              }
              style={styles.otpInput}
            />

          ))}

        </div>

        <div style={styles.resendRow}>

          <span style={styles.grayText}>
            Didn’t receive code?
          </span>

          <span style={styles.resend}>

            Resend OTP

            <span style={styles.timer}>
              (00:{timer < 10 ? `0${timer}` : timer})
            </span>

          </span>

        </div>

      </div>

      <button
      style={styles.otpBtn}
       onClick={verifyOTP}
      >
       Verify OTP
      </button>

      {otpVerified && (
  <div style={styles.resetBox}>
    <h3 style={styles.resetTitle}>Create New Password</h3>

    <input
      type="password"
      placeholder="New Password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      style={styles.resetInput}
    />

    <input
      type="password"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      style={styles.resetInput}
    />

    <button style={styles.resetBtn} onClick={resetPassword}>
      Reset Password
    </button>
  </div>
)}

      <button
        style={styles.loginBtn}
        onClick={() => navigate("/login")}
      >

        <div style={styles.loginArrow}>
          ‹
        </div>

        Back to Login

      </button>

      <div style={styles.footer}>

        <div style={styles.footerLeft}>

          <div style={styles.footerIcon}>
            🛡
          </div>

          <span>
            Your security is our priority.
          </span>

        </div>

        <div style={styles.footerRight}>
          Safe • Secure • Trusted ✔
        </div>

      </div>

    </div>

     </div>
     
  );
}

const styles = {

  container: {
    minHeight: "100vh",
    background: "#f6f3ff",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial"
  },

  bgCircle1: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "rgba(168,85,247,0.08)",
    top: "-120px",
    left: "-120px"
  },

  bgCircle2: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "rgba(236,72,153,0.08)",
    bottom: "-140px",
    right: "-140px"
  },

  backBtn: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "none",
    background: "white",
    color: "#7c3aed",
    fontSize: "28px",
    fontWeight: "bold",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)"
  },

  topSection: {
    textAlign: "center",
    marginTop: "10px",
    position: "relative"
  },

  piggyWrap: {
    position: "relative",
    width: "220px",
    height: "220px",
    margin: "0 auto"
  },

  shield: {
    position: "absolute",
    width: "190px",
    height: "190px",
    background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    left: "15px",
    top: "10px",
    clipPath:
      "polygon(50% 0%, 90% 20%, 90% 65%, 50% 100%, 10% 65%, 10% 20%)",
    opacity: 0.22
  },

  piggy: {
    position: "absolute",
    fontSize: "120px",
    left: "48px",
    top: "45px"
  },

  coin: {
    position: "absolute",
    top: "10px",
    left: "92px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "#92400e",
    fontSize: "22px",
    boxShadow: "0 6px 14px rgba(0,0,0,0.2)"
  },

  floating1: {
    position: "absolute",
    left: "20px",
    top: "90px",
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
    color: "white",
    boxShadow: "0 10px 25px rgba(124,58,237,0.25)"
  },

  floating2: {
    position: "absolute",
    right: "20px",
    top: "90px",
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#0ea5e9,#3b82f6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
    color: "white"
  },

  floating3: {
    position: "absolute",
    right: "35px",
    top: "220px",
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#ec4899,#d946ef)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    color: "white"
  },

  title: {
    fontSize: "60px",
    fontWeight: "900",
    color: "#0f172a",
    marginTop: "-10px",
    marginBottom: "10px"
  },

  subtitle: {
    color: "#64748b",
    fontSize: "24px",
    lineHeight: "38px",
    padding: "0 15px"
  },

  card: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "34px",
    padding: "28px",
    marginTop: "28px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08)"
  },

  stepWrap: {
    display: "flex",
    alignItems: "flex-start",
    gap: "18px"
  },

  stepCircle: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "28px"
  },

  stepTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "36px",
    fontWeight: "800"
  },

  stepSub: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "22px"
  },

  inputBox: {
    marginTop: "25px",
    border: "2px solid #c084fc",
    borderRadius: "22px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    background: "white"
  },

  phoneIcon: {
    width: "90px",
    height: "85px",
    background: "#f3e8ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "35px",
    color: "#7c3aed"
  },

  countryCode: {
    width: "110px",
    textAlign: "center",
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "24px",
    borderRight: "2px solid #e5e7eb"
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "0 20px",
    fontSize: "24px",
    color: "#0f172a",
    background: "transparent"
  },

  otpBtn: {
    width: "100%",
    height: "85px",
    border: "none",
    borderRadius: "50px",
    marginTop: "25px",
    background: "linear-gradient(135deg,#4f46e5,#ec4899)",
    color: "white",
    fontSize: "32px",
    fontWeight: "800",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    boxShadow: "0 10px 25px rgba(124,58,237,0.25)"
  },

  sendIcon: {
    position: "absolute",
    right: "12px",
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "white",
    color: "#ec4899",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    fontWeight: "bold"
  },

  otpRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    gap: "10px"
  },

  otpInput: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    border: "2px solid #d8b4fe",
    textAlign: "center",
    fontSize: "34px",
    outline: "none",
    color: "#7c3aed",
    fontWeight: "bold"
  },

  resendRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "24px",
    fontSize: "22px"
  },

  grayText: {
    color: "#64748b"
  },

  resend: {
    color: "#7c3aed",
    fontWeight: "700"
  },

  timer: {
    color: "#6b7280"
  },

  resetBox: {
  marginTop: "25px",
  padding: "24px",
  borderRadius: "25px",
  background: "white",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
},

resetTitle: {
  fontSize: "28px",
  color: "#111827",
  marginBottom: "18px"
},

resetInput: {
  width: "100%",
  height: "60px",
  borderRadius: "18px",
  border: "2px solid #d8b4fe",
  padding: "0 18px",
  fontSize: "18px",
  marginBottom: "14px",
  outline: "none"
},

resetBtn: {
  width: "100%",
  height: "65px",
  border: "none",
  borderRadius: "25px",
  background: "linear-gradient(90deg,#2563eb,#ec4899)",
  color: "white",
  fontSize: "22px",
  fontWeight: "bold"
},

  loginBtn: {
    width: "100%",
    height: "90px",
    marginTop: "28px",
    borderRadius: "28px",
    border: "2px solid #e5e7eb",
    background: "white",
    color: "#7c3aed",
    fontSize: "32px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px"
  },

  loginArrow: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#f3e8ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "38px"
  },

  footer: {
    marginTop: "28px",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "26px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
  },

  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#0f172a",
    fontWeight: "700",
    fontSize: "22px"
  },

  footerIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#ede9fe",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px"
  },

  footerRight: {
    color: "#64748b",
    fontSize: "20px",
    fontWeight: "600"
  }

};