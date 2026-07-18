import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function SaveMoney() {
  // =========================================================================
  // ROUTING & NAVIGATION FRAMEWORK INTERFACES
  // =========================================================================
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================================
  // PERSISTENT MEMORY EXTRADITION SECURITY STORAGE KEYS
  // =========================================================================
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  // =========================================================================
  // REACTOR CORE STATE CONFIGURATOR INDICES
  // =========================================================================
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================================================================
  // VISUAL OVERLAY SHEATH NOTIFIER STATES
  // =========================================================================
  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  // =========================================================================
  // HOVER INTERACTIVE SELECTION MAP UNITS
  // =========================================================================
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeInputFocus, setActiveInputFocus] = useState(false);
  const [hoveredTenureNode, setHoveredTenureNode] = useState(null);

  // =========================================================================
  // TRANSACTION FEEDBACK HUD EMITTER MODULE
  // =========================================================================
  const showStatusMsg = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 3000);
  };

  // =========================================================================
  // SCROLL TIMING CORRECTION RUNNER
  // =========================================================================
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // =========================================================================
  // CORE WALLET BALANCE API SYNCHRONIZER
  // =========================================================================
  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setBalance(Number(data.balance || data.wallet || 0));
    } catch (err) {
      console.log("CRITICAL WALLET BALANCE SYNC ERROR:", err);
    }
  };

  // =========================================================================
  // MATRIX RETRIEVAL DICTIONARY FOR YIELD PERCENTAGE INTEREST
  // =========================================================================
  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    if (Number(y) === 5) return 20;
    if (Number(y) === 10) return 24;
    if (Number(y) === 15) return 27;
    return 30;
  };

  const rate = getRate(years);

  // =========================================================================
  // MATHEMATICAL ACCELERATED COMPOUNDING CALCULATOR VECTOR ENGINE
  // =========================================================================
  const calc = useMemo(() => {
    const monthly = Number(amount || 0);
    const annualRate = Number(rate || 0);
    const totalYears = Number(years || 1);
    const r = annualRate / 100 / 12;
    const n = totalYears * 12;

    let maturityAmount = 0;
    let totalInterest = 0;

    if (r > 0) {
      maturityAmount = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      totalInterest = maturityAmount - (monthly * n);
    } else {
      maturityAmount = monthly * n;
      totalInterest = 0;
    }

    return {
      monthly,
      totalInvestment: monthly * n,
      estimatedReturn: totalInterest,
      totalInterest,
      totalReturn: maturityAmount
    };
  }, [amount, years, rate]);

  // =========================================================================
  // HIGH DEFINITION LOCAL CURRENCY CONVERTER FORMATTER (INR)
  // =========================================================================
  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // =========================================================================
  // MODAL TRIGGER HANDLERS AND DISPATCH CONTROLLERS
  // =========================================================================
  const openTerms = () => {
    if (accepted) {
      setAccepted(false);
      return;
    }
    setTermsOpen(true);
  };

  const acceptTerms = () => {
    setAccepted(true);
    setTermsOpen(false);
    showStatusMsg("success", "Terms & Conditions Accepted!");
  };

  // =========================================================================
  // TRANSACTION TRANSMISSION ARCHITECTURE COMMIT (API HANDLER)
  // =========================================================================
  const confirmSip = async () => {
    if (Number(amount) < 2000) {
      showStatusMsg("error", "Minimum SIP amount ₹2000 required");
      return toast.info("Minimum SIP amount ₹2000 required");
    }

    if (!accepted) {
      setTermsOpen(true);
      return;
    }

    if (Number(balance) < Number(amount)) {
      showStatusMsg("error", "Insufficient wallet balance");
      return toast.error("Insufficient wallet balance");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/start-invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email,
          amount: Number(amount),
          monthlyReturn: Number(amount),
          years: Number(years),
          rate: Number(rate),
          totalPlanAmount: Number(calc.totalInvestment),
          totalInterest: Number(calc.totalInterest),
          maturityAmount: Number(calc.totalReturn)
        })
      });

      const data = await res.json();

      if (data.msg === "Token expired or invalid") {
        localStorage.clear();
        showStatusMsg("error", "Session expired. Logging out.");
        setTimeout(() => { window.location.href = "/login"; }, 2000);
        return;
      }

      if (data.success) {
        showStatusMsg("success", data.msg || "SIP Plan Started Successfully! 🌱");
        setAmount("");
        setAccepted(false);
        loadBalance();
      } else {
        showStatusMsg("info", data.msg || "Could not complete transaction");
      }
    } catch (err) {
      console.log("START SIP SYSTEM REJECTION DISPATCH ERROR:", err);
      showStatusMsg("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.cyberPageWrapper}>
      {/* VIRTUALIZED LAYER INFRASTRUCTURE CORES */}
      <div style={styles.neonMatrixGrid}></div>
      <div style={styles.dynamicAuraSphere1}></div>
      <div style={styles.dynamicAuraSphere2}></div>
      <div style={styles.dynamicAuraSphere3}></div>

      {/* TOP DEPLOYMENT LEDGER BAR MONITOR */}
      <div style={styles.vipStatusBar}>
        <div style={styles.vipStatusIndicator}>
          <span style={styles.pulseNode}></span> LIVE CONNECTION SECURE
        </div>
        <div style={styles.vipTimestamp}>HIGH SPEED AUTO-COMPOUND ENGINE ACTIVE</div>
      </div>

      {/* SECURE POPUP SHIELD RADAR INTERFACE */}
      {statusOverlay.show && (
        <div style={styles.glassOverlayShield}>
          <div style={{
            ...styles.glassOverlayContainer,
            borderBottom: statusOverlay.type === "success" ? "4px solid #00ffa3" : statusOverlay.type === "error" ? "4px solid #ff4a4a" : "4px solid #00d2ff"
          }}>
            <div style={{
              ...styles.glassOverlayIconFrame,
              backgroundColor: statusOverlay.type === "success" ? "rgba(0,255,163,0.1)" : statusOverlay.type === "error" ? "rgba(255,74,74,0.1)" : "rgba(0,210,255,0.1)",
              color: statusOverlay.type === "success" ? "#00ffa3" : statusOverlay.type === "error" ? "#ff4a4a" : "#00d2ff"
            }}>
              {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "⚡"}
            </div>
            <p style={styles.glassOverlayMessageText}>{statusOverlay.message}</p>
          </div>
        </div>
      )}

      {/* EXPANDED SYSTEM VIEW SCREEN ELEMENT CANVAS */}
      <div style={styles.ultimateMainCanvas}>
        
        {/* HELM HEAD ROW ACTION PACK CONTROLLERS */}
        <div style={styles.controlHelmRow}>
          <button 
            style={{...styles.helmActionBtn, ...(hoveredCard === 'back' ? styles.helmActionBtnHover : {})}}
            onMouseEnter={() => setHoveredCard('back')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => window.history.back()}
          >
            <span style={styles.helmBtnIcon}>◀</span> RETURN DASHBOARD
          </button>
          
          <div style={styles.helmCenterBadge}>
            <span style={styles.goldTextBadge}>QUANTUM VIP NETWORK ACCESS</span>
          </div>

          <button 
            style={{...styles.helmHelpBtn, ...(hoveredCard === 'help' ? styles.helmHelpBtnHover : {})}}
            onMouseEnter={() => setHoveredCard('help')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setHelpOpen(true)}
          >
            ASSISTANT CORE <span style={styles.helpQuestionMark}>?</span>
          </button>
        </div>

        {/* MAXIMUM HIGH CONTRAST EXHILARATING HERO TITLE BRAND */}
        <header style={styles.cyberBrandHeaderSection}>
          <div style={styles.cyberLogoHexagonWrap}>
            <div style={styles.cyberLogoCoreElement}>
              <span style={styles.cyberLogoSymbolText}>₹</span>
            </div>
            <div style={styles.cyberLogoOrbitLine1}></div>
            <div style={styles.cyberLogoOrbitLine2}></div>
          </div>
          <h1 style={styles.cyberMainTitleText}>
            SAVE <span style={styles.cyberMainTitleHighlight}>MONEY</span>
          </h1>
          <div style={styles.cyberBrandDividerLine}>
            <div style={styles.cyberDividerCoreGlow}></div>
          </div>
          <p style={styles.cyberBrandSubtextPara}>INTELLIGENT WEALTH GENERATION SYSTEM</p>
        </header>

        {/* SIDE-BY-SIDE EQUAL PARALLEL TOP CORE TRACK HOUSING MODULES */}
        <div style={styles.executiveTwinControlLayout}>
          
          {/* ZONE BLOCK 1: WALLET ASSET CONSOLE */}
          <div style={styles.executivePanelZone}>
            <section 
              style={{...styles.cyberLuxuryCardUnit, ...(hoveredCard === 'wallet' ? styles.cyberLuxuryCardUnitHover : {})}}
              onMouseEnter={() => setHoveredCard('wallet')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardGlowCornerTop}></div>
              <div style={styles.cardHeaderFlexBox}>
                <div style={styles.cardTitleBadgeRow}>
                  <div style={styles.cardHeaderIconBoxContainer}>💳</div>
                  <h3 style={styles.cardHeaderMainTitleText}>SECURE WALLET MANAGEMENT</h3>
                </div>
                <span style={styles.onlinePulseStatusText}>ONLINE POOL</span>
              </div>

              <div style={styles.walletBalanceDisplayBlock}>
                <div style={styles.walletMetaLabelRow}>
                  <span style={styles.walletMetaLabel}>LIQUID CAPITAL AVAILABILITY</span>
                  <span style={styles.walletSecureShieldTag}>🔒 256-BIT CRYPTO VAULT</span>
                </div>
                <div style={styles.walletLargeNumericalSum}>
                  {money(balance)}
                </div>
                <div style={styles.walletProgressIndicatorTrack}>
                  <div style={styles.walletProgressIndicatorFillBar}></div>
                </div>
                <div style={styles.walletBottomCapLabelFlex}>
                  <span style={styles.walletCapSubtextText}>Status: Fully Eligible for Immediate Auto-Investment</span>
                  <span style={styles.walletCapPercentageText}>100% Verified</span>
                </div>
              </div>

              <button 
                style={styles.walletActionInjectFundsBtn}
                onClick={() => (window.location.href = "/wallet")}
              >
                <span style={styles.btnAccentPlusSymbol}>+</span> DEPOSIT FRESH CAPITAL INTO POOL
              </button>
            </section>
          </div>

          {/* ZONE BLOCK 2: SIP CONGREGATION INPUT METRICS CONFIGS */}
          <div style={styles.executivePanelZone}>
            <section 
              style={{...styles.cyberLuxuryCardUnit, ...(hoveredCard === 'config' ? styles.cyberLuxuryCardUnitHover : {})}}
              onMouseEnter={() => setHoveredCard('config')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardGlowCornerTopAccent}></div>
              <div style={styles.cardHeaderFlexBox}>
                <div style={styles.cardTitleBadgeRow}>
                  <div style={styles.cardHeaderIconBoxContainerAccent}>🌱</div>
                  <h3 style={styles.cardHeaderMainTitleText}>ASSET DEPLOYMENT CALIBRATION</h3>
                </div>
                <span style={styles.onlinePulseStatusTextAccent}>CONFIG READY</span>
              </div>

              {/* MONETARY MAGNITUDE CONTROLLER ENTRY */}
              <div style={styles.inputFieldComplexContainer}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>CHOOSE MONTHLY COMMITMENT AMOUNT</span>
                  <span style={styles.inputFieldRightHandBadge}>MINIMUM BOUNDARY REQUIRED</span>
                </div>
                <div style={{
                  ...styles.cyberInputWrapperGlassBox,
                  borderColor: activeInputFocus ? "#00ffa3" : "#334155",
                  boxShadow: activeInputFocus ? "0 0 20px rgba(0,255,163,0.15)" : "none"
                }}>
                  <div style={styles.cyberInputPrependCurrencySymbol}>₹</div>
                  <input
                    style={styles.cyberInputActualInputElement}
                    type="number"
                    value={amount}
                    onFocus={() => setActiveInputFocus(true)}
                    onBlur={() => setActiveInputFocus(false)}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter Custom Investment Capital"
                  />
                  <div style={styles.cyberInputAppendBadgeUnit}>
                    <span style={styles.cyberInputAppendBadgeText}>INR VALUES</span>
                  </div>
                </div>

                {Number(amount || 0) > 0 && Number(amount) < 2000 && (
                  <div style={styles.cyberValidationWarningAlertBox}>
                    <span style={styles.validationWarningIcon}>⚠️</span> 
                    <span style={styles.validationWarningText}>System Threshold Warning: Minimum required configuration is ₹2000</span>
                  </div>
                )}
              </div>

              {/* FIX DEPLOYED: TENURE SELECTION LAYOUT WITH EXTRA MAXIMUM READABILITY CONTRAST SHIELDS */}
              <div style={styles.tenureSelectionStructureBox}>
                <div style={styles.inputFieldLabelFlexHeader}>
                  <span style={styles.inputFieldMainTitleLabel}>SELECT ASSET ACCUMULATION TIMEFRAME</span>
                  <span style={styles.inputFieldRightHandBadgeAccent}>ROI SCALING SYSTEM ACTIVE</span>
                </div>

                <div style={styles.tenureGridSelectorLayoutMatrix}>
                  {[1, 3, 5, 10, 15, 20].map((y) => {
                    const isSelected = years === y;
                    const isNodeHovered = hoveredTenureNode === y;
                    
                    return (
                      <button
                        key={y}
                        style={{
                          ...styles.tenureSelectorNodeItemButton,
                          backgroundColor: isSelected 
                            ? "#00ffa3" 
                            : isNodeHovered 
                              ? "rgba(255, 255, 255, 0.15)" 
                              : "#1e293b",
                          borderColor: isSelected 
                            ? "#ffffff" 
                            : isNodeHovered 
                              ? "#00ffa3" 
                              : "#475569",
                          boxShadow: isSelected 
                            ? "0 0 20px rgba(0, 255, 163, 0.4)" 
                            : "none"
                        }}
                        onMouseEnter={() => setHoveredTenureNode(y)}
                        onMouseLeave={() => setHoveredTenureNode(null)}
                        onClick={() => setYears(y)}
                      >
                        <div style={{
                          ...styles.tenureNodeYearLabelText,
                          color: isSelected ? "#020617" : "#ffffff"
                        }}>
                          {y} {y === 1 ? "YEAR PLAN" : "YEARS PLAN"}
                        </div>
                        <div style={{
                          ...styles.tenureNodePercentageSubBadge,
                          color: isSelected ? "#090d16" : "#00ffa3"
                        }}>
                          Yield Rate: {getRate(y)}%
                        </div>
                        {isSelected && <div style={styles.tenureNodeSelectionCheckIndicatorCircle}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SYSTEM INFORMATIONAL BAR COMPLIANCE ADVICE */}
              <div style={styles.adviceSystemBarWrapperBox}>
                <div style={styles.adviceSystemLightBulbIcon}>💡</div>
                <div style={styles.adviceSystemTextBodyBlock}>
                  <strong>Compounding Multiplier Alert:</strong> Selection of a tenure exceeding 5 Years triggers exponential growth modules, maximizing capital retention and interest yield loops.
                </div>
              </div>

            </section>
          </div>

        </div>

        {/* BOTTOM SECTION SEPARATOR: PROJECTIONS HEADER ROW STRIP */}
        <div style={styles.compoundingHeaderSeparatorBlock}>
          <div style={styles.separatorLineDecorativeLeft}></div>
          <span style={styles.separatorCentralHeadlineTitleText}>LIVE ASSET PROJECTION DATA SHEETS</span>
          <div style={styles.separatorLineDecorativeRight}></div>
        </div>

        {/* PARALLEL GRAPH ROW TRACK 1 (BOTTOM PLACEMENT AS REQUESTED) */}
        <div style={styles.compoundingDataDisplayRowLineOneGrid}>
          
          {/* CALC CELL MODULE 1: ESTIMATED RETURNS */}
          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #00ffa3"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#00ffa3", backgroundColor: "rgba(0,255,163,0.1)"}}>📈</div>
              <span style={styles.projectionCellMetaTitleLabelText}>ESTIMATED COMPOUNDING RETURNS</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#00ffa3"}}>
              {money(calc.estimatedReturn)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#00ffa3", width: "85%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Estimated return accrual across selected timeline framework matrix.</p>
          </div>

          {/* CALC CELL MODULE 2: TOTAL DEPLOYED PRINCIPAL */}
          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #00d2ff"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#00d2ff", backgroundColor: "rgba(0,210,255,0.1)"}}>👛</div>
              <span style={styles.projectionCellMetaTitleLabelText}>TOTAL DEPLOYED PRINCIPAL CAPITAL</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#00d2ff"}}>
              {money(calc.totalInvestment)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#00d2ff", width: "60%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Total cumulative sum of sequential net monthly deposits performed.</p>
          </div>

        </div>

        {/* PARALLEL GRAPH ROW TRACK 2 (BOTTOM PLACEMENT AS REQUESTED) */}
        <div style={styles.compoundingDataDisplayRowLineTwoGrid}>
          
          {/* CALC CELL MODULE 3: NET COMPREHENSIVE INTEREST YIELD */}
          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #ffb800"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#ffb800", backgroundColor: "rgba(255,184,0,0.1)"}}>🪙</div>
              <span style={styles.projectionCellMetaTitleLabelText}>NET COMPREHENSIVE INTEREST EARNED</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#ffb800"}}>
              {money(calc.totalInterest)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#ffb800", width: "70%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Pure asset yield generation extracted via algorithmic standard interest modules.</p>
          </div>

          {/* CALC CELL MODULE 4: EXPECTED MATURITY LIQUIDITY TOTAL */}
          <div style={{...styles.projectionDataMetricsCardCellBlock, borderLeft: "5px solid #cc00ff"}}>
            <div style={styles.projectionCellTopMetaLine}>
              <div style={{...styles.projectionCellIconCircleBox, color: "#cc00ff", backgroundColor: "rgba(204,0,255,0.1)"}}>📊</div>
              <span style={styles.projectionCellMetaTitleLabelText}>ESTIMATED MATURITY ASSET VALUE</span>
            </div>
            <div style={{...styles.projectionCellBigMetricValueText, color: "#cc00ff"}}>
              {money(calc.totalReturn)}
            </div>
            <div style={styles.projectionCellBottomStatusBarTrack}>
              <div style={{...styles.projectionCellStatusFillColorBar, backgroundColor: "#cc00ff", width: "95%"}}></div>
            </div>
            <p style={styles.projectionCellFooterNarrativeText}>Total forecasted terminal capital extraction sum upon maturity event fulfillment.</p>
          </div>

        </div>

        {/* HIGH RECONCILED CLEAR TEXT DISCLAIMER PANEL STRIP */}
        <div style={styles.systemAnalyticalDisclaimerBox}>
          <span style={styles.disclaimerIconInfoBadge}>i</span>
          <span style={styles.disclaimerTextMessagePara}>
            Mathematical forecasting projection model operates under high-fidelity compounding interest matrix calculations. Historical performance criteria configurations represent standard index projections.
          </span>
        </div>

        {/* STATUTORY LEGAL DECLARATION MUTUAL ACKNOWLEDGEMENT ROW CONTAINER */}
        <div style={styles.legalComplianceActionShieldContainerBox}>
          <div 
            style={{...styles.legalInteractiveClickableRowBox, ...(accepted ? styles.legalInteractiveClickableRowBoxActive : {})}}
            onClick={openTerms}
          >
            <div style={{
              ...styles.legalCustomCheckboxSquareBox,
              backgroundColor: accepted ? "#00ffa3" : "#1e293b",
              borderColor: accepted ? "#00ffa3" : "#94a3b8"
            }}>
              {accepted && <span style={styles.legalCheckboxCheckMarkCheck}>✓</span>}
            </div>
            <div style={styles.legalTextStatementColumnLabelBlock}>
              <p style={styles.legalMainDeclarationSentenceText}>
                I hereby declare, authorize and confirm that I have meticulously read, verified and mutually consented to be legally bound by the comprehensive system-wide <b style={styles.legalHighLightHyperlinkText}>Terms, Conditions, Asset Allocation Disclosures & Risk Protocols</b>.
              </p>
            </div>
            <div style={{...styles.legalPaperDocumentIconBadgeUnit, color: accepted ? "#00ffa3" : "#cbd5e1"}}>📄</div>
          </div>
        </div>

        {/* MAXIMUM APEX COMMAND INITIALIZATION LAUNCH SWITCH ACTION BUTTON */}
        <div style={styles.ultimateLaunchButtonCentralContainerFlex}>
          <button 
            style={{
              ...styles.ultimateLaunchCoreActionBtnElement,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }} 
            onClick={confirmSip} 
            disabled={loading}
          >
            <div style={styles.ultimateLaunchBtnGlowBackingTrack}></div>
            <span style={styles.ultimateLaunchBtnIconBadgeNode}>🛡️</span> 
            <span style={styles.ultimateLaunchBtnMainStringLabelText}>
              {loading ? "AUTHORIZING DIGITAL SECURE DEPOSIT..." : "INITIATE & LAUNCH ASSET CONFIGURATION PLAN"}
            </span>
          </button>
        </div>

        {/* METABOLIC TRIPLE DECK SUPPORT NETWORKING MATRIX LISTS */}
        <section style={styles.systemCapabilitiesTripleFooterGridColumnLayout}>
          <div style={styles.capabilityCellBlockNodeCard}>
            <div style={{...styles.capabilityIconCircleWrapContainer, color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.15)"}}>🔒</div>
            <div style={styles.capabilityTextInformationBlockWrap}>
              <h4 style={styles.capabilityHeadingMainTextTitle}>VAULT-GRADE CYBER SECURITY</h4>
              <p style={styles.capabilitySubtextBodyParagraph}>End-to-End encrypted cryptographic ledger vault safeguards absolute transactional safety limits.</p>
            </div>
          </div>

          <div style={styles.capabilityCellBlockNodeCard}>
            <div style={{...styles.capabilityIconCircleWrapContainer, color: "#10b981", backgroundColor: "rgba(16,185,129,0.15)"}}>📈</div>
            <div style={styles.capabilityTextInformationBlockWrap}>
              <h4 style={styles.capabilityHeadingMainTextTitle}>MAXIMIZED TIMELINE YIELD CURVE</h4>
              <p style={styles.capabilitySubtextBodyParagraph}>Algorithmic compounding interest indexing structures optimized to generate enhanced fiscal performance assets.</p>
            </div>
          </div>

          <div style={styles.capabilityCellBlockNodeCard}>
            <div style={{...styles.capabilityIconCircleWrapContainer, color: "#a855f7", backgroundColor: "rgba(168,85,247,0.15)"}}>⚡</div>
            <div style={styles.capabilityTextInformationBlockWrap}>
              <h4 style={styles.capabilityHeadingMainTextTitle}>FLUID AUTO-PAYOUT INTERFACING</h4>
              <p style={styles.capabilitySubtextBodyParagraph}>Seamless architectural design allows automated liquidity conversion options upon reaching target timelines.</p>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* COMPLETELY UNTOUCHED CORE TRANSACTIONAL OVERLAY MODAL HUD SHIELDS */}
      {/* ========================================================================= */}
      
      {/* MODAL 1: PRESERVED COMPREHENSIVE TERMS AND CONDITIONS LEDGER SYSTEM */}
      {termsOpen && (
        <div style={styles.modalSystemFallbackOverlayBlurScreen}>
          <div style={styles.modalSystemOuterBoxArchitecture}>
            <div style={styles.modalSystemHeaderTitleFlexRow}>
              <div style={styles.modalSystemHeaderIconBadge}>📋</div>
              <h2 style={styles.modalSystemHeaderMainTitleHeadlineText}>Terms & Conditions</h2>
            </div>
            
            <div style={styles.modalSystemInternalScrollableContentPanelBox}>
              <p style={styles.modalSystemParagraphParaBlockText}>Save Money SIP is a disciplined monthly saving and investment plan. The minimum monthly SIP investment amount is ₹2000.</p>
              <p style={styles.modalSystemParagraphParaBlockText}>User must select SIP duration and understand all estimated return values before confirming the investment from wallet balance.</p>
              <p style={styles.modalSystemParagraphParaBlockText}>This SIP plan requires timely monthly renewal. If renewal is missed, investment benefits, bonuses, rewards or auto-withdrawal eligibility may be affected.</p>
              <p style={styles.modalSystemParagraphParaBlockText}>Returns shown inside the application are estimated values only. Actual return may increase or decrease depending on company performance.</p>
              <p style={styles.modalSystemParagraphParaBlockText}>Investment always involves financial risk. User confirms that they are investing voluntarily after understanding risk, reward and possible variation in ROI.</p>
            </div>

            <button style={styles.modalSystemAcceptActionButtonTriggerElement} onClick={acceptTerms}>
              Accept & Commit Verification
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSISTANT HELPDESK ENGINE MODULE DISPLAY */}
      {helpOpen && (
        <div style={styles.modalSystemFallbackOverlayBlurScreen}>
          <div style={{...styles.modalSystemOuterBoxArchitecture, borderColor: "#3b82f6"}}>
            <div style={styles.modalSystemHeaderTitleFlexRow}>
              <div style={{...styles.modalSystemHeaderIconBadge, color: "#3b82f6"}}>🧠</div>
              <h2 style={{...styles.modalSystemHeaderMainTitleHeadlineText, color: "#3b82f6"}}>Investment Assistant</h2>
            </div>
            
            <div style={styles.modalSystemInternalScrollableContentPanelBox}>
              <p style={styles.modalSystemParagraphParaBlockTextHelpTextBangla}>The Save Money SIP plan will help you save regularly every month.</p>
              <p style={styles.modalSystemParagraphParaBlockTextHelpTextBangla}>The minimum monthly SIP amount is ₹2,000. Once you enter the amount and select the duration, you will see the estimated return below.</p>
              <p style={styles.modalSystemParagraphParaBlockTextHelpTextBangla}>Estimated returns of 11% for 1 year, 14% for 3 years, and 20% to 30% for 5+ years will be displayed.</p>
            </div>

            <button 
              style={{...styles.modalSystemAcceptActionButtonTriggerElement, background: "linear-gradient(90deg, #3b82f6, #1d4ed8)"}} 
              onClick={() => setHelpOpen(false)}
            >
              Acknowledge & Close Core
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================================
// EXPANDED MATRIX PRESETS STYLE ENGINE (ULTRA CONTRAST MOBILE EDITION)
// =========================================================================
const styles = {
  cyberPageWrapper: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#02040a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#ffffff",
    overflowX: "hidden",
    position: "relative",
    boxSizing: "border-box"
  },
  neonMatrixGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.3))",
    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.3))",
    pointerEvents: "none",
    zIndex: 1
  },
  dynamicAuraSphere1: {
    position: "absolute",
    top: "-200px",
    left: "5%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(0, 255, 163, 0.08) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(60px)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 2
  },
  dynamicAuraSphere2: {
    position: "absolute",
    bottom: "10%",
    right: "-100px",
    width: "700px",
    height: "700px",
    background: "radial-gradient(circle, rgba(204, 0, 255, 0.06) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(80px)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 2
  },
  dynamicAuraSphere3: {
    position: "absolute",
    top: "40%",
    left: "40%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(0, 210, 255, 0.05) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(50px)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 2
  },
  vipStatusBar: {
    width: "100%",
    height: "36px",
    backgroundColor: "#090d16",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    boxSizing: "border-box",
    zIndex: 10,
    position: "relative"
  },
  vipStatusIndicator: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#00ffa3",
    letterSpacing: "1.5px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  pulseNode: {
    width: "7px",
    height: "7px",
    backgroundColor: "#00ffa3",
    borderRadius: "50%",
    display: "inline-block",
    boxShadow: "0 0 10px #00ffa3"
  },
  vipTimestamp: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600",
    letterSpacing: "1px"
  },
  glassOverlayShield: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2, 4, 10, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 50000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  glassOverlayContainer: {
    backgroundColor: "#0d1321",
    padding: "40px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
    border: "1px solid #334155",
    maxWidth: "460px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px"
  },
  glassOverlayIconFrame: {
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "bold",
    boxShadow: "inset 0 2px 5px rgba(255,255,255,0.05)"
  },
  glassOverlayMessageText: {
    fontSize: "18px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "700",
    lineHeight: "1.5",
    letterSpacing: "0.3px"
  },
  ultimateMainCanvas: {
    width: "100%",
    maxWidth: "100%",
    padding: "40px",
    boxSizing: "border-box",
    zIndex: 5,
    position: "relative",
    display: "flex",
    flexDirection: "column"
  },
  controlHelmRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    width: "100%"
  },
  helmActionBtn: {
    padding: "14px 28px",
    borderRadius: "16px",
    border: "1px solid #334155",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  helmActionBtnHover: {
    borderColor: "#00ffa3",
    color: "#ffffff",
    backgroundColor: "rgba(0, 255, 163, 0.15)",
    boxShadow: "0 0 25px rgba(0, 255, 163, 0.2)"
  },
  helmBtnIcon: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  helmCenterBadge: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    border: "1px solid rgba(255, 215, 0, 0.3)",
    padding: "8px 20px",
    borderRadius: "30px",
    backdropFilter: "blur(5px)"
  },
  goldTextBadge: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#ffd700",
    letterSpacing: "2.5px"
  },
  helmHelpBtn: {
    padding: "14px 28px",
    borderRadius: "16px",
    border: "1px solid #334155",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    color: "#60a5fa",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  helmHelpBtnHover: {
    borderColor: "#60a5fa",
    color: "#ffffff",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    boxShadow: "0 0 25px rgba(59, 130, 246, 0.2)"
  },
  helpQuestionMark: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#ffffff"
  },
  cyberBrandHeaderSection: {
    textAlign: "center",
    marginBottom: "50px",
    width: "100%"
  },
  cyberLogoHexagonWrap: {
    width: "90px",
    height: "90px",
    margin: "0 auto 20px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cyberLogoCoreElement: {
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #00ffa3 0%, #00d2ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "900",
    color: "#020617",
    boxShadow: "0 15px 35px rgba(0,255,163,0.4)",
    zIndex: 5
  },
  cyberLogoOrbitLine1: {
    position: "absolute",
    inset: "-5px",
    borderRadius: "28px",
    border: "2px dashed rgba(0, 255, 163, 0.4)",
    animation: "spin 20s linear infinite"
  },
  cyberLogoOrbitLine2: {
    position: "absolute",
    inset: "5px",
    borderRadius: "22px",
    border: "1px solid rgba(0, 210, 255, 0.3)"
  },
  cyberMainTitleText: {
    margin: 0,
    fontSize: "46px",
    fontWeight: "900",
    letterSpacing: "4px",
    color: "#ffffff"
  },
  cyberMainTitleHighlight: {
    background: "linear-gradient(90deg, #00ffa3, #00d2ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  cyberBrandDividerLine: {
    width: "160px",
    height: "2px",
    backgroundColor: "rgba(255,255,255,0.1)",
    margin: "18px auto",
    position: "relative"
  },
  cyberDividerCoreGlow: {
    position: "absolute",
    inset: "0 25%",
    background: "linear-gradient(90deg, transparent, #00ffa3, transparent)"
  },
  cyberBrandSubtextPara: {
    fontSize: "13px",
    letterSpacing: "4px",
    color: "#cbd5e1",
    fontWeight: "700",
    textTransform: "uppercase",
    margin: 0
  },
  executiveTwinControlLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    width: "100%",
    marginBottom: "40px"
  },
  executivePanelZone: {
    width: "100%",
    display: "flex"
  },
  cyberLuxuryCardUnit: {
    width: "100%",
    backgroundColor: "rgba(13, 20, 35, 0.65)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: "28px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "35px",
    boxSizing: "border-box",
    position: "relative",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  cyberLuxuryCardUnitHover: {
    transform: "translateY(-4px)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.7)"
  },
  cardGlowCornerTop: {
    position: "absolute",
    top: 0,
    left: "10%",
    width: "80px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #00d2ff, transparent)"
  },
  cardGlowCornerTopAccent: {
    position: "absolute",
    top: 0,
    left: "10%",
    width: "80px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #00ffa3, transparent)"
  },
  cardHeaderFlexBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "30px"
  },
  cardTitleBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  cardHeaderIconBoxContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    border: "1px solid rgba(0, 210, 255, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  cardHeaderIconBoxContainerAccent: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: "rgba(0, 255, 163, 0.15)",
    border: "1px solid rgba(0, 255, 163, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  cardHeaderMainTitleText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "1.2px"
  },
  onlinePulseStatusText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#00d2ff",
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    padding: "6px 14px",
    borderRadius: "10px",
    letterSpacing: "1px"
  },
  onlinePulseStatusTextAccent: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#00ffa3",
    backgroundColor: "rgba(0, 255, 163, 0.15)",
    padding: "6px 14px",
    borderRadius: "10px",
    letterSpacing: "1px"
  },
  walletBalanceDisplayBlock: {
    backgroundColor: "rgba(2, 6, 12, 0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "26px",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "24px"
  },
  walletMetaLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "12px"
  },
  walletMetaLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#cbd5e1",
    letterSpacing: "1px"
  },
  walletSecureShieldTag: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#94a3b8"
  },
  walletLargeNumericalSum: {
    fontSize: "42px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-0.5px",
    marginBottom: "18px"
  },
  walletProgressIndicatorTrack: {
    width: "100%",
    height: "6px",
    backgroundColor: "#334155",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "12px"
  },
  walletProgressIndicatorFillBar: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, #00d2ff, #00ffa3)"
  },
  walletBottomCapLabelFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  },
  walletCapSubtextText: {
    fontSize: "11px",
    color: "#cbd5e1"
  },
  walletCapPercentageText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#00ffa3"
  },
  walletActionInjectFundsBtn: {
    width: "100%",
    height: "54px",
    borderRadius: "16px",
    background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "all 0.2s ease"
  },
  btnAccentPlusSymbol: {
    color: "#00d2ff",
    fontSize: "18px"
  },
  inputFieldComplexContainer: {
    width: "100%",
    marginBottom: "24px"
  },
  inputFieldLabelFlexHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "10px"
  },
  inputFieldMainTitleLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#cbd5e1",
    letterSpacing: "1px"
  },
  inputFieldRightHandBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#ff9c00",
    backgroundColor: "rgba(255,156,0,0.15)",
    padding: "4px 10px",
    borderRadius: "6px"
  },
  inputFieldRightHandBadgeAccent: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#00ffa3",
    backgroundColor: "rgba(0,255,163,0.15)",
    padding: "4px 10px",
    borderRadius: "6px"
  },
  cyberInputWrapperGlassBox: {
    height: "60px",
    width: "100%",
    borderRadius: "18px",
    border: "1px solid #475569",
    backgroundColor: "rgba(2, 6, 12, 0.7)",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
    gap: "14px",
    transition: "all 0.2s ease"
  },
  cyberInputPrependCurrencySymbol: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#00ffa3"
  },
  cyberInputActualInputElement: {
    flex: 1,
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff"
  },
  cyberInputAppendBadgeUnit: {
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "6px 12px",
    borderRadius: "10px"
  },
  cyberInputAppendBadgeText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#cbd5e1",
    letterSpacing: "0.5px"
  },
  cyberValidationWarningAlertBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "10px 14px",
    borderRadius: "12px"
  },
  validationWarningIcon: {
    fontSize: "14px"
  },
  validationWarningText: {
    fontSize: "12px",
    color: "#f87171",
    fontWeight: "600"
  },
  tenureSelectionStructureBox: {
    width: "100%",
    marginBottom: "24px"
  },
  // HIGH DEFINITION RE-CALIBRATION MATRIX GRID FOR MAXIMUM TEXT CLARITY
  tenureGridSelectorLayoutMatrix: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    width: "100%"
  },
  tenureSelectorNodeItemButton: {
    height: "68px",
    borderRadius: "16px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    gap: "4px",
    padding: "4px 8px",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  tenureNodeYearLabelText: {
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.5px"
  },
  tenureNodePercentageSubBadge: {
    fontSize: "11px",
    fontWeight: "700"
  },
  tenureNodeSelectionCheckIndicatorCircle: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    color: "#020617",
    fontSize: "11px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
  },
  adviceSystemBarWrapperBox: {
    backgroundColor: "rgba(0, 210, 255, 0.05)",
    border: "1px dashed rgba(0, 210, 255, 0.3)",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    width: "100%",
    boxSizing: "border-box"
  },
  adviceSystemLightBulbIcon: {
    fontSize: "18px",
    color: "#00d2ff"
  },
  adviceSystemTextBodyBlock: {
    fontSize: "12px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    margin: 0
  },
  compoundingHeaderSeparatorBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    margin: "30px 0 24px"
  },
  separatorLineDecorativeLeft: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15))"
  },
  separatorLineDecorativeRight: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, rgba(255,255,255,0.15), transparent)"
  },
  separatorCentralHeadlineTitleText: {
    padding: "0 24px",
    fontSize: "13px",
    fontWeight: "800",
    color: "#cbd5e1",
    letterSpacing: "3px",
    textTransform: "uppercase"
  },
  compoundingDataDisplayRowLineOneGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    width: "100%",
    marginBottom: "24px"
  },
  compoundingDataDisplayRowLineTwoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    width: "100%",
    marginBottom: "35px"
  },
  projectionDataMetricsCardCellBlock: {
    backgroundColor: "rgba(10, 16, 30, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "26px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "12px"
  },
  projectionCellTopMetaLine: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  projectionCellIconCircleBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },
  projectionCellMetaTitleLabelText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "1px"
  },
  projectionCellBigMetricValueText: {
    fontSize: "32px",
    fontWeight: "900",
    margin: "4px 0",
    letterSpacing: "-0.5px"
  },
  projectionCellBottomStatusBarTrack: {
    width: "100%",
    height: "5px",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "6px",
    overflow: "hidden"
  },
  projectionCellStatusFillColorBar: {
    height: "100%",
    borderRadius: "6px"
  },
  projectionCellFooterNarrativeText: {
    margin: 0,
    fontSize: "12px",
    color: "#cbd5e1",
    lineHeight: "1.4"
  },
  systemAnalyticalDisclaimerBox: {
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px 24px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "35px"
  },
  disclaimerIconInfoBadge: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "1px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#ffffff",
    fontWeight: "700",
    flexShrink: 0
  },
  disclaimerTextMessagePara: {
    fontSize: "12px",
    color: "#ffffff",
    lineHeight: "1.6",
    margin: 0
  },
  legalComplianceActionShieldContainerBox: {
    width: "100%",
    marginBottom: "35px"
  },
  legalInteractiveClickableRowBox: {
    backgroundColor: "rgba(13, 20, 35, 0.6)",
    border: "1px solid #475569",
    borderRadius: "20px",
    padding: "22px 28px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  legalInteractiveClickableRowBoxActive: {
    borderColor: "rgba(0, 255, 163, 0.5)",
    backgroundColor: "rgba(0, 255, 163, 0.04)"
  },
  legalCustomCheckboxSquareBox: {
    width: "22px",
    height: "22px",
    borderRadius: "7px",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s ease"
  },
  legalCheckboxCheckMarkCheck: {
    color: "#020617",
    fontSize: "13px",
    fontWeight: "900"
  },
  legalTextStatementColumnLabelBlock: {
    flex: 1
  },
  legalMainDeclarationSentenceText: {
    margin: 0,
    fontSize: "13px",
    color: "#ffffff",
    lineHeight: "1.6"
  },
  legalHighLightHyperlinkText: {
    color: "#00ffa3",
    fontWeight: "700"
  },
  legalPaperDocumentIconBadgeUnit: {
    fontSize: "22px",
    flexShrink: 0
  },
  ultimateLaunchButtonCentralContainerFlex: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginBottom: "60px"
  },
  ultimateLaunchCoreActionBtnElement: {
    width: "100%",
    height: "68px",
    borderRadius: "22px",
    border: "none",
    background: "linear-gradient(90deg, #00ffa3 0%, #00d2ff 50%, #3b82f6 100%)",
    color: "#020617",
    fontSize: "17px",
    fontWeight: "900",
    letterSpacing: "1px",
    position: "relative",
    boxShadow: "0 20px 45px rgba(0,255,163,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  ultimateLaunchBtnGlowBackingTrack: {
    position: "absolute",
    inset: 0,
    borderRadius: "22px",
    background: "linear-gradient(90deg, #00ffa3 0%, #00d2ff 50%, #3b82f6 100%)",
    filter: "blur(10px)",
    opacity: 0.6,
    zIndex: -1
  },
  ultimateLaunchBtnIconBadgeNode: {
    fontSize: "20px"
  },
  ultimateLaunchBtnMainStringLabelText: {
    textShadow: "0 1px 1px rgba(255,255,255,0.3)"
  },
  systemCapabilitiesTripleFooterGridColumnLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    width: "100%"
  },
  capabilityCellBlockNodeCard: {
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "20px",
    padding: "24px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "flex-start",
    gap: "18px"
  },
  capabilityIconCircleWrapContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0
  },
  capabilityTextInformationBlockWrap: {
    flex: 1
  },
  capabilityHeadingMainTextTitle: {
    margin: "0 0 6px",
    fontSize: "13px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "0.5px"
  },
  capabilitySubtextBodyParagraph: {
    margin: 0,
    fontSize: "12px",
    color: "#cbd5e1",
    lineHeight: "1.5"
  },
  modalSystemFallbackOverlayBlurScreen: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2,4,10,0.92)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px"
  },
  modalSystemOuterBoxArchitecture: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#0b111e",
    border: "1px solid rgba(0, 255, 163, 0.3)",
    borderRadius: "32px",
    padding: "35px",
    boxSizing: "border-box",
    boxShadow: "0 30px 80px rgba(0,0,0,0.8)"
  },
  modalSystemHeaderTitleFlexRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px"
  },
  modalSystemHeaderIconBadge: {
    fontSize: "26px",
    color: "#00ffa3"
  },
  modalSystemHeaderMainTitleHeadlineText: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff"
  },
  modalSystemInternalScrollableContentPanelBox: {
    maxHeight: "260px",
    overflowY: "auto",
    paddingRight: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  modalSystemParagraphParaBlockText: {
    margin: 0,
    fontSize: "13px",
    color: "#cbd5e1",
    lineHeight: "1.7",
    textAlign: "justify"
  },
  modalSystemParagraphParaBlockTextHelpTextBangla: {
    margin: 0,
    fontSize: "14px",
    color: "#ffffff",
    lineHeight: "1.7"
  },
  modalSystemAcceptActionButtonTriggerElement: {
    width: "100%",
    height: "54px",
    marginTop: "30px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(90deg, #00ffa3, #00b876)",
    color: "#020617",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(0,255,163,0.3)"
  }
};
