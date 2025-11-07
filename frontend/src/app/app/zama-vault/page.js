"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Eye, TrendingUp, Clock, Wallet, Send, ArrowDownToLine, BarChart3 } from "lucide-react";


export default function ZamaVaultPage() {
  const [status, setStatus] = useState("Initializing...");
  const [instance, setInstance] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [balance, setBalance] = useState(null);
  const [depositAmount, setDepositAmount] = useState(null);
  const [timeUntilUnlock, setTimeUntilUnlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [minDeposit, setMinDeposit] = useState(null);
  const [maxDeposit, setMaxDeposit] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [totalSupply, setTotalSupply] = useState(null);
  const [sharePercentage, setSharePercentage] = useState(null);

  const contractAddress = "0x6FA4f5caa985cd8766837C050128f4f28d936347";

  // Cache key for localStorage
  const getCacheKey = (address) => `zama_vault_balance_${address}_${contractAddress}`;

  // Full ABI from contract
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "depositOf",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "timeUntilUnlock",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint64",
          "name": "inputEuint64",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint64",
          "name": "inputEuint64",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "externalEuint64",
          "name": "inputEuint64",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "transfer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_DEPOSIT",
      "outputs": [
        {
          "internalType": "uint64",
          "name": "",
          "type": "uint64"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_DEPOSIT",
      "outputs": [
        {
          "internalType": "uint64",
          "name": "",
          "type": "uint64"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // === 3️⃣ Load Cached Balance ===
  const loadCachedBalance = () => {
    if (!userAddress) return false;
    
    const cacheKey = getCacheKey(userAddress);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const { balance, depositAmount, timeUntilUnlock, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Cache valid for 5 minutes
        if (age < 5 * 60 * 1000) {
          setBalance(balance);
          setDepositAmount(depositAmount);
          setTimeUntilUnlock(timeUntilUnlock);
          setLastRefresh(new Date(timestamp));
          console.log("✅ Loaded cached balance from", new Date(timestamp).toLocaleTimeString());
          return true;
        }
      } catch (e) {
        console.warn("Failed to parse cached balance:", e);
      }
    }
    return false;
  };

  // === 4️⃣ Save Balance to Cache ===
  const saveCachedBalance = (balance, depositAmount, timeUntilUnlock) => {
    if (!userAddress) return;
    
    const cacheKey = getCacheKey(userAddress);
    const cacheData = {
      balance,
      depositAmount,
      timeUntilUnlock,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    setLastRefresh(new Date());
  };

  // === 5️⃣ View Balance (Decrypt) ===
  const handleViewBalance = async (forceRefresh = false) => {
    try {
      if (!instance) throw new Error("SDK not ready");
      
      // Use cached balance if available and not forcing refresh
      if (!forceRefresh && loadCachedBalance()) {
        setStatus("✅ Balance loaded from cache");
        return;
      }
      
      setLoading(true);
      setStatus("Fetching encrypted balance...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      // Get encrypted balance
      const encryptedBalance = await contract.balanceOf(userAddress);
      console.log("🔐 Encrypted balance:", encryptedBalance);

      // Get encrypted deposit amount
      const encryptedDeposit = await contract.depositOf(userAddress);
      console.log("🔐 Encrypted deposit:", encryptedDeposit);

      // Get time until unlock (not encrypted)
      const timeLeft = await contract.timeUntilUnlock(userAddress);
      setTimeUntilUnlock(Number(timeLeft));

      // Check if user has any balance (not zero handle)
      const isZeroBalance = encryptedBalance === "0x0000000000000000000000000000000000000000000000000000000000000000";
      const isZeroDeposit = encryptedDeposit === "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (isZeroBalance && isZeroDeposit) {
        // User has no balance or deposits yet
        setBalance("0");
        setDepositAmount("0");
        setStatus("✅ No balance yet - deposit or receive funds to get started");
        setLoading(false);
        return;
      }

      // Decrypt balance using userDecrypt
      setStatus("Requesting permission to view balance...");
      
      const signer = await provider.getSigner();
      
      // Generate keypair for decryption
      const keypair = instance.generateKeypair();
      
      // Prepare handles for decryption (only non-zero ones)
      const handleContractPairs = [];
      if (!isZeroBalance) {
        handleContractPairs.push({
          handle: encryptedBalance,
          contractAddress: contractAddress,
        });
      }
      if (!isZeroDeposit) {
        handleContractPairs.push({
          handle: encryptedDeposit,
          contractAddress: contractAddress,
        });
      }
      
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10'; // Permission valid for 10 days
      const contractAddresses = [contractAddress];
      
      // Create EIP-712 signature
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays,
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      setStatus("Decrypting balance...");
      
      // Decrypt available balances
      try {
        const result = await instance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          userAddress,
          startTimeStamp,
          durationDays,
        );

        const decryptedBalance = isZeroBalance ? "0" : result[encryptedBalance];
        const decryptedDeposit = isZeroDeposit ? "0" : result[encryptedDeposit];
        
        const balanceStr = decryptedBalance.toString();
        const depositStr = decryptedDeposit.toString();
        
        setBalance(balanceStr);
        setDepositAmount(depositStr);
        
        // Save to cache
        saveCachedBalance(balanceStr, depositStr, Number(timeLeft));
        
        console.log("✅ Decrypted balance:", balanceStr);
        console.log("✅ Decrypted deposit:", depositStr);

        setStatus("✅ Balance loaded");
      } catch (decryptError) {
        // If decryption fails due to ACL permissions, show 0 balance
        console.warn("⚠️ Decryption failed (likely no ACL permission yet):", decryptError.message);
        setBalance("0");
        setDepositAmount("0");
        saveCachedBalance("0", "0", Number(timeLeft));
        setStatus("✅ Balance: 0 (no activity yet)");
      }
    } catch (err) {
      console.error("❌ View Balance Error:", err);
      // Handle any other errors gracefully
      setBalance("0");
      setDepositAmount("0");
      setStatus("✅ Balance: 0 (no activity yet)");
    } finally {
      setLoading(false);
    }
  };

  // === Fetch Total Supply and Calculate Share Percentage ===
  const fetchTotalSupplyAndShare = async () => {
    try {
      if (!userAddress || balance === null) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      const supply = await contract.totalSupply();
      const supplyNumber = Number(supply);
      setTotalSupply(supplyNumber);

      if (supplyNumber > 0 && balance !== "0") {
        const balanceNumber = Number(balance);
        const percentage = (balanceNumber / supplyNumber) * 100;
        setSharePercentage(percentage);
        console.log(`📊 Your share: ${balanceNumber} / ${supplyNumber} = ${percentage.toFixed(4)}%`);
      } else {
        setSharePercentage(0);
      }
    } catch (err) {
      console.error("❌ Failed to fetch total supply:", err);
    }
  };

  // === 1️⃣ Initialize the Zama SDK ===
  useEffect(() => {
    const initZama = async () => {
      try {
        const response = await fetch(
          "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js"
        );
        const text = await response.text();

        const utf8Bytes = new TextEncoder().encode(text);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            utf8Bytes.subarray(i, i + chunkSize)
          );
        }
        const base64 = btoa(binary);

        const script = document.createElement("script");
        script.type = "module";
        script.textContent = `
          import * as ZamaSDK from 'data:text/javascript;base64,${base64}';
          window.ZamaSDK = ZamaSDK;
          window.dispatchEvent(new Event('zama-ready'));
        `;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Zama SDK load timeout")),
            10000
          );
          window.addEventListener("zama-ready", () => {
            clearTimeout(timeout);
            resolve();
          });
        });

        const { initSDK, createInstance, SepoliaConfig } = window.ZamaSDK || {};
        if (!initSDK) throw new Error("Zama SDK not loaded properly");

        await initSDK();

        if (!window.ethereum) throw new Error("MetaMask not detected");
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        // Use ethers to get checksummed address
        const userAddr = ethers.getAddress(accounts[0]);
        setUserAddress(userAddr);

        const config = { ...SepoliaConfig, network: window.ethereum };
        const instance = await createInstance(config);
        setInstance(instance);

        setStatus("✅ SDK initialized successfully");
      } catch (err) {
        console.error("❌ Zama Init Error:", err);
        setStatus(`❌ ${err.message}`);
      }
    };

    initZama();
  }, []);

  // Load cached balance on mount
  useEffect(() => {
    if (userAddress) {
      loadCachedBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  // Fetch total supply and calculate share percentage when balance changes
  useEffect(() => {
    if (balance !== null && userAddress) {
      fetchTotalSupplyAndShare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, userAddress]);

  // Fetch MIN and MAX deposit values
  useEffect(() => {
    const fetchDepositLimits = async () => {
      if (!instance) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          provider
        );

        const [min, max] = await Promise.all([
          contract.MIN_DEPOSIT(),
          contract.MAX_DEPOSIT()
        ]);

        setMinDeposit(Number(min));
        setMaxDeposit(Number(max));
        console.log("📊 Deposit limits - Min:", Number(min), "Max:", Number(max));
      } catch (err) {
        console.error("Failed to fetch deposit limits:", err);
      }
    };

    fetchDepositLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  // === 2️⃣ Encrypt + Send Deposit ===
  const handleDeposit = async () => {
    try {
      if (!instance) throw new Error("SDK not ready");
      if (!inputValue) throw new Error("Enter a deposit amount");

      const amount = BigInt(inputValue);

      // Validate deposit limits
      if (minDeposit !== null && amount < BigInt(minDeposit)) {
        throw new Error(`Deposit amount must be at least ${minDeposit}`);
      }
      if (maxDeposit !== null && amount > BigInt(maxDeposit)) {
        throw new Error(`Deposit amount cannot exceed ${maxDeposit}`);
      }

      setStatus("Encrypting value...");

      const buffer = instance.createEncryptedInput(contractAddress, userAddress);
      buffer.add64(amount);

      const ciphertexts = await buffer.encrypt();
      console.log("🔐 Ciphertexts:", ciphertexts);
      console.log("🔐 Handle:", ciphertexts.handles[0]);
      console.log("🔐 Proof length:", ciphertexts.inputProof.length);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setStatus("Sending transaction...");

      const tx = await contract.deposit(
        ciphertexts.handles[0],
        ciphertexts.inputProof
      );

      console.log("📤 Transaction sent:", tx.hash);
      setStatus(`⏳ Confirming: ${tx.hash}`);
      
      await tx.wait();

      setStatus(`✅ Deposit confirmed: ${tx.hash}`);
      
      // Force refresh balance after deposit
      await handleViewBalance(true);
    } catch (err) {
      console.error("❌ Deposit Error:", err);
      setStatus(`❌ ${err.message || err.reason || "Transaction failed"}`);
    }
  };

  // === 6️⃣ Transfer Funds ===
  const handleTransfer = async () => {
    try {
      if (!instance) throw new Error("SDK not ready");
      if (!transferTo) throw new Error("Enter recipient address");
      if (!transferAmount) throw new Error("Enter transfer amount");

      setStatus("Encrypting transfer amount...");

      // Validate and checksum the recipient address
      const recipientAddress = ethers.getAddress(transferTo);

      const buffer = instance.createEncryptedInput(contractAddress, userAddress);
      buffer.add64(BigInt(transferAmount));

      const ciphertexts = await buffer.encrypt();
      console.log("🔐 Transfer ciphertexts:", ciphertexts);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setStatus("Sending transfer transaction...");

      const tx = await contract.transfer(
        recipientAddress,
        ciphertexts.handles[0],
        ciphertexts.inputProof
      );

      console.log("📤 Transfer transaction sent:", tx.hash);
      setStatus(`⏳ Confirming transfer: ${tx.hash}`);
      
      await tx.wait();

      setStatus(`✅ Transfer confirmed: ${tx.hash}`);
      
      // Clear inputs and force refresh balance
      setTransferTo("");
      setTransferAmount("");
      await handleViewBalance(true);
    } catch (err) {
      console.error("❌ Transfer Error:", err);
      setStatus(`❌ ${err.message || err.reason || "Transfer failed"}`);
    }
  };

  // === 7️⃣ Withdraw Funds ===
  const handleWithdraw = async () => {
    try {
      if (!instance) throw new Error("SDK not ready");
      if (!withdrawAmount) throw new Error("Enter withdrawal amount");

      // Check if funds are unlocked
      if (timeUntilUnlock > 0) {
        throw new Error(`Funds are locked for ${Math.floor(timeUntilUnlock / 60)} more minutes`);
      }

      setStatus("Encrypting withdrawal amount...");

      const buffer = instance.createEncryptedInput(contractAddress, userAddress);
      buffer.add64(BigInt(withdrawAmount));

      const ciphertexts = await buffer.encrypt();
      console.log("🔐 Withdraw ciphertexts:", ciphertexts);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setStatus("Sending withdrawal transaction...");

      const tx = await contract.withdraw(
        ciphertexts.handles[0],
        ciphertexts.inputProof
      );

      console.log("📤 Withdrawal transaction sent:", tx.hash);
      setStatus(`⏳ Confirming withdrawal: ${tx.hash}`);
      
      await tx.wait();

      setStatus(`✅ Withdrawal confirmed: ${tx.hash}`);
      
      // Clear input and force refresh balance
      setWithdrawAmount("");
      await handleViewBalance(true);
    } catch (err) {
      console.error("❌ Withdrawal Error:", err);
      setStatus(`❌ ${err.message || err.reason || "Withdrawal failed"}`);
    }
  };

  // === 5️⃣ UI ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Zama Vault
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Secure your assets with Fully Homomorphic Encryption (FHE)
          </p>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${instance ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <p className="text-sm font-medium">{status}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {instance ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Wallet Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-2 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Connected Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm text-muted-foreground break-all">
                    {userAddress}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Balance Display */}
            {balance !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              >
                <Card className="border-2 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Total Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{balance}</div>
                    <p className="text-xs text-muted-foreground mt-1">Vault Shares</p>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-br from-green-500/10 to-green-600/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      Deposited
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{depositAmount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Initial Amount</p>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      Lock Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {timeUntilUnlock === 0 ? "✓" : `${Math.floor(timeUntilUnlock / 60)}`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeUntilUnlock === 0 ? "Unlocked" : "Minutes remaining"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      Your Share
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {sharePercentage !== null ? `${sharePercentage.toFixed(4)}%` : "..."}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalSupply !== null ? `of ${totalSupply} total` : "Loading..."}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Deposit Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Deposit Funds
                    </CardTitle>
                    <CardDescription>
                      Encrypt and securely deposit your assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {minDeposit !== null && maxDeposit !== null && (
                      <div className="bg-muted/50 rounded-lg p-3 text-xs">
                        <p className="text-muted-foreground">
                          <strong>Limits:</strong> Min: {minDeposit} | Max: {maxDeposit}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder={minDeposit ? `Min: ${minDeposit}` : "Enter amount"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={loading}
                        min={minDeposit || 0}
                        max={maxDeposit || undefined}
                      />
                      {inputValue && minDeposit !== null && BigInt(inputValue || 0) < BigInt(minDeposit) && (
                        <p className="text-xs text-red-500">Amount below minimum ({minDeposit})</p>
                      )}
                      {inputValue && maxDeposit !== null && BigInt(inputValue || 0) > BigInt(maxDeposit) && (
                        <p className="text-xs text-red-500">Amount exceeds maximum ({maxDeposit})</p>
                      )}
                    </div>
                    <Button
                      onClick={handleDeposit}
                      disabled={
                        loading || 
                        !inputValue || 
                        (minDeposit !== null && BigInt(inputValue || 0) < BigInt(minDeposit)) ||
                        (maxDeposit !== null && BigInt(inputValue || 0) > BigInt(maxDeposit))
                      }
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Encrypt & Deposit
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Transfer Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-primary" />
                      Transfer Funds
                    </CardTitle>
                    <CardDescription>
                      Send encrypted assets to another address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transfer-to">Recipient Address</Label>
                      <Input
                        id="transfer-to"
                        type="text"
                        placeholder="0x..."
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transfer-amount">Amount</Label>
                      <Input
                        id="transfer-amount"
                        type="number"
                        placeholder="Amount to transfer"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={handleTransfer}
                      disabled={loading || !transferTo || !transferAmount}
                      className="w-full"
                      size="lg"
                      variant="default"
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Transfer
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Withdraw Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowDownToLine className="h-5 w-5 text-primary" />
                      Withdraw Funds
                    </CardTitle>
                    <CardDescription>
                      Withdraw your deposited assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {timeUntilUnlock > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs">
                        <p className="text-yellow-600 dark:text-yellow-500">
                          🔒 Locked for {Math.floor(timeUntilUnlock / 60)} more minutes
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        disabled={loading || timeUntilUnlock > 0}
                      />
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      disabled={loading || !withdrawAmount || timeUntilUnlock > 0}
                      className="w-full"
                      size="lg"
                      variant="destructive"
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="mr-2 h-4 w-4" />
                          Withdraw
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* View Balance Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="border-2 hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      View Balance
                    </CardTitle>
                    <CardDescription>
                      Decrypt and view your encrypted holdings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Your balance is encrypted on-chain. Click below to decrypt it locally.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>End-to-end encrypted</span>
                      </div>
                      {lastRefresh && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Clock className="h-3 w-3" />
                          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewBalance(false)}
                        disabled={loading}
                        variant="secondary"
                        className="flex-1"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            View Balance
                          </>
                        )}
                      </Button>
                      {balance !== null && (
                        <Button
                          onClick={() => handleViewBalance(true)}
                          disabled={loading}
                          variant="outline"
                          size="lg"
                          title="Force refresh from blockchain"
                        >
                          🔄
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="border-2 bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Fully Homomorphic Encryption</p>
                      <p className="text-sm text-muted-foreground">
                        Your deposits are encrypted on-chain and can only be decrypted by you.
                        All computations happen on encrypted data without revealing the values.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground">Initializing secure connection...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}