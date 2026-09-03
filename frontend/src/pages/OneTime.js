/*
 * SAVE MONEY - One Time Investment
 * Indian English UI
 *
 * No dummy investment data.
 * No dummy return rate.
 *
 * Daily duration: 1 - 100 Days
 * Weekly duration: 1 - 12 Weeks
 */

(() => {
  "use strict";

  const CONFIG = {
    currency: "₹",
    minInvestment: 100
  };

  const state = {
    durationType: "daily",
    duration: 1,
    amount: 0,
    rate: 0,
    history: []
  };

  const app = () => {
    let el = document.getElementById("save-money-app");

    if (!el) {
      el = document.createElement("div");
      el.id = "save-money-app";
      document.body.appendChild(el);
    }

    return el;
  };

  const money = (value) => {
    return `${CONFIG.currency} ${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  /*
   * Return calculation
   *
   * This is only a calculator.
   * The actual investment/interest calculation should
   * preferably be verified from your backend.
   */
  function calculate() {
    const amount = Number(state.amount) || 0;
    const rate = Number(state.rate) || 0;

    let days = 0;

    if (state.durationType === "daily") {
      days = Number(state.duration) || 0;
    } else {
      days = (Number(state.duration) || 0) * 7;
    }

    /*
     * Rate is treated as percentage per day.
     *
     * Example:
     * Amount = ₹10000
     * Rate = 0.10
     * Daily Return = ₹10
     *
     * Change this formula if your actual plan
     * uses another approved calculation.
     */
    const dailyReturn = amount * (rate / 100);

    const weeklyReturn = dailyReturn * 7;

    const totalReturn = dailyReturn * days;

    const totalPayout = amount + totalReturn;

    return {
      days,
      dailyReturn,
      weeklyReturn,
      totalReturn,
      totalPayout
    };
  }

  function render() {
    const root = app();
    const result = calculate();

    root.innerHTML = `
      <style>

        #save-money-app {
          --navy: #061b3a;
          --navy2: #0a2851;
          --green: #08a95b;
          --green-dark: #07894b;
          --blue: #1557d6;
          --text: #10182d;
          --muted: #68758e;
          --border: #dfe5ee;
          --light: #f7f9fc;

          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;

          min-height: 100vh;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy2)
            );

          padding: 24px;

          color: var(--text);

          box-sizing: border-box;
        }

        #save-money-app * {
          box-sizing: border-box;
        }

        .sm-container {
          width: 100%;
          max-width: 1180px;
          margin: auto;
        }

        /* HEADER */

        .sm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: white;
          margin-bottom: 18px;
        }

        .sm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sm-logo {
          width: 56px;
          height: 56px;
          border: 3px solid #18c86f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          font-weight: 900;
          color: #18c86f;
        }

        .sm-brand h1 {
          margin: 0;
          font-size: 28px;
        }

        .sm-brand h1 span {
          color: #20cf72;
        }

        .sm-brand p {
          margin: 3px 0 0;
          font-size: 13px;
          opacity: .75;
        }

        .sm-welcome {
          text-align: center;
        }

        .sm-welcome strong {
          display: block;
          font-size: 22px;
        }

        .sm-welcome span {
          font-size: 13px;
          opacity: .75;
        }

        .sm-profile {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green);
          font-size: 26px;
        }

        /* CARD */

        .sm-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.12);
        }

        /* SUMMARY */

        .sm-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);

          background:
            linear-gradient(
              100deg,
              #1557d6,
              #08a95b
            );

          color: white;
        }

        .sm-stat {
          text-align: center;
          padding: 25px 15px;
          border-right: 1px solid rgba(255,255,255,.25);
        }

        .sm-stat:last-child {
          border-right: 0;
        }

        .sm-stat-icon {
          font-size: 28px;
          margin-bottom: 7px;
        }

        .sm-stat-title {
          font-size: 14px;
          opacity: .9;
        }

        .sm-stat-value {
          display: block;
          font-size: 27px;
          font-weight: 800;
          margin-top: 6px;
        }

        /* MAIN */

        .sm-main {
          padding: 25px;
        }

        .sm-title {
          margin: 0 0 22px;
          font-size: 22px;
          font-weight: 800;
        }

        .sm-title-line {
          width: 48px;
          height: 3px;
          background: var(--green);
          border-radius: 5px;
          margin-top: 8px;
        }

        /* FORM */

        .sm-form {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .sm-field label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 9px;
        }

        .sm-input,
        .sm-select {
          width: 100%;
          height: 54px;
          border: 1px solid #d5dce7;
          border-radius: 12px;
          padding: 0 15px;
          font-size: 16px;
          color: var(--text);
          background: white;
          outline: none;
        }

        .sm-input:focus,
        .sm-select:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(8,169,91,.12);
        }

        .sm-help {
          display: block;
          margin-top: 6px;
          color: var(--muted);
          font-size: 12px;
        }

        /* DAILY / WEEKLY */

        .sm-frequency {
          display: flex;
          gap: 8px;
        }

        .sm-frequency button {
          flex: 1;
          height: 54px;
          border-radius: 12px;
          border: 1px solid #cbd5e2;
          background: white;
          color: var(--text);
          font-size: 16px;
          cursor: pointer;
        }

        .sm-frequency button.active {
          background: var(--green);
          color: white;
          border-color: var(--green);
        }

        /* RETURN CARDS */

        .sm-return-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 22px;
        }

        .sm-return-card {
          padding: 22px;
          border-radius: 15px;
          background: #eaf9ef;
          border: 1px solid #d1f1dc;
          text-align: center;
        }

        .sm-return-card.weekly {
          background: #eef5ff;
          border-color: #d7e5ff;
        }

        .sm-return-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--green-dark);
        }

        .sm-return-card.weekly
        .sm-return-title {
          color: var(--blue);
        }

        .sm-return-value {
          display: block;
          font-size: 30px;
          font-weight: 800;
          color: var(--green-dark);
        }

        .sm-return-card.weekly
        .sm-return-value {
          color: var(--blue);
        }

        .sm-return-note {
          display: block;
          color: var(--muted);
          margin-top: 5px;
          font-size: 12px;
        }

        /* BREAKDOWN */

        .sm-breakdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          margin-top: 20px;
        }

        .sm-break {
          text-align: center;
          padding: 19px;
          border-right: 1px solid var(--border);
        }

        .sm-break:last-child {
          border-right: 0;
        }

        .sm-break label {
          display: block;
          color: var(--muted);
          font-size: 13px;
          margin-bottom: 7px;
        }

        .sm-break strong {
          font-size: 17px;
        }

        /* ACTIONS */

        .sm-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 20px;
        }

        .sm-btn {
          border: 0;
          height: 62px;
          border-radius: 12px;
          font-size: 17px;
          font-weight: 800;
          color: white;
          cursor: pointer;
        }

        .sm-add {
          background: var(--green);
        }

        .sm-withdraw {
          background: var(--navy);
        }

        .sm-btn:hover {
          filter: brightness(1.08);
        }

        /* HISTORY */

        .sm-history {
          padding: 24px;
        }

        .sm-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .sm-history-header h2 {
          margin: 0;
          font-size: 21px;
        }

        .sm-view-all {
          color: var(--green-dark);
          font-weight: 700;
          cursor: pointer;
        }

        .sm-table-wrapper {
          overflow-x: auto;
        }

        .sm-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        .sm-table th,
        .sm-table td {
          padding: 15px 12px;
          text-align: left;
          border-bottom: 1px solid #edf0f5;
          font-size: 13px;
        }

        .sm-table th {
          background: #fafbfd;
          color: #44516a;
        }

        .sm-empty {
          text-align: center !important;
          padding: 35px !important;
          color: var(--muted);
        }

        /* STATUS */

        .sm-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .sm-active {
          background: #e5f8ec;
          color: var(--green-dark);
        }

        /* BANNER */

        .sm-banner {
          padding: 22px 24px;
          background: var(--light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .sm-banner h3 {
          margin: 0 0 5px;
          font-size: 19px;
        }

        .sm-banner p {
          margin: 0;
          color: var(--muted);
        }

        .sm-secure {
          color: var(--green-dark);
          font-weight: 800;
          text-align: right;
          white-space: nowrap;
        }

        /* NAV */

        .sm-nav {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          background: var(--navy);
          border-radius: 0 0 20px 20px;
        }

        .sm-nav button {
          border: 0;
          background: transparent;
          color: #cbd5e1;
          padding: 16px 5px;
          cursor: pointer;
          font-size: 12px;
        }

        .sm-nav button.active {
          background: var(--green-dark);
          color: white;
          border-radius: 12px;
          margin: 6px;
        }

        /* TOAST */

        .sm-toast {
          position: fixed;
          right: 20px;
          bottom: 20px;
          background: var(--navy);
          color: white;
          padding: 13px 17px;
          border-radius: 10px;
          box-shadow: 0 8px 25px rgba(0,0,0,.25);
          opacity: 0;
          transform: translateY(10px);
          pointer-events: none;
          transition: .25s;
          z-index: 9999;
        }

        .sm-toast.show {
          opacity: 1;
          transform: translateY(0);
        }

        /* MOBILE */

        @media (max-width: 850px) {

          #save-money-app {
            padding: 12px;
          }

          .sm-header {
            align-items: flex-start;
          }

          .sm-welcome {
            display: none;
          }

          .sm-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .sm-stat:nth-child(2) {
            border-right: 0;
          }

          .sm-form {
            grid-template-columns: 1fr;
          }

          .sm-return-grid {
            grid-template-columns: 1fr;
          }

          .sm-breakdown {
            grid-template-columns: repeat(2, 1fr);
          }

          .sm-break:nth-child(2) {
            border-right: 0;
          }

          .sm-actions {
            grid-template-columns: 1fr;
          }

          .sm-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .sm-secure {
            text-align: left;
          }

          .sm-nav {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 500px) {

          .sm-brand h1 {
            font-size: 22px;
          }

          .sm-logo {
            width: 48px;
            height: 48px;
          }

          .sm-profile {
            width: 48px;
            height: 48px;
          }

          .sm-stat {
            padding: 18px 8px;
          }

          .sm-stat-value {
            font-size: 20px;
          }

          .sm-main,
          .sm-history {
            padding: 17px;
          }

          .sm-title {
            font-size: 19px;
          }
        }

      </style>


      <div class="sm-container">

        <!-- HEADER -->

        <header class="sm-header">

          <div class="sm-brand">

            <div class="sm-logo">
              ↗
            </div>

            <div>
              <h1>
                SAVE <span>MONEY</span>
              </h1>

              <p>
                Invest Small, Earn Big
              </p>
            </div>

          </div>


          <div class="sm-welcome">

            <strong>
              Welcome Back! 👋
            </strong>

            <span>
              Invest smartly and secure your future with us
            </span>

          </div>


          <div class="sm-profile">
            ●
          </div>

        </header>


        <!-- SUMMARY -->

        <section class="sm-card sm-summary">

          <div class="sm-stat">

            <div class="sm-stat-icon">
              ▣
            </div>

            <div class="sm-stat-title">
              Total Invested
            </div>

            <strong
              class="sm-stat-value"
              id="sm-total-invested"
            >
              ₹ 0.00
            </strong>

          </div>


          <div class="sm-stat">

            <div class="sm-stat-icon">
              ↗
            </div>

            <div class="sm-stat-title">
              Total Returns
            </div>

            <strong
              class="sm-stat-value"
              id="sm-total-returns"
            >
              ₹ 0.00
            </strong>

          </div>


          <div class="sm-stat">

            <div class="sm-stat-icon">
              ₹
            </div>

            <div class="sm-stat-title">
              Total Earnings
            </div>

            <strong
              class="sm-stat-value"
              id="sm-total-earnings"
            >
              ₹ 0.00
            </strong>

          </div>


          <div class="sm-stat">

            <div class="sm-stat-icon">
              ◉
            </div>

            <div class="sm-stat-title">
              Available Balance
            </div>

            <strong
              class="sm-stat-value"
              id="sm-balance"
            >
              ₹ 0.00
            </strong>

          </div>

        </section>


        <!-- INVESTMENT -->

        <section class="sm-card sm-main">

          <h2 class="sm-title">
            Make a New Investment

            <div class="sm-title-line"></div>
          </h2>


          <div class="sm-form">


            <!-- DURATION TYPE -->

            <div class="sm-field">

              <label>
                📅 Select Investment Type
              </label>

              <div class="sm-frequency">

                <button
                  type="button"
                  data-type="daily"
                  class="duration-type active"
                >
                  Daily
                </button>

                <button
                  type="button"
                  data-type="weekly"
                  class="duration-type"
                >
                  Weekly
                </button>

              </div>

            </div>


            <!-- DURATION -->

            <div class="sm-field">

              <label>
                ⏱ Select Investment Duration
              </label>

              <select
                id="sm-duration"
                class="sm-select"
              >
              </select>

              <small
                class="sm-help"
                id="sm-duration-help"
              >
                Select from 1 to 100 Days
              </small>

            </div>


            <!-- AMOUNT -->

            <div class="sm-field">

              <label>
                💵 Enter Investment Amount
              </label>

              <input
                id="sm-amount"
                class="sm-input"
                type="number"
                min="100"
                step="1"
                value=""
                placeholder="Enter amount"
              />

              <small class="sm-help">
                Minimum Investment: ₹ 100
              </small>

            </div>


            <!-- RATE -->

            <div class="sm-field">

              <label>
                📈 Return Rate (% Per Day)
              </label>

              <input
                id="sm-rate"
                class="sm-input"
                type="number"
                min="0"
                step="0.01"
                value=""
                placeholder="Enter return rate"
              />

              <small class="sm-help">
                Enter the actual return rate
              </small>

            </div>

          </div>


          <!-- RETURN -->

          <div class="sm-return-grid">

            <div class="sm-return-card">

              <div class="sm-return-title">
                You Will Get Daily Return
              </div>

              <strong
                class="sm-return-value"
                id="sm-daily-return"
              >
                ₹ 0.00
              </strong>

              <span class="sm-return-note">
                Based on entered amount & rate
              </span>

            </div>


            <div class="sm-return-card weekly">

              <div class="sm-return-title">
                You Will Get Weekly Return
              </div>

              <strong
                class="sm-return-value"
                id="sm-weekly-return"
              >
                ₹ 0.00
              </strong>

              <span class="sm-return-note">
                Daily Return × 7
              </span>

            </div>

          </div>


          <!-- BREAKDOWN -->

          <div class="sm-breakdown">

            <div class="sm-break">

              <label>
                Investment Amount
              </label>

              <strong id="sm-break-amount">
                ₹ 0.00
              </strong>

            </div>


            <div class="sm-break">

              <label>
                Duration
              </label>

              <strong id="sm-break-duration">
                0 Days
              </strong>

            </div>


            <div class="sm-break">

              <label>
                Total Return
              </label>

              <strong id="sm-total-return">
                ₹ 0.00
              </strong>

            </div>


            <div class="sm-break">

              <label>
                Total Payout
              </label>

              <strong id="sm-total-payout">
                ₹ 0.00
              </strong>

            </div>

          </div>


          <!-- ACTIONS -->

          <div class="sm-actions">

            <button
              type="button"
              class="sm-btn sm-add"
              id="sm-add-invest"
            >
              ＋ Add Invest
              <br>
              <small>
                Invest More
              </small>
            </button>


            <button
              type="button"
              class="sm-btn sm-withdraw"
              id="sm-withdraw"
            >
              ➜ Withdraw
              <br>
              <small>
                Withdraw Funds
              </small>
            </button>

          </div>

        </section>


        <!-- HISTORY -->

        <section class="sm-card sm-history">

          <div class="sm-history-header">

            <h2>
              Investment History
            </h2>

            <span
              class="sm-view-all"
              id="sm-view-all"
            >
              View All
            </span>

          </div>


          <div class="sm-table-wrapper">

            <table class="sm-table">

              <thead>

                <tr>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Invested Amount</th>
                  <th>Return Rate</th>
                  <th>Status</th>
                  <th>Maturity Date</th>
                </tr>

              </thead>


              <tbody id="sm-history-body">

                <tr>

                  <td
                    colspan="6"
                    class="sm-empty"
                  >
                    No investment history available
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </section>


        <!-- BANNER -->

        <section class="sm-card sm-banner">

          <div>

            <h3>
              Invest Small, Earn Big Returns Together
            </h3>

            <p>
              Start investing today and secure your future.
            </p>

          </div>


          <div class="sm-secure">

            🛡 100% Secure

            <br>

            <small>
              Safe & Trusted Platform
            </small>

          </div>

        </section>


        <!-- NAVIGATION -->

        <nav class="sm-nav">

          <button class="active">
            ⌂
            <br>
            Home
          </button>

          <button>
            ↗
            <br>
            Investments
          </button>

          <button>
            ▤
            <br>
            History
          </button>

          <button>
            ▣
            <br>
            Earnings
          </button>

          <button>
            ♧
            <br>
            Refer & Earn
          </button>

          <button>
            ●
            <br>
            Profile
          </button>

        </nav>

      </div>


      <div
        id="sm-toast"
        class="sm-toast"
      ></div>
    `;

    populateDuration();
    bindEvents();
    updateUI();
  }


  /* ---------------------------------
     DURATION OPTIONS
  --------------------------------- */

  function populateDuration() {

    const select =
      document.getElementById("sm-duration");

    const help =
      document.getElementById("sm-duration-help");

    if (!select) return;

    select.innerHTML = "";

    if (state.durationType === "daily") {

      for (let i = 1; i <= 100; i++) {

        const option =
          document.createElement("option");

        option.value = i;

        option.textContent =
          `${i} ${i === 1 ? "Day" : "Days"}`;

        select.appendChild(option);
      }

      help.textContent =
        "Select from 1 to 100 Days";

    } else {

      for (let i = 1; i <= 12; i++) {

        const option =
          document.createElement("option");

        option.value = i;

        option.textContent =
          `${i} ${i === 1 ? "Week" : "Weeks"}`;

        select.appendChild(option);
      }

      help.textContent =
        "Select from 1 to 12 Weeks";
    }

    select.value = state.duration;
  }


  /* ---------------------------------
     UPDATE UI
  --------------------------------- */

  function updateUI() {

    const result = calculate();

    const amount =
      Number(state.amount) || 0;

    const rate =
      Number(state.rate) || 0;


    document.getElementById(
      "sm-daily-return"
    ).textContent =
      money(result.dailyReturn);


    document.getElementById(
      "sm-weekly-return"
    ).textContent =
      money(result.weeklyReturn);


    document.getElementById(
      "sm-break-amount"
    ).textContent =
      money(amount);


    document.getElementById(
      "sm-break-duration"
    ).textContent =
      state.durationType === "daily"
        ? `${state.duration} ${
            state.duration === 1 ? "Day" : "Days"
          }`
        : `${state.duration} ${
            state.duration === 1 ? "Week" : "Weeks"
          }`;


    document.getElementById(
      "sm-total-return"
    ).textContent =
      money(result.totalReturn);


    document.getElementById(
      "sm-total-payout"
    ).textContent =
      money(result.totalPayout);
  }


  /* ---------------------------------
     EVENTS
  --------------------------------- */

  function bindEvents() {

    document
      .querySelectorAll(".duration-type")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            state.durationType =
              button.dataset.type;

            state.duration = 1;

            document
              .querySelectorAll(".duration-type")
              .forEach(btn =>
                btn.classList.remove("active")
              );

            button.classList.add("active");

            populateDuration();

            updateUI();
          }
        );
      });


    const duration =
      document.getElementById("sm-duration");

    duration.addEventListener(
      "change",
      event => {

        state.duration =
          Number(event.target.value) || 1;

        updateUI();
      }
    );


    const amount =
      document.getElementById("sm-amount");

    amount.addEventListener(
      "input",
      event => {

        state.amount =
          Number(event.target.value) || 0;

        updateUI();
      }
    );


    const rate =
      document.getElementById("sm-rate");

    rate.addEventListener(
      "input",
      event => {

        state.rate =
          Number(event.target.value) || 0;

        updateUI();
      }
    );


    document
      .getElementById("sm-add-invest")
      .addEventListener(
        "click",
        handleAddInvestment
      );


    document
      .getElementById("sm-withdraw")
      .addEventListener(
        "click",
        () => {

          showToast(
            "Withdraw section is ready to connect."
          );

          /*
           * Connect your withdrawal page/API here.
           */
        }
      );


    document
      .getElementById("sm-view-all")
      .addEventListener(
        "click",
        () => {

          showToast(
            "No investment history available."
          );
        }
      );
  }


  /* ---------------------------------
     ADD INVESTMENT
  --------------------------------- */

  function handleAddInvestment() {

    const amount =
      Number(state.amount) || 0;

    const rate =
      Number(state.rate) || 0;


    if (amount < CONFIG.minInvestment) {

      showToast(
        `Minimum investment is ${money(CONFIG.minInvestment)}`
      );

      return;
    }


    if (rate <= 0) {

      showToast(
        "Please enter the actual return rate."
      );

      return;
    }


    const result = calculate();


    /*
     * IMPORTANT:
     *
     * This does NOT automatically save
     * an investment as real money.
     *
     * Connect your backend/payment API here.
     */

    showToast(
      `Investment ready: ${money(amount)}`
    );


    /*
     * Example backend call:
     *
     * fetch("/api/investments", {
     *   method: "POST",
     *   headers: {
     *     "Content-Type": "application/json"
     *   },
     *   body: JSON.stringify({
     *     amount: amount,
     *     durationType: state.durationType,
     *     duration: state.duration,
     *     rate: rate,
     *     totalReturn: result.totalReturn,
     *     totalPayout: result.totalPayout
     *   })
     * });
     */
  }


  /* ---------------------------------
     TOAST
  --------------------------------- */

  function showToast(message) {

    const toast =
      document.getElementById("sm-toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

      toast.classList.remove("show");

    }, 2500);
  }


  /* ---------------------------------
     PUBLIC API
  --------------------------------- */

  window.SaveMoneyOneTime = {

    setAmount(amount) {

      state.amount =
        Number(amount) || 0;

      const input =
        document.getElementById("sm-amount");

      if (input) {
        input.value =
          state.amount || "";
      }

      updateUI();
    },


    setRate(rate) {

      state.rate =
        Number(rate) || 0;

      const input =
        document.getElementById("sm-rate");

      if (input) {
        input.value =
          state.rate || "";
      }

      updateUI();
    },


    setDurationType(type) {

      if (
        type !== "daily" &&
        type !== "weekly"
      ) {
        return;
      }

      state.durationType = type;
      state.duration = 1;

      render();
    },


    setDuration(duration) {

      let value =
        Number(duration) || 1;

      if (state.durationType === "daily") {
        value = Math.max(1, Math.min(100, value));
      } else {
        value = Math.max(1, Math.min(12, value));
      }

      state.duration = value;

      const select =
        document.getElementById("sm-duration");

      if (select) {
        select.value = value;
      }

      updateUI();
    },


    getInvestmentData() {

      return {
        durationType: state.durationType,
        duration: state.duration,
        amount: state.amount,
        rate: state.rate,
        calculation: calculate()
      };
    },


    setHistory(history) {

      if (!Array.isArray(history)) {
        return;
      }

      state.history = history;

      renderHistory();
    },


    render() {
      render();
    }
  };


  /* ---------------------------------
     HISTORY
  --------------------------------- */

  function renderHistory() {

    const body =
      document.getElementById(
        "sm-history-body"
      );

    if (!body) return;


    if (!state.history.length) {

      body.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="sm-empty"
          >
            No investment history available
          </td>
        </tr>
      `;

      return;
    }


    body.innerHTML =
      state.history
        .map(item => {

          return `
            <tr>

              <td>
                ${item.date || "-"}
              </td>

              <td>
                ${item.duration || "-"}
              </td>

              <td>
                ${money(item.amount)}
              </td>

              <td>
                ${item.rate || 0}%
              </td>

              <td>

                <span class="sm-status sm-active">
                  ${item.status || "Active"}
                </span>

              </td>

              <td>
                ${item.maturity || "-"}
              </td>

            </tr>
          `;

        })
        .join("");
  }


  /* ---------------------------------
     START
  --------------------------------- */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      render
    );

  } else {

    render();

  }

})();
