import React, { useState } from 'react';

const OneTime = () => {
  // ---------------- State Management ----------------
  const [walletBalance, setWalletBalance] = useState(1200);
  const [totalInvested, setTotalInvested] = useState(5000);
  const [investHistory, setInvestHistory] = useState([
    { id: 1, amount: 5000, duration: 30, frequency: 'daily', returnRate: '৫০ টাকা/দিন', date: '2026-09-01' }
  ]);

  // Bank Setup & Status
  const [isBankSet, setIsBankSet] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', holderName: '' });

  // Withdrawal Tracking (Day limitation)
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState(null);
  const [lastWithdrawalStatus, setLastWithdrawalStatus] = useState(null); // 'pending' | 'success' | 'rejected' | null

  // Modals
  const [showAddInvestModal, setShowAddInvestModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Form Inputs
  const [investAmount, setInvestAmount] = useState(1000);
  const [durationDays, setDurationDays] = useState(30);
  const [frequency, setFrequency] = useState('daily'); // 'daily' or 'weekly'
  const [withdrawAmount, setWithdrawAmount] = useState(100);
  const [screenshot, setScreenshot] = useState(null);

  // Constants & Calculations
  const walletAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const presetAmounts = [100, 300, 500, 1000, 10000, 100000];
  const todayStr = new Date().toISOString().split('T')[0];

  // Interest Calculation (১% প্রতিদিন অনুমান করে)
  const dailyReturn = (investAmount * 0.01).toFixed(2);
  const weeklyReturn = (dailyReturn * 7).toFixed(2);
  const totalReturn = (dailyReturn * durationDays).toFixed(2);

  // ---------------- Handlers ----------------

  // Investment Submission
  const handleInvestSubmit = (e) => {
    e.preventDefault();
    const newInvestment = {
      id: Date.now(),
      amount: Number(investAmount),
      duration: Number(durationDays),
      frequency,
      returnRate: frequency === 'daily' ? `${dailyReturn} টাকা/দিন` : `${weeklyReturn} টাকা/সপ্তাহ`,
      date: todayStr
    };

    setInvestHistory([newInvestment, ...investHistory]);
    setTotalInvested(prev => prev + Number(investAmount));
    alert('ইনভেস্ট সফল হয়েছে!');
  };

  // Withdraw Button Logic
  const handleWithdrawButtonClick = () => {
    // Check daily withdrawal restriction
    if (lastWithdrawalDate === todayStr && (lastWithdrawalStatus === 'success' || lastWithdrawalStatus === 'pending')) {
      alert('আপনি আজকে ইতিমধ্যে উইথড্র রিকুয়েস্ট করেছেন। প্রতিদিন মাত্র একবারই উইথড্র করা সম্ভব।');
      return;
    }

    if (!isBankSet) {
      setShowBankModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  // Save Bank Details
  const handleSaveBank = (e) => {
    e.preventDefault();
    if (!bankDetails.bankName || !bankDetails.accountNumber) {
      alert('দয়া করে সঠিক ব্যাংক তথ্য দিন');
      return;
    }
    setIsBankSet(true);
    setShowBankModal(false);
    setShowWithdrawModal(true); // Direct open withdraw modal after setting bank
  };

  // Submit Withdrawal
  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    if (withdrawAmount > walletBalance) {
      alert('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }

    // Set today's withdrawal status as pending
    setLastWithdrawalDate(todayStr);
    setLastWithdrawalStatus('pending');
    setWalletBalance(prev => prev - withdrawAmount);
    setShowWithdrawModal(false);
    alert('উইথড্র রিকুয়েস্ট সফলভাবে জমা হয়েছে!');
  };

  // Copy Address
  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert('ওয়ালেট অ্যাড্রেস কপি করা হয়েছে!');
  };

  // Add Investment Submit
  const handleAddInvestSubmit = (e) => {
    e.preventDefault();
    if (!screenshot) {
      alert('দয়া করে পেমেন্টের স্ক্রিনশট আপলোড করুন');
      return;
    }
    setShowAddInvestModal(false);
    alert('আপনার পেমেন্ট প্রুফ জমা হয়েছে। এডমিন ভেরিফাই করলে ওয়ালেটে যুক্ত হবে।');
    setScreenshot(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">One Time Investment Portal</h1>

      {/* Top Cards: Balance & Invested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-5 bg-white rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-gray-500 font-medium">টোটাল ইনভেস্ট</p>
          <h2 className="text-3xl font-bold text-gray-800">৳ {totalInvested}</h2>
        </div>
        <div className="p-5 bg-white rounded-xl shadow-md border-l-4 border-green-500 flex justify-between items-center">
          <div>
            <p className="text-gray-500 font-medium">ওয়ালেট ব্যালেন্স</p>
            <h2 className="text-3xl font-bold text-gray-800">৳ {walletBalance}</h2>
          </div>
          <div className="space-x-2">
            <button 
              onClick={() => setShowAddInvestModal(true)} 
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">
              Add Invest
            </button>
            <button 
              onClick={handleWithdrawButtonClick} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Investment Form */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-700">নতুন ইনভেস্ট করুন</h2>
        <form onSubmit={handleInvestSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ইনভেস্ট পরিমাণ (টাকা):</label>
            <input 
              type="number" 
              value={investAmount} 
              onChange={(e) => setInvestAmount(Number(e.target.value))}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              min="100"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">সময়সীমা (দিন):</label>
              <input 
                type="number" 
                value={durationDays} 
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                min="1"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ইন্টারেস্ট গ্রহণের সময়:</label>
              <select 
                value={frequency} 
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="daily">প্রতিদিন</option>
                <option value="weekly">প্রতি সপ্তাহে</option>
              </select>
            </div>
          </div>

          {/* Calculations Box */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500 block">দৈনিক রিটার্ন:</span>
              <span className="font-bold text-green-600">৳ {dailyReturn}</span>
            </div>
            <div>
              <span className="text-gray-500 block">সাপ্তাহিক রিটার্ন:</span>
              <span className="font-bold text-green-600">৳ {weeklyReturn}</span>
            </div>
            <div>
              <span className="text-gray-500 block">মোট আনুমানিক রিটার্ন:</span>
              <span className="font-bold text-blue-600">৳ {totalReturn}</span>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">
            ইনভেস্ট নিশ্চিত করুন
          </button>
        </form>
      </div>

      {/* Investment History */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-700">ইনভেস্ট হিস্ট্রি</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-500 text-sm">
                <th className="p-2">তারিখ</th>
                <th className="p-2">পরিমাণ</th>
                <th className="p-2">মেয়াদ</th>
                <th className="p-2">টাইপ</th>
                <th className="p-2">রিটার্ন হার</th>
              </tr>
            </thead>
            <tbody>
              {investHistory.map((item) => (
                <tr key={item.id} className="border-b text-sm hover:bg-gray-50">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2 font-semibold">৳ {item.amount}</td>
                  <td className="p-2">{item.duration} দিন</td>
                  <td className="p-2 capitalize">{item.frequency === 'daily' ? 'দৈনিক' : 'সাপ্তাহিক'}</td>
                  <td className="p-2 text-green-600">{item.returnRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Add Invest Modal */}
      {showAddInvestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <h3 className="text-lg font-bold mb-4">টাকা ডিপোজিট করুন</h3>
            <p className="text-sm text-gray-600 mb-2">নিচের ওয়ালেট অ্যাড্রেসে টাকা সেন্ড করে স্ক্রিনশট আপলোড করুন:</p>
            
            <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center mb-4">
              <span className="text-xs break-all font-mono">{walletAddress}</span>
              <button onClick={copyToClipboard} className="bg-gray-300 hover:bg-gray-400 text-xs px-2 py-1 rounded ml-2">
                Copy
              </button>
            </div>

            <form onSubmit={handleAddInvestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">পেমেন্ট স্ক্রিনশট:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="w-full text-sm border p-2 rounded-lg"
                  required 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddInvestModal(false)} className="px-4 py-2 border rounded-lg text-sm">
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold">
                  জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Set Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">ব্যাংক অ্যাকাউন্ট সেটিং</h3>
            <p className="text-xs text-gray-500 mb-4">উইথড্র করার জন্য প্রথমবার ব্যাংক অ্যাকাউন্ট সেট করা বাধ্যতামূলক।</p>
            
            <form onSubmit={handleSaveBank} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">ব্যাংকের নাম / মোবাইল ব্যাংকিং:</label>
                <input 
                  type="text" 
                  placeholder="e.g. BKash, Nagad, DBBL"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  className="w-full border rounded p-2 text-sm" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">অ্যাকাউন্ট নম্বর:</label>
                <input 
                  type="text" 
                  placeholder="017xxxxxxxx / Acc Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  className="w-full border rounded p-2 text-sm" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">অ্যাকাউন্ট হোল্ডার নাম:</label>
                <input 
                  type="text" 
                  value={bankDetails.holderName}
                  onChange={(e) => setBankDetails({...bankDetails, holderName: e.target.value})}
                  className="w-full border rounded p-2 text-sm" 
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 border rounded text-sm">
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-1">টাকা উইথড্র করুন</h3>
            <p className="text-xs text-gray-500 mb-3">বর্তমান ওয়ালেট ব্যালেন্স: <span className="font-bold text-green-600">৳ {walletBalance}</span></p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">উইথড্র অ্যামাউন্ট নির্বাচন করুন:</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {presetAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt)}
                      className={`py-2 text-sm font-semibold rounded border ${withdrawAmount === amt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      ৳ {amt}
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  min="1"
                  required
                />
              </div>

              <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-200">
                ⚠️ নোট: প্রতিদিন মাত্র ১ বার সাকসেসফুল/পেন্ডিং উইথড্র রিকুয়েস্ট করা যাবে।
              </div>

              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="px-4 py-2 border rounded text-sm">
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">
                  কনফার্ম উইথড্র
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneTime;
