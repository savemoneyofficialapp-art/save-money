import { useParams } from "react-router-dom";

export default function LegalPages() {

  const { type } = useParams();

  const pages = {

    privacy: {
      title: "Privacy Policy",
      content: `
We value your privacy and are committed to protecting your personal information. 
All user information including KYC documents, wallet details, and account records are securely stored. 
We do not sell or share your data with unauthorized third parties. 
Your data may only be used for verification, platform security, legal compliance, and service improvements.
      `
    },

    terms: {
      title: "Terms & Conditions",
      content: `
This platform operates as a private investment and systematic savings application. 
All investments are voluntary and users are responsible for understanding the associated risks. 
ROI percentages may increase or decrease depending on company performance and business conditions. 
The company reserves the right to update platform rules, bonuses, investment structures, and policies when necessary.
      `
    },

    refund: {
      title: "Refund Policy",
      content: `
All investments are considered final after successful processing. 
Early investment closure may result in deductions according to company policy. 
Refund requests may require verification and processing time. 
Bonus earnings and promotional rewards are non-refundable.
      `
    },

    risk: {
      title: "Risk Disclosure",
      content: `
Investment activities involve financial risks. 
Returns shown on the platform are estimated and not guaranteed. 
Market conditions, operational risks, and business performance may affect profits and returns. 
Users should invest responsibly and only after understanding these risks.
      `
    },

    aml: {
      title: "AML & KYC Policy",
      content: `
All users must complete KYC verification before using investment or withdrawal services. 
The platform follows anti-money laundering principles to prevent fraud, fake identities, and suspicious activities. 
Accounts involved in illegal activities may be suspended permanently.
      `
    },

    disclaimer: {
      title: "Disclaimer",
      content: `
This platform is currently a private financial technology initiative. 
The company aims to provide the best possible services but does not guarantee fixed profits under all conditions. 
Users are fully responsible for their investment decisions and platform usage.
      `
    }

  };

  const page = pages[type];

  if (!page) {
    return (
      <div style={styles.container}>
        <h2>Page Not Found</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          {page.title}
        </h1>

        <div style={styles.content}>
          {page.content}
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
    padding:"25px",
    borderRadius:"22px",
    maxWidth:"900px",
    margin:"auto",
    marginTop:"20px",
    border:"1px solid #334155"
  },

  title:{
    color:"#22c55e",
    textAlign:"center",
    marginBottom:"20px"
  },

  content:{
    lineHeight:"32px",
    color:"#e2e8f0",
    fontSize:"15px",
    whiteSpace:"pre-line"
  }

};