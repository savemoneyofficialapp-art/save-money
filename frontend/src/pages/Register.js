import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    referCode: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  // ================= INPUT =================

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  // ================= REGISTER =================

  const register = async () => {

    if (
      !form.name ||
      !form.email ||
      !form.mobile ||
      !form.password
    ) {
      alert("Please fill all fields");
      return;
    }

    if (!agree) {
      alert("Please accept Terms & Conditions");
      return;
    }

    try {

      setLoading(true);

      const res = await fetch(
        `${process.env.REACT_APP_API}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":"application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data = await res.json();

      alert(data.msg);

      if (data.msg === "Registration successful") {

        navigate("/login");

      }

    } catch (err) {

      console.log(err);

      alert("Server error");

    } finally {

      setLoading(false);

    }

  };

  return (
    <div style={styles.container}>

      {/* BG GLOW */}

      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      {/* CARD */}

      <div style={styles.card}>

        {/* LOGO */}

        <div style={styles.logoBox}>

          <div style={styles.logoCircle}>
            💰
          </div>

          <h1 style={styles.logoText}>
            Save Money
          </h1>

          <p style={styles.slogan}>
            Save & Earn
          </p>

        </div>

        {/* TITLE */}

        <h2 style={styles.title}>
          Create Account
        </h2>

        <p style={styles.subtitle}>
          Join the future investment platform
        </p>

        {/* NAME */}

        <div style={styles.inputBox}>

          <User size={18} color="#94a3b8" />

          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
          />

        </div>

        {/* EMAIL */}

        <div style={styles.inputBox}>

          <Mail size={18} color="#94a3b8" />

          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
          />

        </div>

        {/* MOBILE */}

        <div style={styles.inputBox}>

          <Phone size={18} color="#94a3b8" />

          <input
            style={styles.input}
            type="number"
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
          />

        </div>

        {/* PASSWORD */}

        <div style={styles.inputBox}>

          <Lock size={18} color="#94a3b8" />

          <input
            style={styles.input}
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create Password"
            value={form.password}
            onChange={handleChange}
          />

          <div
            style={styles.eye}
            onClick={() =>
              setShowPassword(!showPassword)
            }
          >

            {
              showPassword
                ? <EyeOff size={18} />
                : <Eye size={18} />
            }

          </div>

        </div>

        {/* REFER CODE */}

        <div style={styles.inputBox}>

          <ShieldCheck size={18} color="#94a3b8" />

          <input
            style={styles.input}
            type="text"
            name="referCode"
            placeholder="Referral Code (Optional)"
            value={form.referCode}
            onChange={handleChange}
          />

        </div>

        {/* PASSWORD RULE */}

        <div style={styles.passwordInfo}>
          Password should contain letters & numbers
        </div>

        {/* TERMS */}

        <div style={styles.termsBox}>

          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
          />

          <p style={styles.termsText}>
            I agree to the
            <span
              style={styles.link}
              onClick={() => navigate("/legal/terms")}
            >
              {" "}Terms & Conditions
            </span>
            {" "}and
            <span
              style={styles.link}
              onClick={() => navigate("/legal/privacy")}
            >
              {" "}Privacy Policy
            </span>
          </p>

        </div>

        {/* REGISTER BTN */}

        <button
          style={
            loading
              ? styles.disabledBtn
              : styles.registerBtn
          }
          onClick={register}
          disabled={loading}
        >

          {
            loading
              ? "Creating Account..."
              : (
                <>
                  Register
                  <ArrowRight size={18} />
                </>
              )
          }

        </button>

        {/* LOGIN */}

        <div style={styles.bottom}>

          Already have an account?

          <span
            style={styles.loginLink}
            onClick={() => navigate("/login")}
          >
            {" "}Go for Login
          </span>

        </div>

      </div>

    </div>
  );
}

// ================= STYLES =================

const styles = {

  container:{
    minHeight:"100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a,#111827)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    padding:"20px",
    overflow:"hidden",
    position:"relative"
  },

  glow1:{
    width:"250px",
    height:"250px",
    borderRadius:"50%",
    background:"#22c55e",
    filter:"blur(120px)",
    opacity:0.25,
    position:"absolute",
    top:"-60px",
    left:"-60px"
  },

  glow2:{
    width:"250px",
    height:"250px",
    borderRadius:"50%",
    background:"#3b82f6",
    filter:"blur(120px)",
    opacity:0.2,
    position:"absolute",
    bottom:"-60px",
    right:"-60px"
  },

  card:{
    width:"100%",
    maxWidth:"430px",
    background:"rgba(30,41,59,0.92)",
    backdropFilter:"blur(15px)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:"28px",
    padding:"28px",
    zIndex:10,
    boxShadow:"0 0 35px rgba(0,0,0,0.45)"
  },

  logoBox:{
    textAlign:"center",
    marginBottom:"20px"
  },

  logoCircle:{
    width:"70px",
    height:"70px",
    borderRadius:"20px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    fontSize:"34px",
    margin:"auto",
    boxShadow:"0 0 25px rgba(34,197,94,0.45)"
  },

  logoText:{
    color:"white",
    marginTop:"14px",
    marginBottom:"2px",
    fontSize:"30px"
  },

  slogan:{
    color:"#38bdf8",
    margin:0,
    fontWeight:"bold",
    letterSpacing:"1px"
  },

  title:{
    color:"white",
    textAlign:"center",
    marginBottom:"5px"
  },

  subtitle:{
    color:"#94a3b8",
    textAlign:"center",
    marginBottom:"25px",
    fontSize:"14px"
  },

  inputBox:{
    background:"#0f172a",
    border:"1px solid #334155",
    borderRadius:"16px",
    padding:"0 14px",
    display:"flex",
    alignItems:"center",
    marginTop:"14px",
    height:"56px"
  },

  input:{
    flex:1,
    background:"transparent",
    border:"none",
    outline:"none",
    color:"white",
    fontSize:"15px",
    marginLeft:"10px"
  },

  eye:{
    cursor:"pointer",
    color:"#94a3b8"
  },

  passwordInfo:{
    color:"#94a3b8",
    fontSize:"12px",
    marginTop:"10px"
  },

  termsBox:{
    display:"flex",
    alignItems:"flex-start",
    gap:"10px",
    marginTop:"18px"
  },

  termsText:{
    color:"#cbd5e1",
    fontSize:"13px",
    lineHeight:"22px",
    margin:0
  },

  link:{
    color:"#38bdf8",
    cursor:"pointer",
    fontWeight:"bold"
  },

  registerBtn:{
    width:"100%",
    height:"56px",
    border:"none",
    borderRadius:"18px",
    marginTop:"22px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    color:"white",
    fontSize:"16px",
    fontWeight:"bold",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    gap:"8px",
    boxShadow:"0 0 25px rgba(34,197,94,0.35)"
  },

  disabledBtn:{
    width:"100%",
    height:"56px",
    border:"none",
    borderRadius:"18px",
    marginTop:"22px",
    background:"#334155",
    color:"#94a3b8",
    fontSize:"16px",
    fontWeight:"bold"
  },

  bottom:{
    textAlign:"center",
    color:"#cbd5e1",
    marginTop:"22px",
    fontSize:"14px"
  },

  loginLink:{
    color:"#38bdf8",
    fontWeight:"bold",
    cursor:"pointer"
  }

};