import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Register.css";

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

    // Client-side Email Check
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

    // Extra Validation Layers
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
        // Reset state after success
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
    <div className="register-page-bg">
      <div className="register-container">
        <div className="form-card">
          <div className="form-header">
            <h2>Get Started</h2>
            <p>Create your secured transaction wallet account</p>
          </div>

          {/* Feedback Toast Notification */}
          {feedback.message && (
            <div className={`feedback-banner ${feedback.type}`}>
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback({ type: "", message: "" })} className="close-banner">×</button>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="register-form">
            <div className="grid-2-col">
              {/* Full Name */}
              <div className="input-box">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Mobile Number */}
              <div className="input-box">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="e.g. +123456789"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Email with Side Button */}
            <div className="input-box">
              <label>Email Address</label>
              <div className="email-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isOtpSent}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="otp-button"
                  disabled={loading || otpTimer > 0 || !formData.email}
                >
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : isOtpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            </div>

            {/* OTP Input Field with CSS slide-down effect */}
            {isOtpSent && (
              <div className="input-box animate-slide-down">
                <label>Email Verification OTP</label>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="grid-2-col">
              {/* Password */}
              <div className="input-box">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Choose password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {/* Password strength meter */}
                {formData.password && (
                  <div className="strength-meter-bar">
                    <div 
                      className="fill" 
                      style={{ 
                        width: `${(passwordStrength.score / 4) * 100}%`, 
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="input-box">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Retype password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Referral Code */}
            <div className="input-box">
              <label>Referral Code (Optional)</label>
              <input
                type="text"
                name="referCode"
                placeholder="Enter valid code"
                value={formData.referCode}
                onChange={handleInputChange}
              />
            </div>

            {/* Terms and conditions Container */}
            <div className="checkbox-container">
              <div 
                className={`custom-checkbox-wrapper ${termsAccepted ? "checked" : ""}`}
                onClick={() => setShowTermsModal(true)}
              >
                <div className="checkbox-icon">
                  {termsAccepted && <span className="checkmark">✔</span>}
                </div>
                <span className="checkbox-text">
                  I read and accept the <span className="highlight-link">Terms & Conditions</span>
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="primary-register-btn" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modern Backdrop blur Modal for T&C */}
      {showTermsModal && (
        <div className="modal-backdrop-blur">
          <div className="modal-container-card">
            <div className="modal-header-section">
              <h3>System Terms & Regulations</h3>
              <p>Please review our operating guidelines carefully before accepting.</p>
            </div>
            
            <div className="modal-scroll-body">
              <div className="legal-segment">
                <h4>1. Scope of Service</h4>
                <p>This platform acts as a secured saving utility wallet. We provide features utilizing cutting-edge security mechanisms, designed to safeguard users assets.</p>
              </div>

              <div className="legal-segment">
                <h4>2. Identity and Multi-Accounts</h4>
                <p>Users are allowed to operate only one unique verified profile. Creating dummy profiles, multi-accounting on the same physical device, or utilizing VPN structures to exploit referrals is strictly restricted and will cause immediate ban without refunds.</p>
              </div>

              <div className="legal-segment">
                <h4>3. OTP & Registration Verification</h4>
                <p>Email verification codes are system generated. Users must not share received OTPs with any admin or third party. Our personnel will never request your account OTP.</p>
              </div>

              <div className="legal-segment">
                <h4>4. Liability & Asset Control</h4>
                <p>Users hold the utmost responsibility for executing safe peer transactions, withdrawals, and keeping safe access keys. Transactions committed in the blockchain or system ledgers cannot be rolled back.</p>
              </div>
            </div>

            <div className="modal-button-footer">
              <button className="decline-action-btn" onClick={handleDeclineTerms}>
                Decline
              </button>
              <button className="accept-action-btn" onClick={handleAcceptTerms}>
                Accept & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
