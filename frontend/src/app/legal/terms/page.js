// Terms of Service page
import { NavBar } from '@/components/landing/NavBar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: September 9, 2025
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p>
                Welcome to Aequilibra. These Terms of Service
                (&quot;Terms&quot;) govern your use of our platform, website,
                and services (collectively, the &quot;Service&quot;) operated by
                Aequilibra.
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by
                these Terms. If you disagree with any part of these terms, then
                you may not access the Service.
              </p>
            </section>

            {/* Definitions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Definitions</h2>
              <ul className="space-y-2">
                <li>
                  <strong>&quot;Platform&quot;</strong> refers to the Aequilibra
                  web application and associated services.
                </li>
                <li>
                  <strong>&quot;User&quot;</strong> refers to any individual or
                  entity using our Service.
                </li>
                <li>
                  <strong>&quot;Trading&quot;</strong> refers to the execution
                  of cryptocurrency arbitrage strategies.
                </li>
                <li>
                  <strong>&quot;Exchange&quot;</strong> refers to third-party
                  cryptocurrency trading platforms.
                </li>
                <li>
                  <strong>&quot;Funding Rate&quot;</strong> refers to periodic
                  payments between long and short position holders.
                </li>
              </ul>
            </section>

            {/* Eligibility */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Eligibility</h2>
              <p>To use our Service, you must:</p>
              <ul className="space-y-2">
                <li>
                  Be at least 18 years old or the age of majority in your
                  jurisdiction
                </li>
                <li>Have the legal capacity to enter into these Terms</li>
                <li>
                  Not be located in a jurisdiction where the Service is
                  prohibited
                </li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
              <p>
                We reserve the right to refuse service to anyone for any reason
                at any time.
              </p>
            </section>

            {/* Account Registration */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Account Registration</h2>
              <p>
                When you create an account with us, you must provide information
                that is accurate, complete, and current at all times. You are
                responsible for safeguarding the password and all activities
                that occur under your account.
              </p>
              <p>You agree to:</p>
              <ul className="space-y-2">
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
                <li>Provide accurate and up-to-date information</li>
              </ul>
            </section>

            {/* Use of Service */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Use of Service</h2>
              <p>
                Our Service provides tools and information for cryptocurrency
                arbitrage trading. You acknowledge and agree that:
              </p>
              <ul className="space-y-2">
                <li>All trading decisions are your own responsibility</li>
                <li>We do not provide investment advice</li>
                <li>Past performance does not guarantee future results</li>
                <li>Trading involves substantial risk of loss</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">
                Prohibited Activities
              </h3>
              <p>You may not:</p>
              <ul className="space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Transmit any viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper working of the Service</li>
                <li>Use automated scripts or bots without permission</li>
              </ul>
            </section>

            {/* Trading Risks */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Trading Risks</h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ Important Risk Disclosure
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                  Cryptocurrency trading involves substantial risk of loss and
                  may not be suitable for all investors.
                </p>
              </div>

              <p>Specific risks include but are not limited to:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Market Risk:</strong> Cryptocurrency prices are highly
                  volatile
                </li>
                <li>
                  <strong>Liquidity Risk:</strong> Markets may lack sufficient
                  liquidity
                </li>
                <li>
                  <strong>Execution Risk:</strong> Orders may not execute as
                  expected
                </li>
                <li>
                  <strong>Technical Risk:</strong> Platform outages or
                  connectivity issues
                </li>
                <li>
                  <strong>Regulatory Risk:</strong> Changes in laws and
                  regulations
                </li>
                <li>
                  <strong>Counterparty Risk:</strong> Third-party exchange
                  failures
                </li>
              </ul>

              <p>
                You should only trade with money you can afford to lose and
                should carefully consider your investment objectives, level of
                experience, and risk appetite.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and
                functionality are and will remain the exclusive property of
                Aequilibra and its licensors. The Service is protected by
                copyright, trademark, and other laws.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection
                with any product or service without our prior written consent.
              </p>
            </section>

            {/* Privacy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Privacy</h2>
              <p>
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the Service, to
                understand our practices.
              </p>
            </section>

            {/* Disclaimers */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; BASIS. WE DISCLAIM ALL WARRANTIES, WHETHER
                EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT.
              </p>
              <p>We do not warrant that:</p>
              <ul className="space-y-2">
                <li>The Service will be uninterrupted or error-free</li>
                <li>Data will be accurate or complete</li>
                <li>Defects will be corrected</li>
                <li>The Service is free of viruses or harmful components</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">
                10. Limitation of Liability
              </h2>
              <p>
                IN NO EVENT SHALL AEQUILIBRA BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE,
                GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p>
                Our total liability to you for all claims arising from or
                relating to the Service shall not exceed the amount you paid us
                in the 12 months preceding the claim.
              </p>
            </section>

            {/* Indemnification */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">11. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless Aequilibra and
                its affiliates from and against any claims, damages,
                obligations, losses, liabilities, costs, or debt arising from:
              </p>
              <ul className="space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your trading activities</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">12. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the
                Service immediately, without prior notice or liability, for any
                reason, including breach of these Terms.
              </p>
              <p>
                Upon termination, your right to use the Service will cease
                immediately. If you wish to terminate your account, you may
                simply discontinue using the Service.
              </p>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">13. Governing Law</h2>
              <p>
                These Terms shall be interpreted and governed by the laws of
                [Jurisdiction], without regard to its conflict of law
                provisions. Any disputes shall be resolved in the courts of
                [Jurisdiction].
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">14. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any
                time. If a revision is material, we will provide at least 30
                days notice prior to any new terms taking effect.
              </p>
              <p>
                By continuing to access or use our Service after revisions
                become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">15. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p>
                  <strong>Email:</strong> legal@aequilibra.com
                </p>
                <p>
                  <strong>Address:</strong> [Company Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
