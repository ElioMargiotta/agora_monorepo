import { NavBar } from '@/components/landing/NavBar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 15, 2024
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p>
                Aequilibra (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our platform and services.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <ul className="space-y-2">
                <li><strong>Account Information:</strong> Email address, username, password</li>
                <li><strong>Profile Information:</strong> Display name, preferences</li>
                <li><strong>Verification Information:</strong> KYC documents if required</li>
                <li><strong>Communication Data:</strong> Support messages, feedback</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Wallet and Trading Data</h3>
              <ul className="space-y-2">
                <li><strong>Wallet Addresses:</strong> Connected cryptocurrency wallet addresses</li>
                <li><strong>Trading Activity:</strong> Transaction history, positions, balances</li>
                <li><strong>API Keys:</strong> Exchange API credentials (encrypted)</li>
                <li><strong>Trading Preferences:</strong> Risk settings, strategy preferences</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Data Security</h2>
              
              <p>
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  🔒 Your Responsibility
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-2">
                  While we implement strong security measures, you are responsible for keeping 
                  your account credentials secure and reporting any suspicious activity immediately.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Your Privacy Rights</h2>
              
              <p>Depending on your location, you may have the following rights:</p>

              <h3 className="text-xl font-semibold">Access and Control</h3>
              <ul className="space-y-2">
                <li>Request access to your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <p className="mt-4">
                To exercise these rights, please contact us at privacy@aequilibra.com. 
                We will respond to your request within 30 days.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Contact Us</h2>
              
              <p>
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us:
              </p>
              
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@aequilibra.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@aequilibra.com</p>
                <p><strong>Address:</strong> [Company Address]</p>
              </div>

              <p className="mt-4">
                We are committed to resolving any privacy concerns you may have and will 
                respond to your inquiries promptly.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
