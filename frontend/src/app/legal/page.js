import { NavBar } from '@/components/landing/NavBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Shield, AlertTriangle } from 'lucide-react';

export default function LegalPage() {
  const legalPages = [
    {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using the Aequilibra platform',
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      href: '/legal/terms',
      lastUpdated: 'September 9, 2025',
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information',
      icon: <Shield className="h-8 w-8 text-green-600" />,
      href: '/legal/privacy',
      lastUpdated: 'September 9, 2025',
    },
    {
      title: 'Risk Disclosure',
      description:
        'Important information about trading risks and potential losses',
      icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
      href: '/legal/risk',
      lastUpdated: 'September 9, 2025',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Legal Information
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Important legal documents and disclosures for using the Aequilibra
            platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {legalPages.map((page, index) => (
            <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto">
                  {page.icon}
                </div>

                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold">{page.title}</h2>
                  <p className="text-muted-foreground">{page.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {page.lastUpdated}
                  </p>
                </div>

                <Button asChild className="w-full" size="lg">
                  <a href={page.href}>Read {page.title}</a>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center space-y-4">
          <div className="bg-muted p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have questions about our legal documents or need
              clarification, please don&apos;t hesitate to contact us.
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Email:</strong> legal@aequilibra.com
              </p>
              <p>
                <strong>Support:</strong> support@aequilibra.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
