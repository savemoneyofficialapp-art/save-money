import React from "react";

export default function AboutCompany() {
  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* Hero Section */}
        <div style={styles.heroSection}>
          <div style={styles.badge}>🚀 NEXT-GEN FINTECH PLATFORM</div>
          <h1 style={styles.title}>SAVE MONEY</h1>
          <p style={styles.slogan}>Smart Investing • Exponential Growth • Financial Freedom</p>
          <p style={styles.heroDesc}>
            Save Money হলো একটি প্রাতিষ্ঠানিক মানের অ্যালগরিদমিক সেভিংস এবং ডাইভারসিফাইড ইনভেস্টমেন্ট প্ল্যাটফর্ম। 
            আমরা আধুনিক ডিজিটাল প্রযুক্তির মাধ্যমে আপনার সঞ্চয়কে নিরাপদ রেখে সর্বোচ্চ সম্পদ বৃদ্ধিতে সাহায্য করি।
          </p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>$50M+</h3>
            <p style={styles.statLabel}>ম্যানেজড ডিজিটাল অ্যাসেট</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>100K+</h3>
            <p style={styles.statLabel}>সক্রিয় বিনিয়োগকারী</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>99.9%</h3>
            <p style={styles.statLabel}>প্ল্যাটফর্ম সিকিউরিটি স্কোর</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>24/7</h3>
            <p style={styles.statLabel}>ইনস্ট্যান্ট লিকুইডিটি পে-আউট</p>
          </div>
        </div>

        {/* Why Choose Us / Key Features */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>কেন Save Money নির্বাচন করবেন?</h2>
          <p style={styles.sectionSub}>আমাদের প্রিমিয়াম ইনভেস্টমেন্ট ফিচারসমূহ</p>
        </div>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🛡️</div>
            <h3 style={styles.featureTitle}>ব্যাংক-গ্রেড সিকিউরিটি</h3>
            <p style={styles.featureDesc}>
              ২৫৬-বিট এসএসএল এনক্রিপশন এবং মাল্টি-ফ্যাক্টর প্রোটোকল দিয়ে আপনার প্রতিটি ট্রানজেকশন সুরক্ষিত রাখা হয়।
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📈</div>
            <h3 style={styles.featureTitle}>অটো-ব্যালান্সিং পোর্টফোলিও</h3>
            <p style={styles.featureDesc}>
              আমাদের স্মার্ট অ্যালগরিদম সর্বনিম্ন ঝুঁকি নিশ্চিত করে মার্কেটের সেরা রিটার্ন জেনারেট করতে কাজ করে।
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>ইনস্ট্যান্ট ক্যাশআউট</h3>
            <p style={styles.featureDesc}>
              কোনো প্রকার দীর্ঘসূত্রতা ছাড়াই আপনার প্রফিট ও মূলধন যেকোনো সময় তুলে নেওয়ার পূর্ণ স্বাধীনতা।
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔍</div>
            <h3 style={styles.featureTitle}>১০০% স্বচ্ছ ট্র্যাকিং</h3>
            <p style={styles.featureDesc}>
              আপনার বিনিয়োগ কোথায় এবং কীভাবে বৃদ্ধি পাচ্ছে তা রিয়েল-টাইম এনালিটিক্স ড্যাশবোর্ডে সহজেই পর্যবেক্ষণ করুন।
            </p>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div style={styles.splitSection}>
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🎯</span>
              <h2 style={styles.cardTitle}>আমাদের মিশন</h2>
            </div>
            <p style={styles.cardDesc}>
              প্রতিটি মানুষের মাঝে সুশৃঙ্খল সঞ্চয়ের অভ্যাস তৈরি করা এবং ডিজিটাল ফিনান্সিয়াল প্রোডাক্টের মাধ্যমে নির্ভরযোগ্য প্রফিট জেনারেট করার স্থায়ী পথ তৈরি করে দেওয়া।
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>👁️</span>
              <h2 style={styles.cardTitle}>আমাদের ভিশন</h2>
            </div>
            <p style={styles.cardDesc}>
              ভবিষ্যতের গ্লোবাল ফিনটেক ইন্ডাস্ট্রিতে সবচেয়ে বিশ্বাসযোগ্য ও নিরাপদ ইনভেস্টমেন্ট ইকোসিস্টেম হিসেবে নেতৃত্ব প্রদান করা।
            </p>
          </div>
        </div>

        {/* Risk Disclaimer & Notice */}
        <div style={styles.noticeBox}>
          <div style={styles.noticeHeader}>
            <span style={styles.noticeIcon}>⚠️</span>
            <h3 style={styles.noticeTitle}>গুরুত্বপূর্ণ ঝুঁকি ও সিকিউরিটি ডিক্লেয়ারেশন</h3>
          </div>
          <p style={styles.noticeText}>
            Save Money একটি প্রাইভেট ইনিশিয়েটিভ ফিনটেক প্ল্যাটফর্ম। সকল প্রকার ডিজিটাল বিনিয়োগ বাজারগত পরিবর্তনের ওপর নির্ভরশীল। যেকোনো স্কিমে অংশগ্রহণ করার পূর্বে অনুগ্রহ করে আমাদের শর্তাবলী (Terms & Conditions) এবং ঝুঁকি নীতি ভালো করে পড়ে সিদ্ধান্ত নিন।
          </p>
        </div>

        {/* Call To Action Card */}
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>আপনার আর্থিক স্বাধীনতা অর্জন করুন আজই</h2>
          <p style={styles.ctaDesc}>স্মার্ট ইনভেস্টরদের সাথে যুক্ত হয়ে আপনার সেভিংসকে রূপান্তরিত করুন উচ্চ-উৎপাদনশীল সম্পদে।</p>
          <button style={styles.ctaButton}>বিনিয়োগ শুরু করুন</button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0f172a 0%, #020617 100%)",
    padding: "40px 16px",
    color: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  wrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },

  heroSection: {
    textAlign: "center",
    padding: "36px 20px",
    background: "rgba(30, 41, 59, 0.4)",
    borderRadius: "28px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },

  badge: {
    display: "inline-block",
    padding: "6px 16px",
    background: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "16px",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },

  title: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "2px",
    margin: "0 0 8px 0",
  },

  slogan: {
    fontSize: "16px",
    color: "#38bdf8",
    fontWeight: "600",
    margin: "0 0 18px 0",
  },

  heroDesc: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.7",
    maxWidth: "700px",
    margin: "0 auto",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },

  statCard: {
    background: "rgba(15, 23, 42, 0.6)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#10b981",
    margin: "0 0 6px 0",
  },

  statLabel: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },

  sectionHeader: {
    textAlign: "center",
    marginTop: "16px",
  },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: "0 0 6px 0",
  },

  sectionSub: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },

  featureCard: {
    background: "rgba(30, 41, 59, 0.5)",
    padding: "24px",
    borderRadius: "22px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    transition: "transform 0.2s ease",
  },

  featureIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },

  featureTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f1f5f9",
    margin: "0 0 8px 0",
  },

  featureDesc: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: 0,
  },

  splitSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  infoCard: {
    background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))",
    padding: "28px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  cardIcon: {
    fontSize: "24px",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: 0,
  },

  cardDesc: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.7",
    margin: 0,
  },

  noticeBox: {
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: "20px",
    padding: "24px",
  },

  noticeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  noticeIcon: {
    fontSize: "20px",
  },

  noticeTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#fbbf24",
    margin: 0,
  },

  noticeText: {
    fontSize: "13px",
    color: "#e2e8f0",
    lineHeight: "1.6",
    margin: 0,
  },

  ctaCard: {
    textAlign: "center",
    background: "linear-gradient(135deg, #059669 0%, #0284c7 100%)",
    padding: "36px 20px",
    borderRadius: "28px",
    boxShadow: "0 15px 35px rgba(5, 150, 105, 0.25)",
  },

  ctaTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 10px 0",
  },

  ctaDesc: {
    fontSize: "14px",
    color: "#e0f2fe",
    margin: "0 0 20px 0",
  },

  ctaButton: {
    background: "#ffffff",
    color: "#0f172a",
    border: "none",
    padding: "14px 32px",
    fontSize: "15px",
    fontWeight: "800",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
  },
};
