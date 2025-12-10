'use client';

import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-950 to-blue-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Completely Free.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Here&apos;s How.
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We believe the best trading tools should be accessible to everyone.
              Here&apos;s how we keep TailSharp free.
            </p>
          </div>
        </div>
      </section>

      {/* How We Make Money Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How We Make Money
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Transparency is core to our values. Here&apos;s exactly how TailSharp sustains itself.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Kalshi Builder Program */}
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 group">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                  You pay: $0
                </span>
              </div>

              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">Kalshi Builder Program</h3>
              <p className="text-gray-400 leading-relaxed">
                We&apos;re part of Kalshi&apos;s official Builder Program. When you trade through TailSharp,
                Kalshi rewards us for bringing volume to their platform. You pay nothing extra - Kalshi pays us.
              </p>
            </div>

            {/* Card 2: Optional Pro Features */}
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                  Optional
                </span>
              </div>

              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-white">Optional Pro Features</h3>
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">Coming Soon</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Advanced analytics, priority notifications, and API access for power users.
                Basic copy trading is always free.
              </p>
            </div>

            {/* Card 3: Trader Tips */}
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-pink-500/50 transition-all duration-300 group">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-pink-500/20 text-pink-400 text-xs font-semibold rounded-full">
                  10% fee
                </span>
              </div>

              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">Trader Tips</h3>
              <p className="text-gray-400 leading-relaxed">
                Love a trader&apos;s calls? Send them a tip to show appreciation.
                We take a small 10% platform fee to keep the lights on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We'll Never Do Section */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What We&apos;ll Never Do
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Your trust is everything. Here&apos;s what we promise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ),
                title: 'Sell Your Data',
                description: 'Your trading data and personal information stays private. Period.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Hidden Fees',
                description: 'No surprise charges. What you see is what you get.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Front-Run Trades',
                description: 'We never trade against you or use your data for our benefit.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Spam You',
                description: 'No marketing emails unless you opt in. We respect your inbox.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Hold Your Funds',
                description: 'We\'re non-custodial. Your money stays in your Kalshi account at all times.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-red-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Incentives Are Aligned Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500/10 via-gray-900 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-8 sm:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Our Incentives Are Aligned
              </h2>
              <p className="text-gray-400 text-lg">
                We only succeed when you trade more. That means we&apos;re motivated to:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                'Find you the best traders to copy',
                'Execute copies quickly and accurately',
                'Build tools that help you win',
                'Keep improving the platform',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-900/50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-300 leading-relaxed">
                The more you win, the more you trade.{' '}
                <span className="text-emerald-400">The more you trade, the more we earn from Kalshi.</span>{' '}
                Everyone wins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Copy Trading Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How Copy Trading Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Three simple steps to start copying winning traders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Find Traders',
                description: 'Browse our leaderboard to find traders with proven track records. See their win rate, ROI, and trading style.',
                color: 'emerald',
              },
              {
                step: '02',
                title: 'Set Your Rules',
                description: 'Choose how much to invest per trade, set daily limits, and pick which markets to copy. You stay in control.',
                color: 'blue',
              },
              {
                step: '03',
                title: 'Auto-Copy',
                description: 'When your trader makes a move, we automatically execute the same trade in your Kalshi account. Real-time, hands-free.',
                color: 'purple',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className={`absolute -top-4 -left-4 text-6xl font-bold text-${item.color}-500/10`}>
                  {item.step}
                </div>
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 h-full">
                  <div className={`w-10 h-10 bg-${item.color}-500/20 rounded-lg flex items-center justify-center text-${item.color}-400 font-bold mb-4`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'Is TailSharp really free?',
                answer: 'Yes! Basic copy trading is completely free. We make money through the Kalshi Builder Program - when you trade, Kalshi pays us a referral fee. You pay the same trading fees you would normally pay on Kalshi.',
              },
              {
                question: 'Do I need to connect my Kalshi account?',
                answer: 'Yes, you\'ll connect your Kalshi account via API keys. This allows us to execute trades on your behalf when a trader you\'re following makes a move. Your funds stay in your Kalshi account at all times.',
              },
              {
                question: 'Can I lose money?',
                answer: 'Yes. Copy trading involves real trades with real money. Past performance doesn\'t guarantee future results. Always set appropriate limits and only invest what you can afford to lose.',
              },
              {
                question: 'How fast are copied trades executed?',
                answer: 'Trades are executed in near real-time, typically within seconds of the original trade. However, market conditions and liquidity can affect execution.',
              },
              {
                question: 'Can I stop copying a trader anytime?',
                answer: 'Absolutely. You can stop copying any trader instantly from your dashboard. Existing positions remain open until you close them manually.',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-800/50 transition-colors">
                  <span className="text-lg font-medium text-white">{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-gray-400">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Copy Trading?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of traders already using TailSharp to follow the best prediction market traders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/leaderboard"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Browse Top Traders
              </Link>
              <Link
                href="/"
                className="px-8 py-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
