'use client';

import { useState } from 'react';
import { NavBar } from '@/components/landing/NavBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Book,
  Code,
  Zap,
  Shield,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  FileText,
  MessageCircle,
  Lightbulb,
} from 'lucide-react';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const quickStartSteps = [
    {
      title: 'Connect Your Wallet',
      description: 'Connect your Web3 wallet to access trading features',
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: 'Explore Markets',
      description: 'Browse funding rates across different exchanges',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: 'Start Trading',
      description: 'Execute your first arbitrage strategy',
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/funding/hyperliquid',
      description: 'Fetch real-time Hyperliquid funding rates',
    },
    {
      method: 'GET',
      endpoint: '/api/funding/extended',
      description: 'Fetch real-time Extended Exchange funding rates',
    },
    {
      method: 'GET',
      endpoint: '/api/markets/compare',
      description: 'Compare funding rates across exchanges',
    },
    {
      method: 'POST',
      endpoint: '/api/trade/execute',
      description: 'Execute a neutral arbitrage strategy',
    },
  ];

  const tutorials = [
    {
      title: 'Understanding Funding Rates',
      description: 'Learn how perpetual futures funding works',
      level: 'Beginner',
      duration: '5 min read',
    },
    {
      title: 'Setting Up Arbitrage Strategies',
      description: 'Step-by-step guide to profitable arbitrage',
      level: 'Intermediate',
      duration: '10 min read',
    },
    {
      title: 'Risk Management Best Practices',
      description: 'Advanced techniques for managing trading risk',
      level: 'Advanced',
      duration: '15 min read',
    },
    {
      title: 'API Integration Guide',
      description: 'Integrate Aequilibra APIs into your applications',
      level: 'Developer',
      duration: '20 min read',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Aequilibra&apos;s cross-exchange arbitrage platform
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-3">
              <Book className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                New to Aequilibra? Start here for the basics.
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-3">
              <Code className="h-8 w-8 text-green-600" />
              <h3 className="font-semibold">API Reference</h3>
              <p className="text-sm text-muted-foreground">
                Detailed API documentation and examples.
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-3">
              <Lightbulb className="h-8 w-8 text-yellow-600" />
              <h3 className="font-semibold">Tutorials</h3>
              <p className="text-sm text-muted-foreground">
                Step-by-step guides and best practices.
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-3">
              <MessageCircle className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">Support</h3>
              <p className="text-sm text-muted-foreground">
                Get help from our community and team.
              </p>
            </div>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quick Start Guide</h2>
              <p className="text-muted-foreground">
                Get up and running with Aequilibra in just a few steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {quickStartSteps.map((step, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="p-2 rounded-lg bg-muted">
                      {step.icon}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button size="lg">
                Start Trading Now
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tutorials Section */}
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Tutorials & Guides</h2>
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-4">
                {tutorials.map((tutorial, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tutorial.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {tutorial.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                        <p className="text-xs text-muted-foreground">{tutorial.duration}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* API Reference Section */}
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">API Reference</h2>
                <Button variant="outline" size="sm">
                  Full Documentation
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {endpoint.endpoint}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  All API requests require a valid API key. Include it in the Authorization header:
                </p>
                <code className="text-xs bg-background p-2 rounded mt-2 block">
                  Authorization: Bearer your-api-key
                </code>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Resources */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">Whitepaper</h3>
              <p className="text-sm text-muted-foreground">
                Deep dive into Aequilibra&apos;s technical architecture and trading strategies.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Download PDF
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <h3 className="font-semibold">Community</h3>
              <p className="text-sm text-muted-foreground">
                Join our Discord and Telegram communities for support and discussions.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Join Discord
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <Code className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">GitHub</h3>
              <p className="text-sm text-muted-foreground">
                Access our open-source code, examples, and contribute to the project.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Repository
              </Button>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="p-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">What is funding rate arbitrage?</h3>
                  <p className="text-sm text-muted-foreground">
                    Funding rate arbitrage involves taking opposite positions on different exchanges 
                    to capture the difference in funding rates paid every 8 hours.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">How often are funding rates updated?</h3>
                  <p className="text-sm text-muted-foreground">
                    Funding rates are updated in real-time and payments occur every 8 hours 
                    (00:00, 08:00, 16:00 UTC) on most exchanges.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">What are the risks involved?</h3>
                  <p className="text-sm text-muted-foreground">
                    Main risks include price movements, liquidity differences, execution delays, 
                    and potential changes in funding rates before settlement.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Is Aequilibra open source?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, our core protocols and frontend are open source. Check our GitHub 
                    repository for the latest code and documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
