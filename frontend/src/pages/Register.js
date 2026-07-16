import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    referCode: "",
    otp: ""
  });

  // UI & Verification States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Loading & Feedback States
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Real-time Password Strength Estimator
  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const labels = ["Very Weak", "Weak", "Medium", "Strong"];
    const colors = ["#ff4d4d", "#ff944d", "#ffd11a", "#00e676"];
    return { score, label: labels[score - 1] || "Very Weak", color: colors[score - 1] || "#ff4d4d" };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // 1. Trigger OTP Request
  const handleSendOtp = async () => {
    setFeedback({ type: "", message: "" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/send-email-otp", { 
        email: formData.email.toLowerCase() 
      });

      if (response.data.success) {
        setIsOtpSent(true);
        setOtpTimer(120); // 2 minutes cooldown
        setFeedback({ type: "success", message: "Verification code sent to your email." });
      } else {
        setFeedback({ type: "error", message: response.data.msg || "Failed to dispatch OTP." });
      }
    } catch (err) {
      setFeedback({ 
        type: "error", 
        message: err.response?.data?.msg || "Server connection failed. Try again later." 
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Final Registration Process
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (passwordStrength.score < 3) {
      setFeedback({ type: "error", message: "Please choose a stronger password containing numbers and letters." });
      return;
    }

    if (!termsAccepted) {
      setFeedback({ type: "error", message: "You must agree to the terms and conditions." });
      return;
    }

    if (!isOtpSent || !formData.otp) {
      setFeedback({ type: "error", message: "Email verification is required." });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/register", {
        ...formData,
        termsAccepted
      });

      if (response.data.success) {
        setFeedback({ type: "success", message: "Your registration is successful!" });
        setFormData({ name: "", mobile: "", email: "", password: "", confirmPassword: "", referCode: "", otp: "" });
        setIsOtpSent(false);
        setTermsAccepted(false);
      } else {
        setFeedback({ type: "error", message: response.data.msg || "Registration failed." });
      }
    } catch (err) {
      setFeedback({ 
        type: "error", 
        message: err.response?.data?.msg || "An error occurred during registration." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageBg}>
      <div style={styles.container}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.headerTitle}>Get Started</h2>
            <p style={styles.headerSubtitle}>Create your secured transaction wallet account</p>
          </div>

          {/* Feedback Toast Banner */}
          {feedback.message && (
            <div style={{...styles.feedbackBanner, ...(feedback.type === "success" ? styles.bannerSuccess : styles.bannerError)}}>
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback({ type: "", message: "" })} style={styles.closeBanner}>×</button>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            {/* Name and Mobile Row */}
            <div style={styles.grid2Col}>
              <div style={styles.inputBox}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputBox}>
                <label style={styles.label}>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="e.g. +123456789"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Email Field with Send OTP Button */}
            <div style={styles.inputBox}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.emailGroup}>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isOtpSent}
                  style={{...styles.input, flex: 1}}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || otpTimer > 0 || !formData.email}
                  style={{
                    ...styles.otpButton,
                    ...((loading || otpTimer > 0 || !formData.email) ? styles.otpButtonDisabled : {})
                  }}
                >
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : isOtpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            </div>

            {/* OTP Input Field */}
            {isOtpSent && (
              <div style={styles.inputBox}>
                <label style={styles.label}>Email Verification OTP</label>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  value={formData.otp}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            )}

            {/* Password Row */}
            <div style={styles.grid2Col}>
              <div style={styles.inputBox}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Choose password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
                {formData.password && (
                  <div style={styles.strengthBar}>
                    <div 
                      style={{ 
                        height: "100%",
                        borderRadius: "2px",
                        transition: "width 0.4s ease",
                        width: `${(passwordStrength.score / 4) * 100}%`, 
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                    <span style={{...styles.strengthLabel, color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div style={styles.inputBox}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Retype password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Referral Code */}
            <div style={styles.inputBox}>
              <label style={styles.label}>Referral Code (Optional)</label>
              <input
                type="text"
                name="referCode"
                placeholder="Enter valid code"
                value={formData.referCode}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            {/* Terms & Conditions Checkbox */}
            <div style={styles.checkboxContainer}>
              <div style={styles.checkboxWrapper} onClick={() => setShowTermsModal(true)}>
                <div style={{...styles.checkboxIcon, ...(termsAccepted ? styles.checkboxIconChecked : {})}}>
                  {termsAccepted && <span style={styles.checkmark}>✔</span>}
                </div>
                <span style={styles.checkboxText}>
                  I read and accept the <span style={styles.highlightLink}>Terms & Conditions</span>
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? <div style={styles.spinner}></div> : "Create Account"}
            </button>
          </form>
        </div>
      </div>

      {/* Modern Backdrop blur Modal for T&C */}
      {showTermsModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>System Terms & Regulations</h3>
              <p style={styles.modalSubtitle}>Please review our operating guidelines carefully before accepting.</p>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.legalSegment}>
                <h4 style={styles.legalTitle}>1. Scope of Service</h4>
                <p style={styles.legalText}>This platform acts as a secured saving utility wallet. We provide features utilizing cutting-edge security mechanisms, designed to safeguard users assets.</p>
              </div>

              <div style={styles.legalSegment}>
                <h4 style={styles.legalTitle}>2. Identity and Multi-Accounts</h4>
                <p style={styles.legalText}>Users are allowed to operate only one unique verified profile. Creating dummy profiles, multi-accounting on the same physical device, or utilizing VPN structures to exploit referrals is strictly restricted.</p>
              </div>

              <div style={styles.legalSegment}>
                <h4 style={styles.legalTitle}>3. OTP & Registration Verification</h4>
                <p style={styles.legalText}>Email verification codes are system generated. Users must not share received OTPs with any admin or third party. Our personnel will never request your account OTP.</p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                className="decline-btn" 
                style={styles.modalDeclineBtn} 
                onClick={() => { setTermsAccepted(false); setShowTermsModal(false); }}
              >
                Decline
              </button>
              <button 
                style={styles.modalAcceptBtn} 
                onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
              >
                Accept & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= MODERN PREMIUM DARK THEME STYLES =================
const styles = {
  pageBg: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    color: "#f8fafc"
  },
  container: {
    width: "100%",
    maxWidth: "650px"
  },
  formCard: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
  },
  formHeader: {
    textAlign: "center",
    marginBottom: "30px"
  },
  headerTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "8px",
    background: "linear-gradient(90deg, #a5b4fc, #e0e7ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: transparent => "transparent"
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: "0.95rem",
    margin: 0
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  grid2Col: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px"
  },
  inputBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative"
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "500",
    color: "#cbd5e1"
  },
  input: {
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#f8fafc",
    fontSize: "0.95rem",
    outline: "none",
    transition: "all 0.3s ease"
  },
  emailGroup: {
    display: "flex",
    gap: "10px"
  },
  otpButton: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    border-radius: "10px",
    borderRadius: "10px",
    padding: "0 20px",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.3s ease"
  },
  otpButtonDisabled: {
    background: "rgba(255, 255, 255, 0.1)",
    color: "#94a3b8",
    cursor: "not-allowed"
  },
  strengthBar: {
    height: "4px",
    width: "100%",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "2px",
    marginTop: "5px",
    position: "relative"
  },
  strengthLabel: {
    position: "absolute",
    right: 0,
    top: "8px",
    fontSize: "0.75rem",
    fontWeight: "600"
  },
  checkboxContainer: {
    marginTop: "10px"
  },
  checkboxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer"
  },
  checkboxIcon: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(15, 23, 42, 0.6)",
    transition: "all 0.2s ease"
  },
  checkboxIconChecked: {
    background: "#4f46e5",
    borderColor: "#4f46e5"
  },
  checkmark: {
    color: "white",
    fontSize: "0.75rem",
    fontWeight: "bold"
  },
  checkboxText: {
    fontSize: "0.9rem",
    color: "#cbd5e1"
  },
  highlightLink: {
    color: "#818cf8",
    textDecoration: "underline",
    fontWeight: "500"
  },
  submitBtn: {
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    color: "white",
    border: "none",
    border-radius: "12px",
    borderRadius: "12px",
    padding: "15px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.2s ease"
  },
  feedbackBanner: {
    display: "flex",
    justifyContent: "between",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: "500",
    marginBottom: "20px"
  },
  bannerSuccess: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#34d399"
  },
  bannerError: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#f87171"
  },
  closeBanner: {
    background: "transparent",
    border: "none",
    color: "inherit",
    fontSize: "1.2rem",
    cursor: "pointer"
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalCard: {
    background: "#1e293b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "20px",
    maxWidth: "550px",
    width: "100%",
    boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6)",
    display: "flex",
    flexDirection: "column"
  },
  modalHeader: {
    padding: "25px 30px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#f8fafc",
    margin: "0 0 6px 0"
  },
  modalSubtitle: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    margin: 0
  },
  modalBody: {
    padding: "30px",
    maxHeight: "250px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  legalSegment: {},
  legalTitle: {
    fontSize: "0.95rem",
    color: "#f1f5f9",
    margin: "0 0 8px 0"
  },
  legalText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: 0
  },
  modalFooter: {
    padding: "20px 30px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px"
  },
  modalDeclineBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "600"
  },
  modalAcceptBtn: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "10px 24px",
    cursor: "pointer",
    fontWeight: "600"
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s infinite linear"
  }
};
