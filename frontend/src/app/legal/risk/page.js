// Risk Disclosure page
import { NavBar } from '@/components/landing/NavBar';

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-red-600 dark:text-red-400">
              Risk Disclosure
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 15, 2024
            </p>
            
            {/* Important Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">
                    HIGH-RISK INVESTMENT WARNING
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mt-2 text-sm">
                    Cryptocurrency trading and arbitrage strategies involve substantial risk of loss. 
                    Only invest what you can afford to lose completely.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            
            {/* General Risk Disclosure */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. General Risk Disclosure</h2>
              <p>
                Trading in cryptocurrency derivatives, including perpetual futures and engaging 
                in arbitrage strategies, carries a high level of risk and may not be suitable 
                for all investors. Before deciding to trade, you should carefully consider your 
                investment objectives, level of experience, and risk appetite.
              </p>
              <p>
                <strong>Key Points:</strong>
              </p>
              <ul className="space-y-2">
                <li>Past performance is not indicative of future results</li>
                <li>You may lose some or all of your invested capital</li>
                <li>Leverage amplifies both potential gains and losses</li>
                <li>Market conditions can change rapidly and unpredictably</li>
                <li>Technical failures may result in losses</li>
              </ul>
            </section>

            {/* Market Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Market Risks</h2>
              
              <h3 className="text-xl font-semibold">Price Volatility</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">
                  Cryptocurrency prices are extremely volatile and can change dramatically in short periods.
                </p>
              </div>
              <ul className="space-y-2">
                <li>Price swings of 10-50% in a single day are common</li>
                <li>Flash crashes can occur with little to no warning</li>
                <li>Market manipulation by large holders (&quot;whales&quot;) is possible</li>
                <li>News events can cause immediate and severe price movements</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Liquidity Risk</h3>
              <ul className="space-y-2">
                <li>Markets may lack sufficient liquidity during stress periods</li>
                <li>Large orders may move prices significantly</li>
                <li>Some assets may become completely illiquid</li>
                <li>Bid-ask spreads can widen dramatically during volatility</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Funding Rate Risk</h3>
              <ul className="space-y-2">
                <li>Funding rates can change rapidly and unpredictably</li>
                <li>High funding rates may not persist as expected</li>
                <li>Rate convergence across exchanges may eliminate arbitrage opportunities</li>
                <li>Funding payments occur every 8 hours and can accumulate quickly</li>
              </ul>
            </section>

            {/* Operational Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Operational Risks</h2>
              
              <h3 className="text-xl font-semibold">Exchange Risks</h3>
              <ul className="space-y-2">
                <li><strong>Exchange Failure:</strong> Exchanges may become insolvent or cease operations</li>
                <li><strong>Security Breaches:</strong> Hacking incidents may result in fund losses</li>
                <li><strong>Withdrawal Restrictions:</strong> Exchanges may freeze withdrawals during stress</li>
                <li><strong>Regulatory Action:</strong> Exchanges may be shut down by regulators</li>
                <li><strong>Technical Issues:</strong> Platform outages may prevent trading</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Execution Risks</h3>
              <ul className="space-y-2">
                <li><strong>Slippage:</strong> Orders may execute at worse prices than expected</li>
                <li><strong>Partial Fills:</strong> Large orders may only be partially executed</li>
                <li><strong>Network Congestion:</strong> Blockchain delays may affect timing</li>
                <li><strong>API Failures:</strong> Automated trading may malfunction</li>
                <li><strong>Timing Delays:</strong> Arbitrage opportunities may disappear before execution</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Technology Risks</h3>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-orange-800 dark:text-orange-200">
                  Our platform depends on complex technology that may fail or be compromised.
                </p>
              </div>
              <ul className="space-y-2">
                <li>Internet connectivity issues may prevent access</li>
                <li>Software bugs may cause unexpected behavior</li>
                <li>Cyber attacks may compromise platform security</li>
                <li>Data feed errors may provide incorrect information</li>
              </ul>
            </section>

            {/* Arbitrage-Specific Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Arbitrage Strategy Risks</h2>
              
              <h3 className="text-xl font-semibold">Convergence Risk</h3>
              <p>
                Arbitrage strategies assume that price differences between exchanges will converge. 
                However, this may not happen due to:
              </p>
              <ul className="space-y-2">
                <li>Persistent market inefficiencies</li>
                <li>Exchange-specific factors affecting prices</li>
                <li>Liquidity constraints preventing convergence</li>
                <li>Regulatory differences between exchanges</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Capital Efficiency Risk</h3>
              <ul className="space-y-2">
                <li>Funds may be tied up for extended periods</li>
                <li>Margin requirements may increase unexpectedly</li>
                <li>Opportunity costs of capital allocation</li>
                <li>Funding costs may exceed arbitrage profits</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Basis Risk</h3>
              <ul className="space-y-2">
                <li>Perpetual futures may not track spot prices perfectly</li>
                <li>Funding mechanism effectiveness may vary</li>
                <li>Index calculation differences between exchanges</li>
                <li>Settlement and marking disparities</li>
              </ul>
            </section>

            {/* Regulatory Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Regulatory and Legal Risks</h2>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-purple-800 dark:text-purple-200">
                  The regulatory landscape for cryptocurrencies is rapidly evolving and uncertain.
                </p>
              </div>

              <h3 className="text-xl font-semibold mt-4">Regulatory Changes</h3>
              <ul className="space-y-2">
                <li>New regulations may restrict or prohibit trading activities</li>
                <li>Tax implications may change unexpectedly</li>
                <li>Compliance costs may increase significantly</li>
                <li>Cross-border trading may become restricted</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Legal Uncertainties</h3>
              <ul className="space-y-2">
                <li>Unclear legal status of digital assets in some jurisdictions</li>
                <li>Potential classification changes affecting trading</li>
                <li>Enforcement actions by regulatory authorities</li>
                <li>Limited legal recourse in case of disputes</li>
              </ul>
            </section>

            {/* Financial Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Financial and Leverage Risks</h2>
              
              <h3 className="text-xl font-semibold">Leverage Amplification</h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 font-semibold">
                  🚨 Leverage magnifies both profits and losses exponentially
                </p>
              </div>
              <ul className="space-y-2">
                <li>Small adverse movements can result in total loss</li>
                <li>Margin calls may force position closure at losses</li>
                <li>Leverage ratios may change without notice</li>
                <li>Interest costs on borrowed funds accumulate continuously</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Margin Requirements</h3>
              <ul className="space-y-2">
                <li>Initial and maintenance margin requirements may increase</li>
                <li>Margin calls must be met promptly or positions will be liquidated</li>
                <li>Available margin may decrease due to unrealized losses</li>
                <li>Cross-margining may affect unrelated positions</li>
              </ul>
            </section>

            {/* Counterparty Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Counterparty Risks</h2>
              
              <ul className="space-y-2">
                <li><strong>Exchange Insolvency:</strong> Exchanges may become unable to meet obligations</li>
                <li><strong>Custodial Risk:</strong> Funds held by exchanges are not protected by deposit insurance</li>
                <li><strong>Segregation Risk:</strong> Customer funds may not be properly segregated</li>
                <li><strong>Bankruptcy Risk:</strong> Customer assets may be at risk in bankruptcy proceedings</li>
                <li><strong>Operational Failure:</strong> Exchange systems may fail causing losses</li>
              </ul>
            </section>

            {/* Risk Management */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Risk Management Recommendations</h2>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-semibold">
                  💡 While risks cannot be eliminated, they can be managed
                </p>
              </div>

              <h3 className="text-xl font-semibold mt-4">Essential Practices</h3>
              <ul className="space-y-2">
                <li><strong>Position Sizing:</strong> Never risk more than you can afford to lose completely</li>
                <li><strong>Diversification:</strong> Spread risk across multiple exchanges and strategies</li>
                <li><strong>Stop Losses:</strong> Set and adhere to strict loss limits</li>
                <li><strong>Regular Monitoring:</strong> Actively monitor positions and market conditions</li>
                <li><strong>Capital Reserves:</strong> Maintain adequate reserves for margin calls</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Best Practices</h3>
              <ul className="space-y-2">
                <li>Start with small position sizes to gain experience</li>
                <li>Keep detailed records of all trading activities</li>
                <li>Stay informed about market developments and risks</li>
                <li>Regularly review and update risk management procedures</li>
                <li>Consider seeking professional financial advice</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Important Disclaimers</h2>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <p className="font-semibold mb-3">Please read carefully:</p>
                <ul className="space-y-2 text-sm">
                  <li>• This risk disclosure is not exhaustive and other risks may exist</li>
                  <li>• We do not provide investment, financial, or trading advice</li>
                  <li>• All trading decisions are your sole responsibility</li>
                  <li>• We make no guarantees about platform performance or profitability</li>
                  <li>• You should consult with qualified professionals before trading</li>
                  <li>• By using our platform, you acknowledge understanding these risks</li>
                </ul>
              </div>

              <div className="text-center mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-bold text-red-800 dark:text-red-200 text-lg">
                  IF YOU DO NOT UNDERSTAND THESE RISKS OR CANNOT AFFORD LOSSES,
                  <br />
                  DO NOT USE OUR PLATFORM
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">10. Questions or Concerns</h2>
              
              <p>
                If you have questions about these risks or need clarification, please contact us 
                before using our platform:
              </p>
              
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> risk@aequilibra.com</p>
                <p><strong>Support:</strong> support@aequilibra.com</p>
                <p><strong>Legal:</strong> legal@aequilibra.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
