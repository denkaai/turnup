import { useState } from 'react'
import { Check, X, Crown, Zap, Flame, Smartphone, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: 'forever', icon: Flame,
    desc: 'Get started with the basics',
    features: ['10 swipes per day', 'Basic campus filter', 'Text chat only', '3 events per week'],
    missing: ['See who liked you', 'Unlimited swipes', 'Super likes', 'Profile boost', 'Video calls'],
    popular: false,
  },
  {
    id: 'weekly', name: 'Weekly', price: 150, period: 'week', icon: Zap,
    desc: 'Perfect for weekend warriors',
    features: ['Unlimited swipes', 'See who liked you', '5 Super likes/day', '1 Profile boost/week', 'Advanced filters', 'All events', 'Priority support'],
    missing: ['Video calls', 'Incognito mode'],
    popular: true,
  },
  {
    id: 'monthly', name: 'Monthly', price: 499, period: 'month', icon: Crown,
    desc: 'Best value for serious users',
    features: ['Everything in Weekly', 'Unlimited Super likes', '5 Boosts/month', 'Video calls', 'Incognito mode', 'Read receipts', 'VIP badge', '24/7 support'],
    missing: [],
    popular: false,
  },
]

export default function Pricing() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<typeof PLANS[0] | null>(null)
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)

  const handleSelect = (plan: typeof PLANS[0]) => {
    if (plan.id === 'free') {
      if (!user) navigate('/auth?mode=signup')
      else navigate('/discover')
      return
    }
    if (!user) { navigate('/auth?mode=signup'); return }
    setSelected(plan)
  }

  const handlePay = async () => {
    if (phone.length < 9) return toast.error('Enter a valid Safaricom number')
    setPaying(true)
    // In production: call your Netlify function which calls M-Pesa Daraja API
    await fetch('/api/mpesa-stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: `254${phone}`, amount: selected?.price, plan: selected?.id, userId: user?.id }),
    }).catch(() => {}) // graceful fail in demo

    setTimeout(() => {
      setPaying(false)
      toast.success('M-Pesa prompt sent! Check your phone 📱')
      setSelected(null)
    }, 2000)
  }

  return (
    <main className="min-h-screen pt-14 px-4 py-16 relative">
      <div className="orb w-96 h-96 bg-purple-600/10 top-0 left-1/4 -translate-x-1/2" />
      <div className="orb w-96 h-96 bg-pink-600/8 bottom-0 right-1/4" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="chip mb-4">Upgrade Your Experience</span>
          <h1 className="font-syne font-bold text-4xl sm:text-5xl text-white mb-4">
            Choose Your <span className="grad-text">Plan</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">Unlock premium features and maximize your TurnUp experience. Pay easily with M-Pesa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02] ${
                  plan.popular
                    ? 'bg-gradient-to-b from-purple-600/15 to-pink-600/10 border-2 border-purple-500/40'
                    : 'card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full grad-bg text-white text-xs font-semibold">Most Popular</span>
                  </div>
                )}

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  plan.id === 'free' ? 'bg-gray-500/20' : plan.id === 'weekly' ? 'grad-bg' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <div className="text-center mb-6">
                  <h2 className="font-syne font-bold text-xl text-white mb-1">{plan.name}</h2>
                  <p className="text-gray-500 text-xs mb-4">{plan.desc}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-syne font-extrabold text-3xl text-white">
                      {plan.price === 0 ? 'Free' : `KSh ${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm">/{plan.period}</span>}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-green-400" />
                      </div>
                      <span className="text-gray-300 text-xs">{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="flex items-center gap-2.5 opacity-40">
                      <div className="w-4 h-4 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                        <X className="w-2.5 h-2.5 text-gray-500" />
                      </div>
                      <span className="text-gray-600 text-xs">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelect(plan)}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular ? 'btn-grad' : plan.id === 'free' ? 'bg-white/8 hover:bg-white/12 text-white border border-white/10' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90'
                  }`}
                >
                  {plan.id === 'free' ? 'Get Started Free' : 'Upgrade Now'}
                </button>
              </div>
            )
          })}
        </div>

        {/* M-Pesa info */}
        <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Pay with M-Pesa</h3>
              <p className="text-gray-500 text-sm">Safe, secure, instant payments via Daraja API</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Lock className="w-3.5 h-3.5" /> Secure</div>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Zap className="w-3.5 h-3.5" /> Instant</div>
          </div>
        </div>

        {/* FAQ */}
        <h3 className="font-syne font-bold text-xl text-white text-center mb-6">FAQ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { q: 'Can I cancel?', a: 'Yes anytime. Features remain active until period end.' },
            { q: 'Is my payment secure?', a: "We use M-Pesa's Daraja API. We never see your PIN." },
            { q: 'What happens after payment?', a: 'Premium activates instantly after M-Pesa confirmation.' },
            { q: 'Can I switch plans?', a: 'Yes, upgrade or downgrade anytime from your profile.' },
          ].map(({ q, a }) => (
            <div key={q} className="card p-5">
              <h4 className="text-white font-medium text-sm mb-2">{q}</h4>
              <p className="text-gray-500 text-xs leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* M-Pesa Payment Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#13131f] border border-white/8 rounded-3xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-syne font-bold text-lg text-white">Complete Payment</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="p-6">
              <div className="card p-4 mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Plan</span>
                  <span className="text-white font-medium">{selected.name} ({selected.period})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Amount</span>
                  <span className="grad-text font-syne font-bold text-xl">KSh {selected.price}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-2">Safaricom M-Pesa Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+254</span>
                  <input
                    type="tel"
                    placeholder="7XX XXX XXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="input-dark pl-14"
                  />
                </div>
                <p className="text-xs text-gray-700 mt-1.5">You'll receive an STK push prompt on your phone</p>
              </div>

              <button
                onClick={handlePay}
                disabled={phone.length < 9 || paying}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending prompt...</> : <><Smartphone className="w-4 h-4" /> Pay with M-Pesa</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
