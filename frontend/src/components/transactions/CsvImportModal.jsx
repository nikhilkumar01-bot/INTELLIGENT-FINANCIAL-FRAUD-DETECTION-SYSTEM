import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';

const SAMPLE_CSV = `transactionId,customerId,amount,channel,customerAvgAmount,txHour,txVelocity1h,isNewDevice,isNewLocation,merchant
TX-IMP-901,CUST-1002,48.50,CARD,45.00,12,1,0,0,Whole Foods Market
TX-IMP-902,CUST-1005,14200.00,WIRE_TRANSFER,180.00,3,4,1,1,Offshore Crypto Ex
TX-IMP-903,CUST-1010,250.00,ONLINE,200.00,15,1,0,0,Amazon Store
TX-IMP-904,CUST-1015,3.20,ONLINE,80.00,19,8,1,0,Digital Micro Billing`;

export const CsvImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please provide or paste CSV content.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must contain a header line and at least one data row.');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const transactions = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx];
        });

        if (row.amount) {
          transactions.push({
            transactionId: row.transactionId,
            customerId: row.customerId,
            amount: parseFloat(row.amount),
            channel: row.channel || 'CARD',
            customerAvgAmount: parseFloat(row.customerAvgAmount || row.amount),
            txHour: parseInt(row.txHour || '12'),
            txVelocity1h: parseInt(row.txVelocity1h || '1'),
            isNewDevice: parseInt(row.isNewDevice || '0'),
            isNewLocation: parseInt(row.isNewLocation || '0'),
            merchant: row.merchant || 'Imported Merchant'
          });
        }
      }

      const res = await api.importTransactions(transactions);
      if (res.success) {
        setSuccessMsg(res.message);
        if (onImportSuccess) onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'CSV parse and validation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Synthetic Dataset (CSV Batch)">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Upload or paste a comma-separated CSV with headers: <code>transactionId, customerId, amount, channel, customerAvgAmount, txHour, txVelocity1h, isNewDevice, isNewLocation, merchant</code>
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Upload CSV File</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer border border-[#1F293D] rounded-xl p-2 bg-[#0E1322]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">Or Paste CSV Content Directly</label>
            <button
              type="button"
              onClick={() => setCsvText(SAMPLE_CSV)}
              className="text-[11px] text-indigo-400 hover:underline"
            >
              Insert Sample Batch
            </button>
          </div>
          <textarea
            rows="6"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="transactionId,customerId,amount,channel..."
            className="w-full p-3 font-mono text-xs bg-[#0E1322] border border-[#1F293D] rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !csvText.trim()}
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Processing Batch...' : 'Process & Score Batch'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
