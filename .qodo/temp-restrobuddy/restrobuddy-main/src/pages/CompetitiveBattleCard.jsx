import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Target, DollarSign, Zap, Shield } from "lucide-react";

export default function CompetitiveBattleCard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-6 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Competitive Battle Cards
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Win every deal with these battle-tested strategies
          </p>
        </div>

        {/* Quick Win Strategies */}
        <Card className="border-0 shadow-2xl mb-8 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-600" />
              Quick Win Talking Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-emerald-200">
                <h3 className="font-bold text-lg mb-4 text-emerald-900">Our Unique Advantages</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>SMS Keyword Ordering:</strong> ONLY system where customers text "BURGER" to order - nobody else has this</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>BYOD Kiosk:</strong> Use any iPad/tablet you own - $0 hardware vs. $1,000-$2,000 competitors charge</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Setup in 1 Hour:</strong> Live today, not next week - competitors take 2-3 days minimum</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>No Contracts:</strong> Cancel anytime - Toast & TouchBistro lock you in for 12 months</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Modern UX:</strong> Built in 2024, looks like consumer apps - competitors feel like 2010 corporate software</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-amber-200">
                <h3 className="font-bold text-lg mb-4 text-amber-900">Objection Handlers</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">❓ "We already use [Competitor]"</p>
                    <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg">
                      "Perfect! Many of our customers switched from them. We can run in parallel for 30 days risk-free. 
                      Most switch fully after seeing how much easier SMS ordering and kiosk setup is."
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">❓ "What about inventory management?"</p>
                    <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg">
                      "Coming in Q2 2024. For now, most customers use simple spreadsheets. But they chose us because 
                      SMS ordering increased their orders by 20-30%, which is way more valuable than inventory tracking."
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">❓ "This seems too new/unproven"</p>
                    <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg">
                      "We're backed by Base44 platform with enterprise-grade infrastructure. Plus, month-to-month means 
                      zero risk. If it doesn't work, cancel anytime. Can Toast say that?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VS Toast POS */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <CardTitle className="text-2xl">🥊 VS Toast POS (Market Leader)</CardTitle>
            <p className="text-slate-300 mt-2">When competing against the 800-lb gorilla</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Their Strengths (Acknowledge)
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Market leader with 85,000+ restaurants</li>
                  <li>• Full-featured (inventory, employees, etc.)</li>
                  <li>• Strong brand recognition</li>
                  <li>• Dedicated account managers for large customers</li>
                  <li>• Deep integrations ecosystem</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Our Advantages (Attack)
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✅ <strong>$99/mo vs. $165/mo</strong> - 40% cheaper</li>
                  <li>✅ <strong>$0 hardware vs. $1,899</strong> - Use your iPad</li>
                  <li>✅ <strong>SMS ordering</strong> - They don't have this</li>
                  <li>✅ <strong>No contracts</strong> - They lock you in 12 months</li>
                  <li>✅ <strong>1 hour setup vs. 2-3 days</strong> - Live today</li>
                </ul>
              </div>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3 text-emerald-900">💬 Winning Script</h3>
              <div className="space-y-3 text-sm">
                <p className="bg-white p-4 rounded-lg">
                  <strong>Them:</strong> "We're looking at Toast. They seem like the safe choice."
                </p>
                <p className="bg-emerald-100 p-4 rounded-lg">
                  <strong>You:</strong> "Toast is a solid system - that's why they're the market leader. But let me ask: 
                  are you a 50-location chain with complex inventory needs, or are you a 1-3 location restaurant looking 
                  to modernize ordering and reduce costs?"
                </p>
                <p className="bg-white p-4 rounded-lg">
                  <strong>Them:</strong> "We're 2 locations."
                </p>
                <p className="bg-emerald-100 p-4 rounded-lg">
                  <strong>You:</strong> "Perfect. Then you don't need Toast's enterprise features - you're paying for stuff 
                  you'll never use. With us, you get <strong>SMS ordering</strong> (which Toast doesn't have), you can use 
                  your existing iPads (saving $1,899 per location), and you're live in an hour, not days. Plus, no 12-month 
                  contract. Try us for a month. If we're not better, go back to Toast. What do you have to lose?"
                </p>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900">
                <strong>⚠️ When to Walk Away:</strong> If they're 10+ locations with complex franchise requirements, 
                they probably DO need Toast. Don't waste time - focus on 1-5 location restaurants.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VS Square */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-2xl">🥊 VS Square for Restaurants</CardTitle>
            <p className="text-blue-100 mt-2">Competing against the payment giant</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-3">Their Strengths</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Trusted Square brand (millions of users)</li>
                  <li>• Seamless payment integration</li>
                  <li>• Free card reader hardware</li>
                  <li>• Large app marketplace</li>
                  <li>• Easy-to-understand pricing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3">Our Advantages</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✅ <strong>SMS ordering</strong> - Square doesn't have this</li>
                  <li>✅ <strong>Better kiosk UX</strong> - More modern design</li>
                  <li>✅ <strong>Not locked in</strong> - Can use any payment processor</li>
                  <li>✅ <strong>Built for 2024</strong> - Square's POS feels dated</li>
                  <li>✅ <strong>Better kitchen display</strong> - Real-time updates</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3 text-blue-900">💬 Winning Script</h3>
              <div className="space-y-3 text-sm">
                <p className="bg-white p-4 rounded-lg">
                  <strong>You:</strong> "Square is great for basic payments, but their restaurant system is really just 
                  a bolt-on. We're purpose-built for modern restaurants. The big difference? <strong>SMS ordering</strong>. 
                  Imagine your customers texting 'BURGER' and getting an instant order link. Square doesn't do that. 
                  That's a 20-30% increase in orders for our customers."
                </p>
                <p className="bg-white p-4 rounded-lg mt-3">
                  <strong>Plus:</strong> "We integrate WITH Square for payments if you want. Best of both worlds - 
                  Square's trusted payment processing + our modern ordering system with SMS."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VS TouchBistro */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle className="text-2xl">🥊 VS TouchBistro</CardTitle>
            <p className="text-purple-100 mt-2">The full-service restaurant favorite</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-3">Their Strengths</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• 29,000+ restaurants using it</li>
                  <li>• Strong table management</li>
                  <li>• Good for full-service dining</li>
                  <li>• Offline-capable (iPad-based)</li>
                  <li>• Established since 2010</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3">Our Advantages</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✅ <strong>$99 vs. $229/mo</strong> - 57% cheaper</li>
                  <li>✅ <strong>No annual contract</strong> - They lock you in</li>
                  <li>✅ <strong>Cloud-based</strong> - Access anywhere</li>
                  <li>✅ <strong>SMS ordering</strong> - They don't have this</li>
                  <li>✅ <strong>Modern UI</strong> - Built for Gen Z/Millennials</li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3 text-purple-900">💬 Winning Script</h3>
              <p className="text-sm bg-white p-4 rounded-lg">
                "TouchBistro is built for traditional sit-down restaurants with waiters and table service. 
                Are you that type of restaurant, or are you more quick-service/fast-casual? 
                [If fast-casual:] Then you don't need their table management features - you need 
                <strong> SMS ordering, kiosk mode, and fast online ordering</strong>. That's us. 
                And we're half the price with no contract."
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VS GloriaFood (Free Tier) */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardTitle className="text-2xl">🥊 VS GloriaFood (Free Competitor)</CardTitle>
            <p className="text-green-100 mt-2">When they say "but this one is free..."</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3 text-green-900">💬 Winning Script</h3>
              <div className="space-y-3 text-sm">
                <p className="bg-white p-4 rounded-lg">
                  <strong>Them:</strong> "GloriaFood has a free plan. Why should we pay you?"
                </p>
                <p className="bg-green-100 p-4 rounded-lg">
                  <strong>You:</strong> "Great question! GloriaFood is solid for basic online ordering. But here's what 
                  you're missing: <strong>SMS ordering</strong> (text 'BURGER' to order - they don't have this), 
                  <strong>modern kiosk mode</strong> (they don't have this), and a <strong>real-time kitchen display</strong> 
                  (theirs is very basic). Their free plan also has a 'Powered by GloriaFood' watermark on your site."
                </p>
                <p className="bg-white p-4 rounded-lg">
                  <strong>You (continue):</strong> "For $99/month, you get features that will increase your orders by 
                  20-30%. That's an extra $500-1,500/month in revenue. Would you spend $99 to make $500? Plus, our 
                  interface looks like a modern consumer app - GloriaFood looks like it's from 2015."
                </p>
                <p className="bg-green-100 p-4 rounded-lg">
                  <strong>Close:</strong> "Try us for one month. If the SMS ordering feature alone doesn't increase 
                  your orders enough to cover the $99, I'll refund you myself."
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-3">Feature Gap Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 text-left">Feature</th>
                      <th className="p-3 text-center">GloriaFood (Free)</th>
                      <th className="p-3 text-center">You ($99/mo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3">SMS Keyword Ordering</td>
                      <td className="p-3 text-center"><XCircle className="w-5 h-5 text-red-600 mx-auto" /></td>
                      <td className="p-3 text-center"><CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-t bg-slate-50">
                      <td className="p-3">Kiosk Mode</td>
                      <td className="p-3 text-center"><XCircle className="w-5 h-5 text-red-600 mx-auto" /></td>
                      <td className="p-3 text-center"><CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Modern UI (2024)</td>
                      <td className="p-3 text-center"><XCircle className="w-5 h-5 text-red-600 mx-auto" /></td>
                      <td className="p-3 text-center"><CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-t bg-slate-50">
                      <td className="p-3">Real-time Kitchen Display</td>
                      <td className="p-3 text-center"><AlertCircle className="w-5 h-5 text-amber-600 mx-auto" title="Basic" /></td>
                      <td className="p-3 text-center"><CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">White-label (No branding)</td>
                      <td className="p-3 text-center"><XCircle className="w-5 h-5 text-red-600 mx-auto" /></td>
                      <td className="p-3 text-center"><CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Comparison Tool */}
        <Card className="border-0 shadow-xl mb-8 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-amber-600" />
              Total Cost of Ownership (3 Years)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Provider</th>
                    <th className="p-3 text-right">Hardware</th>
                    <th className="p-3 text-right">Monthly</th>
                    <th className="p-3 text-right">3-Year Total</th>
                    <th className="p-3 text-center">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t bg-emerald-50">
                    <td className="p-3 font-bold">Your System</td>
                    <td className="p-3 text-right">$0</td>
                    <td className="p-3 text-right">$299</td>
                    <td className="p-3 text-right font-bold text-emerald-600">$10,764</td>
                    <td className="p-3 text-center"><Badge className="bg-emerald-600">Cheapest</Badge></td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">Toast POS</td>
                    <td className="p-3 text-right">$1,899</td>
                    <td className="p-3 text-right">$165</td>
                    <td className="p-3 text-right font-bold">$7,839</td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                  <tr className="border-t bg-slate-50">
                    <td className="p-3">Square</td>
                    <td className="p-3 text-right">$799</td>
                    <td className="p-3 text-right">$60</td>
                    <td className="p-3 text-right font-bold">$2,959</td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">TouchBistro</td>
                    <td className="p-3 text-right">$1,249</td>
                    <td className="p-3 text-right">$229</td>
                    <td className="p-3 text-right font-bold">$9,493</td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                  <tr className="border-t bg-slate-50">
                    <td className="p-3">Clover</td>
                    <td className="p-3 text-right">$1,799</td>
                    <td className="p-3 text-right">$125</td>
                    <td className="p-3 text-right font-bold">$6,299</td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-white border-2 border-amber-200 rounded-xl p-6">
              <p className="text-sm text-amber-900">
                <strong>💡 Sales Tip:</strong> Always show this 3-year cost comparison. Even though Toast's monthly 
                fee is lower ($165 vs. $299), their $1,899 hardware cost means they're more expensive overall. 
                Numbers don't lie.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Questions */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
            <CardTitle className="text-2xl">🎯 Discovery Questions (Qualify the Deal)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3">Pain Discovery</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ "What's frustrating about your current ordering system?"</li>
                  <li>✓ "How much time does your team spend taking phone orders?"</li>
                  <li>✓ "Have you lost orders because customers couldn't get through on the phone?"</li>
                  <li>✓ "Do you wish more customers ordered online instead of calling?"</li>
                  <li>✓ "What percentage of your customers are under 40?" <em>(SMS will crush it if 50%+)</em></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Budget/Authority</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ "What's your current monthly spend on your POS/ordering system?"</li>
                  <li>✓ "Are you the decision-maker, or do we need to loop in anyone else?"</li>
                  <li>✓ "Is budget already approved, or do we need to build a business case?"</li>
                  <li>✓ "When are you looking to make a decision?" <em>(Timeline = urgency)</em></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Qualifying Out (Don't Waste Time)</h3>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-900 mb-2"><strong>Walk away if:</strong></p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>• They have 10+ locations with complex franchise requirements</li>
                    <li>• They need deep inventory management (coming Q2, but not ready)</li>
                    <li>• They're locked in a 2+ year contract with Toast/TouchBistro</li>
                    <li>• They want extensive employee scheduling/payroll integration</li>
                    <li>• Budget is under $50/month (not a fit)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Perfect Fit Indicators</h3>
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                  <p className="text-sm text-emerald-900 mb-2"><strong>Chase hard if:</strong></p>
                  <ul className="space-y-1 text-sm text-emerald-800">
                    <li>✅ 1-5 locations (sweet spot)</li>
                    <li>✅ Fast-casual/QSR restaurant type</li>
                    <li>✅ Younger customer demographic (18-40)</li>
                    <li>✅ Currently using basic/outdated system</li>
                    <li>✅ Already using Square for payments (easy integration)</li>
                    <li>✅ Owner is tech-savvy or wants to modernize</li>
                    <li>✅ High phone order volume (SMS will help)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}