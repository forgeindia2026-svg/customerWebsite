import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updatePaymentStatus } from '../../redux/dashboardSlice';
import { FiChevronRight, FiCalendar, FiArrowDown, FiArrowUp, FiPlus, FiX, FiCheckCircle, FiArrowLeft, FiUser } from 'react-icons/fi';
import { FaWhatsapp, FaRupeeSign } from 'react-icons/fa';

export default function Payments() {
  const payments = useSelector(state => state.dashboard.payments) || [];
  const products = useSelector(state => state.dashboard.products) || [];
  const dispatch = useDispatch();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isInventoryDrawerOpen, setIsInventoryDrawerOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(false);
  const [selectedUnpaidInvoice, setSelectedUnpaidInvoice] = useState('');

  const currentInvoiceTotal = selectedItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);

  const toggleItemSelection = (item) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };
  
  // Calculate totals from real data
  const paidTotal = payments.filter(p => p.status && p.status.toLowerCase() === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const pendingTotal = payments.filter(p => p.status && p.status.toLowerCase() === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const stockValue = products.reduce((s, p) => s + (Number(p.price) * (Number(p.stock) || 10)), 0); // Assuming stock of 10 if missing
  const thisWeekSale = paidTotal; // Approximation for demo
  const totalBalance = paidTotal + 150000; // Cash + Bank approximation
  const uniqueCustomers = [...new Set(payments.map(p => p.customer))].filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto pb-24 relative min-h-[calc(100vh-100px)]">
      
      {/* 6-Card Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3 mb-6">
        
        {/* To Collect */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center cursor-pointer hover:bg-emerald-50 transition-colors">
          <div>
            <h4 className="text-lg font-bold text-slate-800">₹ {pendingTotal.toLocaleString('en-IN')}</h4>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-semibold text-emerald-600">To Collect</span>
              <FiArrowDown className="text-emerald-600" size={14} />
            </div>
          </div>
          <FiChevronRight className="text-slate-400" />
        </div>

        {/* To Pay */}
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 flex justify-between items-center cursor-pointer hover:bg-rose-50 transition-colors">
          <div>
            <h4 className="text-lg font-bold text-slate-800">₹ {paidTotal.toLocaleString('en-IN')}</h4>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-semibold text-rose-500">To Pay</span>
              <FiArrowUp className="text-rose-500" size={14} />
            </div>
          </div>
          <FiChevronRight className="text-slate-400" />
        </div>

        {/* Stock Value */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-200 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors">
          <div>
            <h4 className="text-base font-bold text-slate-800">₹ {stockValue.toLocaleString('en-IN')}</h4>
            <span className="text-sm text-slate-500 mt-1 block">Value of Items</span>
          </div>
          <FiChevronRight className="text-slate-400" />
        </div>

        {/* This week's sale */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-200 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors">
          <div>
            <h4 className="text-base font-bold text-slate-800">₹ {thisWeekSale.toLocaleString('en-IN')}</h4>
            <span className="text-sm text-slate-500 mt-1 block">This week's sale</span>
          </div>
          <FiChevronRight className="text-slate-400" />
        </div>

        {/* Total Balance */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-200 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors">
          <div>
            <h4 className="text-base font-bold text-slate-800">₹ {totalBalance.toLocaleString('en-IN')}</h4>
            <span className="text-sm text-slate-500 mt-1 block">Cash + Bank Balance</span>
          </div>
          <FiChevronRight className="text-slate-400" />
        </div>

        {/* Reports */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-200 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors">
          <div>
            <h4 className="text-base font-bold text-slate-800">Reports</h4>
            <span className="text-sm text-slate-500 mt-1 block truncate">Sales, Party, GST...</span>
          </div>
          <FiChevronRight className="text-slate-400" />
        </div>

      </div>

      {/* Transactions Header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-bold text-slate-500 text-lg">Transactions</h3>
        <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-wide">
          <FiCalendar size={18} /> LAST 365 DAYS
        </button>
      </div>

      {/* Transaction Cards List */}
      <div className="space-y-4">
        {payments.map((pay, index) => {
          const isPaid = pay.status && pay.status.toLowerCase() === 'paid';
          
          return (
            <div key={pay.id || index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4">
                {/* Top Row: Name and Amount */}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-base">{pay.customer}</h4>
                  <span className="font-bold text-slate-800 text-base">₹ {Number(pay.amount).toLocaleString('en-IN')}</span>
                </div>
                
                {/* Middle Row: Invoice Details */}
                <div className="flex justify-between items-center">
                  <div className="text-slate-500 text-sm font-medium">
                    Sales Invoice #{pay.id}
                  </div>
                  {/* Status Badge */}
                  {isPaid ? (
                    <span className="px-3 py-0.5 rounded border border-emerald-500 text-emerald-600 text-xs font-bold">
                      Paid
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded bg-rose-400 text-white text-xs font-bold">
                      Unpaid
                    </span>
                  )}
                </div>

                {/* Bottom Row: Date */}
                <div className="text-slate-400 text-sm mt-1">
                  {pay.date} {isPaid ? '' : '• 6 day(s) to due'}
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-slate-100 p-3 flex justify-between items-center bg-slate-50/50">
                <button 
                  onClick={() => {
                    setSelectedPayment(pay);
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-indigo-500 font-bold text-sm hover:text-indigo-700 transition-colors"
                >
                  <FaRupeeSign className="rotate-180" size={14} /> Record Manually
                </button>
                <button 
                  onClick={() => window.open(`https://wa.me/?text=Here%20is%20the%20link%20for%20Invoice%20${pay.id}`, '_blank')}
                  className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
                >
                  <FaWhatsapp size={16} /> Share Payment Link
                </button>
              </div>
            </div>
          );
        })}

        {payments.length === 0 && (
          <div className="text-center py-10 text-slate-500 font-medium">
            No transactions found.
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none flex justify-center z-50">
        <div className="max-w-3xl w-full flex justify-between items-center gap-4 pointer-events-auto bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-slate-100">
          
          <button 
            onClick={() => {
              setSelectedPayment(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-800 text-white rounded-full font-bold text-sm transition-colors shadow-lg"
          >
            Received Payment
          </button>
          
          <button 
            onClick={() => alert("Opening quick add menu...")}
            className="h-14 w-14 flex-shrink-0 bg-emerald-400 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg shadow-emerald-200"
          >
            <FiPlus size={28} />
          </button>
          
          <button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <FiPlus size={18} /> Bill / Invoice
          </button>
          
        </div>
      </div>

      {/* Full Screen Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-slate-50 overflow-hidden animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-50 flex flex-col h-full relative">
            
            {/* Header */}
            <div className="bg-white flex items-center p-4 border-b border-slate-200 shrink-0">
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-indigo-600 mr-4">
                <FiArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-slate-800">Record Payment In</h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-28">
              
              {/* Info Block */}
              <div className="bg-white p-4 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-indigo-600 text-sm font-semibold mb-1">
                      Received Payment #{selectedPayment?.id || 'NEW-PAYMENT'}
                    </div>
                    <div className="text-slate-600 text-sm">{selectedPayment?.date || new Date().toLocaleDateString('en-GB')}</div>
                  </div>
                  <button className="border border-slate-300 text-indigo-600 font-semibold px-4 py-1 rounded-full text-xs hover:bg-slate-50">
                    EDIT
                  </button>
                </div>
              </div>

              {/* Party Name */}
              <div className="bg-white p-4 mb-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold text-slate-700 text-sm uppercase">Party Name <span className="text-rose-500">*</span></label>
                  <div className="text-slate-500 text-sm flex items-center gap-1">
                    Current Balance: <span className="text-emerald-600 font-bold ml-1">₹ {selectedPayment ? Number(selectedPayment.amount).toLocaleString('en-IN') : '0'}</span>
                    <FiArrowDown className="text-emerald-600" size={14} />
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <FiUser size={20} />
                  </div>
                  <select 
                    defaultValue={selectedPayment?.customer || ""}
                    className="w-full pl-10 pr-10 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Party</option>
                    {uniqueCustomers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <FiChevronRight className="rotate-90" size={18} />
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-white p-4 mb-2">
                <label className="block font-bold text-slate-700 text-sm uppercase mb-3">Amount <span className="text-rose-500">*</span></label>
                <div className="relative mb-3">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <FaRupeeSign />
                  </div>
                  <input 
                    type="number" 
                    defaultValue={selectedPayment?.amount || ""} 
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-lg text-slate-800 outline-none focus:border-indigo-500 transition-colors" 
                  />
                </div>
                <div className="flex justify-center">
                  {showDiscountInput ? (
                    <div className="w-full flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaRupeeSign size={12}/></div>
                        <input 
                          type="number" 
                          placeholder="Discount Amount" 
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-indigo-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-indigo-50/30" 
                        />
                      </div>
                      <button onClick={() => { setShowDiscountInput(false); setDiscountAmount(''); }} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 rounded-lg"><FiX /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowDiscountInput(true)} className="text-indigo-600 font-semibold text-sm flex items-center gap-1">
                      <FiPlus /> Add Payment In Discount
                    </button>
                  )}
                </div>
              </div>

              {/* Sales Invoice */}
              <div className="bg-white p-4 mb-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 text-sm">Sales Invoice</h4>
                  {showInvoiceSelect ? (
                    <button onClick={() => { setShowInvoiceSelect(false); setSelectedUnpaidInvoice(''); }} className="text-rose-500 font-semibold text-sm flex items-center gap-1">
                      <FiX /> Cancel
                    </button>
                  ) : (
                    <button onClick={() => setShowInvoiceSelect(true)} className="text-indigo-600 font-semibold text-sm flex items-center gap-1">
                      <FiPlus /> Add Unpaid Sales Invoice
                    </button>
                  )}
                </div>
                
                {showInvoiceSelect && (
                   <select 
                     value={selectedUnpaidInvoice}
                     onChange={(e) => setSelectedUnpaidInvoice(e.target.value)}
                     className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg text-sm mb-4 outline-none focus:border-indigo-500 bg-indigo-50/30 font-semibold text-indigo-900"
                   >
                     <option value="" disabled>Select Unpaid Invoice</option>
                     <option value="INV-ORD-6935">#INV-ORD-6935 (₹ 500)</option>
                     <option value="INV-ORD-7021">#INV-ORD-7021 (₹ 1,200)</option>
                     <option value="INV-ORD-8822">#INV-ORD-8822 (₹ 3,400)</option>
                   </select>
                )}

                {/* Invoice Card */}
                {selectedPayment && !showInvoiceSelect && (
                  <div className="bg-white border-b border-slate-100 pb-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-800 text-base mb-1">#INV/{selectedPayment.id}</div>
                        <div className="text-slate-500 text-xs">Inv Amt: {selectedPayment.amount} • {selectedPayment.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-700 text-base mb-1">₹ {Number(selectedPayment.amount).toLocaleString('en-IN')}</div>
                        {selectedPayment.status && selectedPayment.status.toLowerCase() === 'paid' ? (
                          <div className="text-emerald-600 text-xs font-semibold flex items-center justify-end gap-1">
                            ₹ {Number(selectedPayment.amount).toLocaleString('en-IN')} Settled <FiCheckCircle size={12} />
                          </div>
                        ) : (
                          <div className="text-rose-500 text-xs font-semibold flex items-center justify-end gap-1">
                            Unsettled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Mode */}
              <div className="bg-white p-4 min-h-[150px]">
                <label className="block font-bold text-slate-700 text-sm mb-3">Payment Mode</label>
                <div className="relative border-b border-slate-300 pb-2 mb-6">
                  <select className="w-full bg-transparent text-slate-800 text-lg outline-none appearance-none cursor-pointer">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                  </select>
                  <div className="absolute right-0 top-1 text-slate-400 pointer-events-none">
                    <FiChevronRight className="rotate-90" size={20} />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button className="text-indigo-600 font-semibold text-sm flex items-center gap-1">
                    <FiPlus /> Note
                  </button>
                </div>
              </div>

            </div>
            
            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center">
              <div>
                <div className="text-slate-500 text-sm mb-1">New Party Balance</div>
                <div className="text-rose-500 font-bold text-lg flex items-center gap-1">
                  ₹ 3,000 <FiArrowUp size={16} />
                </div>
              </div>
              <button 
                onClick={() => { 
                  if (selectedPayment) {
                    dispatch(updatePaymentStatus({ id: selectedPayment.id, status: 'Paid' }));
                    alert('Payment Recorded Successfully!'); 
                  }
                  setIsPaymentModalOpen(false); 
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-12 rounded-xl text-lg shadow-lg active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><FiPlus /></span>
                Create Sales Bill / Invoice
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Party / Customer Name <span className="text-rose-500">*</span></label>
                <input type="text" placeholder="Select or type party name" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer Phone No</label>
                  <input type="text" placeholder="+91" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Billed By</label>
                  <input type="text" placeholder="Admin/Staff Name" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Added Items</label>
                {selectedItems.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm">
                        <span className="font-semibold text-slate-700">{item.name} <span className="text-slate-400 font-normal">x{item.quantity}</span></span>
                        <span className="font-bold text-slate-800">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button 
                  onClick={() => setIsInventoryDrawerOpen(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-indigo-600 font-semibold hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiPlus /> Add Items from Inventory
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Amount (₹)</label>
                  <input type="number" value={currentInvoiceTotal || ''} placeholder="0.00" disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-800 outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button onClick={() => { alert('Invoice Created Successfully!'); setIsInvoiceModalOpen(false); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Drawer */}
      {isInventoryDrawerOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-[70vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                Select Items
              </h3>
              <button onClick={() => setIsInventoryDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-2">
              {products.length === 0 && (
                <div className="text-center text-slate-500 py-10">No products available in inventory.</div>
              )}
              {products.map((item) => {
                const isSelected = selectedItems.find(i => i.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleItemSelection(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex gap-4 items-center">
                      {/* Product Image */}
                      <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                        {item.imageUrl || (item.imageUrls && item.imageUrls[0]) ? (
                          <img src={item.imageUrl || item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">No Image</span>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 leading-tight" title={item.name}>
                          {item.name}
                        </h4>
                        <span className="text-sm font-semibold text-indigo-600 mt-1 inline-block">₹{item.price}</span>
                      </div>
                      
                      {/* Selection Checkbox */}
                      <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-transparent'}`}>
                        <FiCheckCircle size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-slate-100 bg-white shrink-0">
              <button onClick={() => setIsInventoryDrawerOpen(false)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                Done Selecting ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
