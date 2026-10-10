import React, { useEffect, useState } from 'react';
import { CreditCard, Download, AlertTriangle } from 'lucide-react';
import { invoicesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);

  const fetchInvoices = () => {
    invoicesApi.list()
      .then(r => setInvoices(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, []);

  const simulatePay = async (iid: number) => {
    if (!confirm('Simulate payment for this invoice? (No real transaction)')) return;
    setPaying(iid);
    try {
      await invoicesApi.pay(iid);
      fetchInvoices();
    } finally {
      setPaying(null);
    }
  };

  const totalEarnings = invoices.reduce((s, i) => s + ((i.worker_payout as number) || 0), 0);
  const totalRevenue = invoices.reduce((s, i) => s + ((i.service_amount as number) || 0), 0);
  const totalContrib = invoices.reduce((s, i) => s + ((i.commission_amount as number) || 0) + ((i.welfare_amount as number) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('nav.payments', lang)}</h1>
        <p className="page-subtitle">{isTamil ? 'வெளிப்படையான கட்டண பதிவு' : 'Transparent payment & payout ledger'}</p>
        <span className="demo-label mt-1">Demo simulated payments only</span>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-text-secondary mb-1">{isTamil ? 'மொத்த சேவை வருவாய்' : 'Total Service Revenue'}</p>
          <p className="text-2xl font-bold text-navy">₹{totalRevenue.toFixed(0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-text-secondary mb-1">{isTamil ? 'தொழிலாளர் வருமானம்' : 'Worker Payouts'}</p>
          <p className="text-2xl font-bold text-cooperative">₹{totalEarnings.toFixed(0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-text-secondary mb-1">{isTamil ? 'கூட்டுறவு பங்களிப்பு' : 'Coop Contributions'}</p>
          <p className="text-2xl font-bold text-saffron">₹{totalContrib.toFixed(0)}</p>
        </div>
      </div>

      {/* Payment simulation notice */}
      <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-card text-xs">
        <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
        <p className="text-text-secondary">
          <strong className="text-warning">Payment Simulation Notice:</strong> All payments are simulated for demonstration.
          No real UPI, bank, or card transactions occur. Do not enter real payment credentials.
        </p>
      </div>

      {/* Commission rule */}
      <div className="card bg-navy text-white">
        <h2 className="font-bold text-white mb-3">Published Cooperative Rate Structure</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-navy-200 text-xs mb-1">Cooperative Commission</p>
            <p className="text-2xl font-bold text-cooperative-300">10%</p>
            <p className="text-xs text-navy-300">Funds cooperative operations</p>
          </div>
          <div>
            <p className="text-navy-200 text-xs mb-1">Welfare Contribution</p>
            <p className="text-2xl font-bold text-saffron-300">5%</p>
            <p className="text-xs text-navy-300">Worker health, insurance, training</p>
          </div>
          <div>
            <p className="text-navy-200 text-xs mb-1">Worker Payout</p>
            <p className="text-2xl font-bold text-white">85%</p>
            <p className="text-xs text-navy-300">Direct to worker</p>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      {loading ? (
        <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-10">
          <CreditCard size={40} className="text-border mx-auto mb-3" />
          <p className="text-text-secondary">{t('common.noData', lang)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id as number} className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold text-navy">Invoice #{inv.reference as string}</p>
                  <p className="text-xs text-text-secondary font-mono">Booking #{inv.booking_id as number}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  inv.payment_status === 'simulated_paid' ? 'bg-green-50 text-success border border-green-200' : 'bg-yellow-50 text-warning border border-yellow-200'
                }`}>
                  {inv.payment_status as string}
                </span>
              </div>

              <div className="space-y-2 text-sm border rounded-btn p-3 bg-background">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Service amount</span>
                  <span className="font-semibold">₹{inv.service_amount as number}</span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Cooperative commission ({Math.round((inv.commission_rate as number) * 100)}%)</span>
                  <span className="text-warning">−₹{inv.commission_amount as number}</span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Welfare contribution ({Math.round((inv.welfare_rate as number) * 100)}%)</span>
                  <span className="text-warning">−₹{inv.welfare_amount as number}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-cooperative">
                  <span>Worker payout</span>
                  <span>₹{inv.worker_payout as number}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {inv.payment_status !== 'simulated_paid' && user?.role === 'customer' && (
                  <button
                    className="btn-primary text-sm"
                    onClick={() => simulatePay(inv.id as number)}
                    disabled={paying === inv.id}
                  >
                    <CreditCard size={14} />
                    {isTamil ? 'கட்டணம் செலுத்து (டெமோ)' : 'Simulate Payment'}
                  </button>
                )}
                <p className="text-xs text-text-secondary self-center ml-auto">
                  {inv.paid_at ? `Paid: ${new Date(inv.paid_at as string).toLocaleDateString()}` : `Created: ${new Date(inv.created_at as string).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
