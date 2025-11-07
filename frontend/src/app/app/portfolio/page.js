'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DesktopFallback } from '@/components/ui/ComingSoon';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PortfolioPage() {
  const [investedForm, setInvestedForm] = useState({ asset: '', invested_money: '' });
  const [exchangeForm, setExchangeForm] = useState({
    exchange: '',
    agentKey: '',
    apiKeyPublic: '',
    apiKeyPrivate: '',
    apiSecret: '',
    apiPassphrase: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvestedSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/invested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: investedForm.asset,
          invested_money: parseFloat(investedForm.invested_money)
        })
      });
      if (!res.ok) throw new Error('Failed to add invested data');
      const data = await res.json();
      setMessage(`Invested data added: ${JSON.stringify(data)}`);
      setInvestedForm({ asset: '', invested_money: '' });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: exchangeForm.exchange.toLowerCase(),
          agentKey: exchangeForm.agentKey,
          apiKeyPublic: exchangeForm.apiKeyPublic || undefined,
          apiKeyPrivate: exchangeForm.apiKeyPrivate || undefined,
          apiSecret: exchangeForm.apiSecret || undefined,
          apiPassphrase: exchangeForm.apiPassphrase || undefined
        })
      });
      if (!res.ok) throw new Error('Failed to add exchange');
      const data = await res.json();
      setMessage(`Exchange added: ${JSON.stringify(data)}`);
      setExchangeForm({
        exchange: '',
        agentKey: '',
        apiKeyPublic: '',
        apiKeyPrivate: '',
        apiSecret: '',
        apiPassphrase: ''
      });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const portfolioContent = (
    <div className="relative w-full px-4 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-22 mt-12 overflow-hidden min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />
      
      {/* Animated background shapes */}
      <motion.div
        className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="relative z-10 container mx-auto max-w-4xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Portfolio Management
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Add your invested data and exchange accounts securely.
          </p>
        </motion.div>

        {message && (
          <motion.div
            variants={fadeInUp}
            className="mb-8 p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            {message}
          </motion.div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div variants={fadeInUp}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add Invested Data</CardTitle>
                <CardDescription>Track your investments</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvestedSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset</Label>
                    <Input
                      id="asset"
                      type="text"
                      value={investedForm.asset}
                      onChange={(e) => setInvestedForm({ ...investedForm, asset: e.target.value })}
                      placeholder="e.g., ETH"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invested_money">Invested Money</Label>
                    <Input
                      id="invested_money"
                      type="number"
                      step="0.01"
                      value={investedForm.invested_money}
                      onChange={(e) => setInvestedForm({ ...investedForm, invested_money: e.target.value })}
                      placeholder="e.g., 1000.00"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Adding...' : 'Add Invested Data'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add Exchange</CardTitle>
                <CardDescription>Connect your exchange accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExchangeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exchange">Exchange</Label>
                    <Select value={exchangeForm.exchange} onValueChange={(value) => setExchangeForm({ ...exchangeForm, exchange: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="extended">Extended</SelectItem>
                        <SelectItem value="hyperliquid">Hyperliquid</SelectItem>
                        <SelectItem value="aster">Aster</SelectItem>
                        <SelectItem value="lighter">Lighter</SelectItem>
                        <SelectItem value="paradex">Paradex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentKey">Agent Key</Label>
                    <Input
                      id="agentKey"
                      type="text"
                      value={exchangeForm.agentKey}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, agentKey: e.target.value })}
                      placeholder="e.g., agent_demo_1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKeyPublic">API Key Public (optional)</Label>
                    <Input
                      id="apiKeyPublic"
                      type="text"
                      value={exchangeForm.apiKeyPublic}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, apiKeyPublic: e.target.value })}
                      placeholder="Public key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKeyPrivate">API Key Private (optional)</Label>
                    <Input
                      id="apiKeyPrivate"
                      type="password"
                      value={exchangeForm.apiKeyPrivate}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, apiKeyPrivate: e.target.value })}
                      placeholder="Private key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret (optional)</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={exchangeForm.apiSecret}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, apiSecret: e.target.value })}
                      placeholder="Secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiPassphrase">API Passphrase (optional)</Label>
                    <Input
                      id="apiPassphrase"
                      type="password"
                      value={exchangeForm.apiPassphrase}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, apiPassphrase: e.target.value })}
                      placeholder="Passphrase"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Adding...' : 'Add Exchange'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <DesktopFallback 
      comingSoonTitle="Portfolio Coming Soon!"
      comingSoonDescription="We're crafting a comprehensive portfolio management experience for mobile. Track positions, manage investments, and monitor performance across all platforms!"
    >
      {portfolioContent}
    </DesktopFallback>
  );
}
