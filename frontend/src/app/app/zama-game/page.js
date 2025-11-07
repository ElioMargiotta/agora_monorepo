"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vote, DollarSign, Trophy, Shield, Clock, TrendingUp, Award, Sparkles, Plus, List, Calendar, CheckCircle, XCircle } from "lucide-react";
import VotingFactoryABI from "./contracts/VotingFactory.sol/VotingFactory.json";
import PrivateVotingABI from "./contracts/zamahub.sol/PrivateVoting.json";
import MockUSDCABI from "./contracts/MockUSDC.sol/MockUSDC.json";


export default function ZamaVotingPage() {
  const [status, setStatus] = useState("Initializing...");
  const [instance, setInstance] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [activeTab, setActiveTab] = useState("votings");
  
  // Create voting form state
  const [votingName, setVotingName] = useState("");
  const [voteDeposit, setVoteDeposit] = useState("10");
  const [votingDuration, setVotingDuration] = useState("300"); // 5 minutes in seconds (minimum)
  const [votingStartTime, setVotingStartTime] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  
  // Voting options state
  const [optionA, setOptionA] = useState({ emoji: "🎯", label: "Option A", description: "Moderate Growth - $4,000" });
  const [optionB, setOptionB] = useState({ emoji: "🚀", label: "Option B", description: "Moon Shot - $10,000" });
  const [optionC, setOptionC] = useState({ emoji: "📉", label: "Option C", description: "Bear Market - $2,000" });
  
  // Votings list state
  const [allVotings, setAllVotings] = useState([]);
  const [ongoingVotings, setOngoingVotings] = useState([]);
  const [upcomingVotings, setUpcomingVotings] = useState([]);
  const [endedVotings, setEndedVotings] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  
  // Selected voting state
  const [selectedVoting, setSelectedVoting] = useState(null);
  const [votingData, setVotingData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [votingLoading, setVotingLoading] = useState(false);

  // Deployed contract addresses
  const votingFactoryAddress = "0x3741Cee30e6cda6C666De42c41Dc471EbC6b091d";
  const usdcContractAddress = "0xffE01B10073099afafE2D09fE4c125E68864587A";
  const wheelPoolAddress = "0xd2F31a7F36f74ae697f790d01B45DBc4a9Ade429";
  const protocolTreasuryAddress = "0xF92c6d8F1cba15eE6c737a7E5c121ad5b6b78982";

  // === Initialize the Zama SDK ===
  useEffect(() => {
    const initZama = async () => {
      try {
        setStatus("🔄 Loading Zama FHE SDK...");
        
        // Use ESM CDN approach as recommended in the docs
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
          import {
            initSDK,
            createInstance,
            SepoliaConfig,
          } from 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js';

          window.ZamaSDK = {
            initSDK,
            createInstance,
            SepoliaConfig
          };
          window.dispatchEvent(new CustomEvent('zama-sdk-ready'));
        `;
        document.head.appendChild(script);

        // Wait for the SDK to load
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("SDK loading timeout"));
          }, 15000);
          
          window.addEventListener('zama-sdk-ready', () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });
        });
        
        const { initSDK, createInstance, SepoliaConfig } = window.ZamaSDK;
        if (!initSDK) throw new Error("Zama SDK not loaded properly");
        
        // Initialize the SDK first
        await initSDK();
        setStatus("🔄 SDK loaded, connecting to wallet...");

        // Check for MetaMask
        if (!window.ethereum) throw new Error("MetaMask not detected");
        
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const userAddr = ethers.getAddress(accounts[0]);
        setUserAddress(userAddr);
        setStatus("🔄 Creating FHE instance...");

        // Create FHE instance with Sepolia config
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

  // === FACTORY FUNCTIONS ===

  // Load all votings from factory
  const loadAllVotings = async () => {
    try {
      setListLoading(true);
      console.log("📡 Connecting to VotingFactory at:", votingFactoryAddress);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(
        votingFactoryAddress,
        VotingFactoryABI.abi,
        provider
      );

      // Get all votings categorized
      console.log("🔍 Fetching votings from factory...");
      const [all, ongoing, upcoming, ended] = await Promise.all([
        factory.getAllVotings(),
        factory.getActiveVotings(),
        factory.getUpcomingVotings(),
        factory.getEndedVotings()
      ]);
      
      console.log("📊 Factory returned:", {
        all: all.length,
        ongoing: ongoing.length,
        upcoming: upcoming.length,
        ended: ended.length
      });
      console.log("📍 All voting addresses:", all);
      console.log("📍 Ongoing addresses:", ongoing);
      console.log("📍 Upcoming addresses:", upcoming);
      console.log("📍 Ended addresses:", ended);

      // Load details for each voting
      const loadVotingDetails = async (address) => {
        const voting = new ethers.Contract(address, PrivateVotingABI.abi, provider);
        try {
          const [name, startTime, endTime, depositAmount, resolved, revealed] = await Promise.all([
            voting.name(),
            voting.votingStartTime(),
            voting.votingEndTime(),
            voting.VOTE_DEPOSIT_AMOUNT(),
            voting.votingResolved(),
            voting.resultsRevealed()
          ]);
          
          return {
            address,
            name,
            startTime: Number(startTime),
            endTime: Number(endTime),
            depositAmount: ethers.formatUnits(depositAmount, 6),
            resolved,
            revealed
          };
        } catch (err) {
          console.error(`Error loading voting ${address}:`, err);
          return null;
        }
      };

      const [allDetails, ongoingDetails, upcomingDetails, endedDetails] = await Promise.all([
        Promise.all(all.map(loadVotingDetails)),
        Promise.all(ongoing.map(loadVotingDetails)),
        Promise.all(upcoming.map(loadVotingDetails)),
        Promise.all(ended.map(loadVotingDetails))
      ]);

      setAllVotings(allDetails.filter(Boolean));
      setOngoingVotings(ongoingDetails.filter(Boolean));
      setUpcomingVotings(upcomingDetails.filter(Boolean));
      setEndedVotings(endedDetails.filter(Boolean));
      
      console.log("✅ Votings loaded:", { all: allDetails.length, ongoing: ongoingDetails.length, upcoming: upcomingDetails.length, ended: endedDetails.length });
    } catch (err) {
      console.error("❌ Failed to load votings:", err);
      setStatus(`❌ Failed to load votings: ${err.message}`);
    } finally {
      setListLoading(false);
    }
  };

  // Create a new voting
  const handleCreateVoting = async () => {
    try {
      if (!votingName.trim()) {
        throw new Error("Please enter a voting name");
      }
      if (!votingStartTime) {
        throw new Error("Please select a start time");
      }

      setCreateLoading(true);
      setStatus("Creating voting...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(
        votingFactoryAddress,
        VotingFactoryABI.abi,
        signer
      );

      // Convert inputs
      const depositAmount = ethers.parseUnits(voteDeposit, 6);
      const startTimeUnix = Math.floor(new Date(votingStartTime).getTime() / 1000);
      const durationSeconds = Number(votingDuration);

      const tx = await factory.createVoting(
        votingName,
        depositAmount,
        startTimeUnix,
        durationSeconds
      );

      setStatus(`⏳ Creating voting: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Extract the voting address from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "VotingCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);
        const newVotingAddress = parsed.args.votingAddress;
        
        // Store custom options in localStorage
        const customOptions = {
          0: optionA,
          1: optionB,
          2: optionC
        };
        localStorage.setItem(`voting_options_${newVotingAddress}`, JSON.stringify(customOptions));
        
        setStatus(`✅ Voting created at: ${newVotingAddress}`);
      } else {
        setStatus("✅ Voting created successfully!");
      }

      // Reset form
      setVotingName("");
      setVotingStartTime("");
      setOptionA({ emoji: "🎯", label: "Option A", description: "Moderate Growth - $4,000" });
      setOptionB({ emoji: "🚀", label: "Option B", description: "Moon Shot - $10,000" });
      setOptionC({ emoji: "📉", label: "Option C", description: "Bear Market - $2,000" });
      
      // Reload votings list and switch to votings tab
      console.log("🔄 Reloading votings list...");
      await loadAllVotings();
      setActiveTab("votings");
    } catch (err) {
      console.error("❌ Create Voting Error:", err);
      setStatus(`❌ Failed to create voting: ${err.message || err.reason}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // Load voting data for a specific voting contract
  const loadVotingData = async (votingAddress = selectedVoting) => {
    if (!votingAddress) return;
    try {
      if (!userAddress) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const votingContract = new ethers.Contract(
        votingAddress,
        PrivateVotingABI.abi,
        provider
      );
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        MockUSDCABI.abi,
        provider
      );

      const [
        name,
        votingEndTime,
        totalVotingUSDC,
        hasVoted,
        hasClaimedReward,
        resultsRevealed,
        votingResolved,
        timeRemaining,
        usdcBal,
        voteDecrypted
      ] = await Promise.all([
        votingContract.name(),
        votingContract.votingEndTime(),
        votingContract.totalVotingUSDC(),
        votingContract.hasVoted(userAddress),
        votingContract.hasClaimedReward(userAddress),
        votingContract.resultsRevealed(),
        votingContract.votingResolved(),
        votingContract.timeUntilVotingEnds(),
        usdcContract.balanceOf(userAddress),
        votingContract.voteDecrypted(userAddress)
      ]);

      const data = {
        name,
        votingEndTime: Number(votingEndTime),
        totalVotingUSDC: ethers.formatUnits(totalVotingUSDC, 6),
        hasVoted,
        hasClaimedReward,
        resultsRevealed,
        votingResolved,
        timeRemaining: Number(timeRemaining),
        voteDecrypted
      };

      // Load vote counts and rankings if revealed
      if (resultsRevealed && votingResolved) {
        const [votesA, votesB, votesC, minorityOption, middleOption, majorityOption, minorityMultiplier, middleMultiplier, majorityMultiplier] = await Promise.all([
          votingContract.votesA(),
          votingContract.votesB(),
          votingContract.votesC(),
          votingContract.minorityOption(),
          votingContract.middleOption(),
          votingContract.majorityOption(),
          votingContract.minorityMultiplier(),
          votingContract.middleMultiplier(),
          votingContract.majorityMultiplier()
        ]);
        data.votesA = Number(votesA);
        data.votesB = Number(votesB);
        data.votesC = Number(votesC);
        data.minorityOption = Number(minorityOption);
        data.middleOption = Number(middleOption);
        data.majorityOption = Number(majorityOption);
        data.minorityMultiplier = Number(minorityMultiplier);
        data.middleMultiplier = Number(middleMultiplier);
        data.majorityMultiplier = Number(majorityMultiplier);
      }

      // Load user's decrypted vote if available
      if (voteDecrypted) {
        const decryptedVote = await votingContract.decryptedVotes(userAddress);
        data.userDecryptedVote = Number(decryptedVote);
        
        // Calculate user's reward amount if voting is resolved
        if (resultsRevealed && votingResolved) {
          const netDeposit = 9.8; // 10 USDC - 2% fee = 9.8 USDC
          let multiplier = 0;
          
          if (data.userDecryptedVote === data.minorityOption) {
            multiplier = data.minorityMultiplier;
          } else if (data.userDecryptedVote === data.middleOption) {
            multiplier = data.middleMultiplier;
          } else if (data.userDecryptedVote === data.majorityOption) {
            multiplier = data.majorityMultiplier;
          }
          
          data.userRewardAmount = (netDeposit * multiplier) / 100;
        }
      }

      // Load custom options from localStorage if available
      const storedOptions = localStorage.getItem(`voting_options_${votingAddress}`);
      if (storedOptions) {
        try {
          data.customOptions = JSON.parse(storedOptions);
        } catch (e) {
          console.error("Failed to parse stored options:", e);
        }
      }

      setVotingData(data);
      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
      console.log("✅ Voting data loaded:", data);
    } catch (err) {
      console.error("❌ Failed to load voting data:", err);
    }
  };

  // Mint Mock USDC
  const handleMintUSDC = async () => {
    try {
      setVotingLoading(true);
      setStatus("Minting 1000 USDC...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        MockUSDCABI.abi,
        signer
      );

      const amount = ethers.parseUnits("1000", 6);
      const tx = await usdcContract.mint(userAddress, amount);
      
      setStatus(`⏳ Minting USDC: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Minted 1000 USDC successfully!");
      await loadVotingData();
    } catch (err) {
      console.error("❌ Mint Error:", err);
      setStatus(`❌ Mint failed: ${err.message || err.reason}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Vote with encrypted option
  const handleVote = async () => {
    try {
      if (!instance) throw new Error("SDK not ready");
      if (selectedOption === null) throw new Error("Select an option");

      setVotingLoading(true);
      
      if (parseFloat(usdcBalance) < 10) {
        throw new Error("Insufficient USDC balance. Mint some first!");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        MockUSDCABI.abi,
        signer
      );
      
      if (!selectedVoting) throw new Error("No voting selected");
      
      const allowance = await usdcContract.allowance(userAddress, selectedVoting);
      const requiredAmount = ethers.parseUnits(votingData?.depositAmount || "10", 6);
      
      if (allowance < requiredAmount) {
        setStatus("Approving USDC...");
        const approveTx = await usdcContract.approve(selectedVoting, requiredAmount);
        await approveTx.wait();
      }

      setStatus("Encrypting your vote...");
      const buffer = instance.createEncryptedInput(selectedVoting, userAddress);
      buffer.add8(selectedOption);
      
      const ciphertexts = await buffer.encrypt();

      const votingContract = new ethers.Contract(
        selectedVoting,
        PrivateVotingABI.abi,
        signer
      );

      setStatus("Submitting vote...");
      const tx = await votingContract.depositVote(
        ciphertexts.handles[0],
        ciphertexts.inputProof
      );

      setStatus(`⏳ Confirming vote: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Vote submitted successfully!");
      setSelectedOption(null);
      await loadVotingData();
    } catch (err) {
      console.error("❌ Vote Error:", err);
      setStatus(`❌ Vote failed: ${err.message || err.reason}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Request vote decryption - separate step before claiming
  const handleRequestDecryption = async () => {
    try {
      if (!selectedVoting) throw new Error("No voting selected");
      
      setVotingLoading(true);
      setStatus("🔐 Requesting vote decryption...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const votingContract = new ethers.Contract(
        selectedVoting,
        PrivateVotingABI.abi,
        signer
      );

      // Call the separate requestUserVoteDecryption function
      const tx = await votingContract.requestUserVoteDecryption();
      setStatus(`⏳ Confirming decryption request: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Decryption requested! Waiting for oracle callback (10-30s)...");
      
      // Auto-check for decryption completion
      const checkInterval = setInterval(async () => {
        try {
          await loadVotingData();
          const isDecrypted = await votingContract.voteDecrypted(userAddress);
          if (isDecrypted) {
            clearInterval(checkInterval);
            setStatus("✅ Vote decrypted! Now you can claim your reward");
          }
        } catch (e) {
          console.error("Check interval error:", e);
        }
      }, 5000);
      
      setTimeout(() => clearInterval(checkInterval), 120000);
    } catch (err) {
      console.error("❌ Decryption request error:", err);
      const errorMessage = err.reason || err.message || '';
      setStatus(`❌ Decryption request failed: ${errorMessage}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Claim reward - only works after vote is decrypted
  const handleClaimReward = async () => {
    try {
      setVotingLoading(true);

      if (!selectedVoting) throw new Error("No voting selected");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const votingContract = new ethers.Contract(
        selectedVoting,
        PrivateVotingABI.abi,
        signer
      );

      // Check if vote is already decrypted
      const voteDecrypted = await votingContract.voteDecrypted(userAddress);
      
      if (!voteDecrypted) {
        setStatus("⚠️ Please request decryption first!");
        setVotingLoading(false);
        return;
      }

      setStatus("💰 Claiming your reward...");
      const tx = await votingContract.claimReward();
      setStatus(`⏳ Confirming transaction: ${tx.hash}`);
      await tx.wait();

      setStatus("✅ Reward claimed successfully!");
      await loadVotingData();
    } catch (err) {
      console.error("❌ Claim Error:", err);
      const errorMessage = err.reason || err.message || (err.revert && err.revert.args && err.revert.args[0]) || '';
      setStatus(`❌ Claim failed: ${errorMessage || 'Unknown error'}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Load votings list on tab change
  useEffect(() => {
    if (userAddress && activeTab === "votings") {
      loadAllVotings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, activeTab]);

  // Load voting data when a voting is selected
  useEffect(() => {
    if (selectedVoting && userAddress && instance) {
      loadVotingData();
      const interval = setInterval(() => loadVotingData(), 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoting, userAddress, instance]);

  // Helper functions
  const getOptionInfo = (option) => {
    // Try to get custom options from the voting data first, otherwise use defaults
    if (votingData?.customOptions) {
      return votingData.customOptions[option];
    }
    
    const options = {
      0: optionA,
      1: optionB,
      2: optionC
    };
    return options[option] || optionA;
  };

  const getRankInfo = (option) => {
    if (!votingData) return null;
    if (option === votingData.minorityOption) return { label: "Winner (Minority)", color: "text-green-600", bgColor: "bg-green-500/10", emoji: "🏆" };
    if (option === votingData.middleOption) return { label: "Middle", color: "text-yellow-600", bgColor: "bg-yellow-500/10", emoji: "🥈" };
    if (option === votingData.majorityOption) return { label: "Majority (Lost)", color: "text-red-600", bgColor: "bg-red-500/10", emoji: "❌" };
    return null;
  };

  // === UI ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Vote className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Zama Private Voting
            </h1>
          </div>
          <p className="text-xl font-semibold text-muted-foreground max-w-2xl mx-auto">
            Create and participate in fully encrypted voting rounds
          </p>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-6xl mx-auto mb-8"
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
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="votings" className="text-lg">
                  <List className="mr-2 h-5 w-5" />
                  View Votings
                </TabsTrigger>
                <TabsTrigger value="vote" className="text-lg" disabled={!selectedVoting}>
                  <Vote className="mr-2 h-5 w-5" />
                  {selectedVoting ? "Voting Details" : "Select a Voting"}
                </TabsTrigger>
                <TabsTrigger value="create" className="text-lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Voting
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: View Votings */}
              <TabsContent value="votings" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Header with Refresh Button */}
                  <Card className="border-2 mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <List className="h-5 w-5" />
                            All Votings
                          </CardTitle>
                          <CardDescription>
                            Browse and participate in voting rounds
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={loadAllVotings} 
                          disabled={listLoading}
                          className="shrink-0"
                        >
                          {listLoading ? "Loading..." : "Refresh"}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* 3-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Active Votings */}
                    <div className="space-y-4">
                      <Card className="border-2 border-green-500 sticky top-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-green-600 text-lg">
                            <CheckCircle className="h-5 w-5" />
                            Active ({ongoingVotings.length})
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <div className="space-y-3">
                        {ongoingVotings.length > 0 ? (
                          ongoingVotings.map((voting) => (
                            <Card 
                              key={voting.address} 
                              className="border-2 border-green-500/50 cursor-pointer hover:border-green-500 hover:shadow-lg transition-all"
                              onClick={() => {
                                setSelectedVoting(voting.address);
                                setActiveTab("vote");
                              }}
                            >
                              <CardContent className="pt-4 pb-4">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-base line-clamp-2">{voting.name}</h3>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs font-semibold shrink-0">
                                      Live
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      💰 {voting.depositAmount} USDC
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ⏰ Ends: {new Date(voting.endTime * 1000).toLocaleDateString()} {new Date(voting.endTime * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Card className="border-dashed">
                            <CardContent className="pt-8 pb-8 text-center">
                              <p className="text-sm text-muted-foreground">No active votings</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Upcoming Votings */}
                    <div className="space-y-4">
                      <Card className="border-2 border-blue-500 sticky top-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-blue-600 text-lg">
                            <Calendar className="h-5 w-5" />
                            Upcoming ({upcomingVotings.length})
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <div className="space-y-3">
                        {upcomingVotings.length > 0 ? (
                          upcomingVotings.map((voting) => (
                            <Card 
                              key={voting.address} 
                              className="border-2 border-blue-500/50 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                              onClick={() => {
                                setSelectedVoting(voting.address);
                                setActiveTab("vote");
                              }}
                            >
                              <CardContent className="pt-4 pb-4">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-base line-clamp-2">{voting.name}</h3>
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded-full text-xs font-semibold shrink-0">
                                      Soon
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      💰 {voting.depositAmount} USDC
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      🚀 Starts: {new Date(voting.startTime * 1000).toLocaleDateString()} {new Date(voting.startTime * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Card className="border-dashed">
                            <CardContent className="pt-8 pb-8 text-center">
                              <p className="text-sm text-muted-foreground">No upcoming votings</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Past Votings */}
                    <div className="space-y-4">
                      <Card className="border-2 sticky top-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <XCircle className="h-5 w-5" />
                            Past ({endedVotings.length})
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <div className="space-y-3">
                        {endedVotings.length > 0 ? (
                          endedVotings.map((voting) => (
                            <Card 
                              key={voting.address} 
                              className="border cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all opacity-90"
                              onClick={() => {
                                setSelectedVoting(voting.address);
                                setActiveTab("vote");
                              }}
                            >
                              <CardContent className="pt-4 pb-4">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-base line-clamp-2">{voting.name}</h3>
                                    <div className="flex flex-col gap-1">
                                      <span className="px-2 py-1 bg-gray-500/20 text-gray-600 rounded-full text-xs font-semibold">
                                        Ended
                                      </span>
                                      {voting.resolved && voting.revealed && (
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-600 rounded-full text-xs font-semibold">
                                          Results
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      💰 {voting.depositAmount} USDC
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      🏁 Ended: {new Date(voting.endTime * 1000).toLocaleDateString()} {new Date(voting.endTime * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Card className="border-dashed">
                            <CardContent className="pt-8 pb-8 text-center">
                              <p className="text-sm text-muted-foreground">No past votings</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Empty State - Only show if ALL categories are empty */}
                  {!listLoading && ongoingVotings.length === 0 && upcomingVotings.length === 0 && endedVotings.length === 0 && (
                    <Card className="border-2 mt-6">
                      <CardContent className="pt-12 pb-12 text-center">
                        <p className="text-lg text-muted-foreground">No votings found. Create one to get started! 🚀</p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>

              {/* TAB 2: Vote - Voting Details & Options */}
              <TabsContent value="vote" className="space-y-6">
                {selectedVoting && votingData ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* USDC Balance & Mint Card */}
                    <Card className="border-2 border-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Your USDC Balance
                            </CardTitle>
                            <CardDescription>Mock USDC for testing on Sepolia</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600">{usdcBalance}</p>
                            <p className="text-sm text-muted-foreground">USDC</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={handleMintUSDC}
                          disabled={votingLoading}
                          className="w-full"
                          variant="outline"
                        >
                          {votingLoading ? "Minting..." : "🪙 Mint 1000 USDC (Free)"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Get free test USDC to participate in votings
                        </p>
                      </CardContent>
                    </Card>

                    {/* Voting Info Card */}
                    <Card className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl">{votingData.name}</CardTitle>
                            <CardDescription>Contract: {selectedVoting}</CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedVoting(null);
                              setActiveTab("votings");
                            }}
                          >
                            ← Back to List
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Pool</p>
                            <p className="text-2xl font-bold">{votingData.totalVotingUSDC} USDC</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Time Remaining</p>
                            <p className="text-xl font-semibold">
                              {votingData.timeRemaining > 0 
                                ? `${Math.floor(votingData.timeRemaining / 3600)}h ${Math.floor((votingData.timeRemaining % 3600) / 60)}m`
                                : "Ended"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Your Status</p>
                            <p className="text-sm font-semibold">
                              {votingData.hasVoted ? "✅ Voted" : "⏳ Not Voted"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Results</p>
                            <p className="text-sm font-semibold">
                              {votingData.resultsRevealed ? "✅ Revealed" : "🔒 Hidden"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Voting Options Card */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Vote className="h-5 w-5" />
                          Voting Options
                        </CardTitle>
                        <CardDescription>
                          {votingData.resultsRevealed 
                            ? "Results are revealed - see vote counts below" 
                            : votingData.hasVoted 
                              ? "You have already cast your vote" 
                              : "Select an option to cast your vote"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[0, 1, 2].map((option) => {
                          const optionInfo = getOptionInfo(option);
                          const rankInfo = votingData.resultsRevealed ? getRankInfo(option) : null;
                          const voteCount = votingData.resultsRevealed ? 
                            (option === 0 ? votingData.votesA : option === 1 ? votingData.votesB : votingData.votesC) : null;
                          
                          return (
                            <motion.div
                              key={option}
                              whileHover={{ scale: !votingData.hasVoted && votingData.timeRemaining > 0 ? 1.02 : 1 }}
                              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedOption === option ? "border-purple-500 bg-purple-500/10" : "border-border"
                              } ${rankInfo ? rankInfo.bgColor : ""}`}
                              onClick={() => !votingData.hasVoted && votingData.timeRemaining > 0 && setSelectedOption(option)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-4xl">{optionInfo.emoji}</span>
                                  <div>
                                    <h3 className="text-xl font-bold">{optionInfo.label}</h3>
                                    <p className="text-sm text-muted-foreground">{optionInfo.description}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {rankInfo && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{rankInfo.emoji}</span>
                                      <span className={`font-bold ${rankInfo.color}`}>{rankInfo.label}</span>
                                    </div>
                                  )}
                                  {voteCount !== null && (
                                    <p className="text-lg font-semibold">{voteCount} votes</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Results Revealed Card */}
                    {votingData.resultsRevealed && votingData.votingResolved && (
                      <Card className="border-2 border-purple-500 bg-purple-500/5">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Results Revealed
                          </CardTitle>
                          <CardDescription>
                            Final vote counts and reward multipliers
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Vote Counts Summary */}
                          <div className="grid grid-cols-3 gap-4">
                            {[0, 1, 2].map((option) => {
                              const optionInfo = getOptionInfo(option);
                              const rankInfo = getRankInfo(option);
                              const voteCount = option === 0 ? votingData.votesA : option === 1 ? votingData.votesB : votingData.votesC;
                              const multiplier = option === votingData.minorityOption 
                                ? votingData.minorityMultiplier 
                                : option === votingData.middleOption 
                                  ? votingData.middleMultiplier 
                                  : votingData.majorityMultiplier;
                              
                              return (
                                <div key={option} className={`p-4 rounded-lg border-2 ${rankInfo?.bgColor || ''}`}>
                                  <div className="text-center space-y-2">
                                    <div className="text-3xl">{optionInfo.emoji}</div>
                                    <div className="font-bold text-sm">{optionInfo.label}</div>
                                    <div className="text-2xl font-bold">{voteCount}</div>
                                    <div className="text-xs text-muted-foreground">votes</div>
                                    <div className={`font-semibold ${rankInfo?.color || ''}`}>
                                      {rankInfo?.emoji} {rankInfo?.label}
                                    </div>
                                    <div className="text-sm font-semibold">
                                      {(multiplier / 100).toFixed(2)}x
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* User's Vote & Reward */}
                          {votingData.voteDecrypted && votingData.userDecryptedVote !== undefined && (
                            <div className="p-4 bg-blue-500/10 border-2 border-blue-500 rounded-lg">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Your Vote</p>
                                    <p className="text-lg font-bold">
                                      {getOptionInfo(votingData.userDecryptedVote).emoji} {getOptionInfo(votingData.userDecryptedVote).label}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Your Reward</p>
                                    <p className="text-2xl font-bold text-green-600">
                                      {votingData.userRewardAmount?.toFixed(2)} USDC
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    Result: {getRankInfo(votingData.userDecryptedVote)?.label || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Decryption & Claim Buttons */}
                          {votingData.hasVoted && !votingData.voteDecrypted && (
                            <Button 
                              onClick={handleRequestDecryption}
                              disabled={votingLoading}
                              className="w-full"
                              size="lg"
                              variant="outline"
                            >
                              {votingLoading ? "Requesting..." : "🔐 Request Vote Decryption"}
                            </Button>
                          )}

                          {votingData.voteDecrypted && !votingData.hasClaimedReward && (
                            <Button 
                              onClick={handleClaimReward}
                              disabled={votingLoading}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                              size="lg"
                            >
                              {votingLoading ? "Claiming..." : "💰 Claim Your Reward"}
                            </Button>
                          )}

                          {votingData.hasClaimedReward && (
                            <div className="p-4 bg-green-500/10 border-2 border-green-500 rounded-lg text-center">
                              <p className="font-semibold text-green-600">✅ Reward Already Claimed</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    {!votingData.hasVoted && votingData.timeRemaining > 0 && (
                      <Card className="border-2 border-purple-500">
                        <CardContent className="pt-6">
                          <Button 
                            onClick={handleVote}
                            disabled={selectedOption === null || votingLoading}
                            className="w-full"
                            size="lg"
                          >
                            {votingLoading ? "Processing..." : `Vote for ${selectedOption !== null ? getOptionInfo(selectedOption).label : "Option"}`}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Your USDC balance: {usdcBalance} USDC
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Waiting for Results */}
                    {votingData.hasVoted && votingData.timeRemaining <= 0 && !votingData.resultsRevealed && (
                      <Card className="border-2 border-yellow-500">
                        <CardContent className="pt-6 text-center">
                          <div className="space-y-3">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent mx-auto" />
                            <p className="font-semibold">⏳ Waiting for Results to be Revealed</p>
                            <p className="text-sm text-muted-foreground">
                              The voting has ended. Results will be available soon.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ) : (
                  <Card className="border-2">
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-muted-foreground">Select a voting from the list to view details</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB 3: Create Voting */}
              <TabsContent value="create" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Voting Round
                      </CardTitle>
                      <CardDescription>
                        Set up a new private voting session with custom parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Voting Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., ETH Price Prediction 2026"
                          value={votingName}
                          onChange={(e) => setVotingName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deposit">Vote Deposit Amount (USDC)</Label>
                        <Input
                          id="deposit"
                          type="number"
                          step="0.01"
                          placeholder="10"
                          value={voteDeposit}
                          onChange={(e) => setVoteDeposit(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Amount each participant must deposit to vote
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={votingStartTime}
                          onChange={(e) => setVotingStartTime(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Voting Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          placeholder="300"
                          min="300"
                          value={votingDuration}
                          onChange={(e) => setVotingDuration(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum: 300 (5 min) • 3600 = 1 hour • 86400 = 1 day • 604800 = 1 week
                        </p>
                      </div>

                      {/* Voting Options Configuration */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Configure Voting Options</Label>
                        
                        {/* Option A */}
                        <div className="space-y-2 p-4 border rounded-lg">
                          <Label className="font-semibold">Option A</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="🎯"
                              value={optionA.emoji}
                              onChange={(e) => setOptionA({...optionA, emoji: e.target.value})}
                              className="text-center"
                              maxLength={2}
                            />
                            <Input
                              placeholder="Label"
                              value={optionA.label}
                              onChange={(e) => setOptionA({...optionA, label: e.target.value})}
                            />
                            <Input
                              placeholder="Description"
                              value={optionA.description}
                              onChange={(e) => setOptionA({...optionA, description: e.target.value})}
                              className="col-span-1"
                            />
                          </div>
                        </div>

                        {/* Option B */}
                        <div className="space-y-2 p-4 border rounded-lg">
                          <Label className="font-semibold">Option B</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="🚀"
                              value={optionB.emoji}
                              onChange={(e) => setOptionB({...optionB, emoji: e.target.value})}
                              className="text-center"
                              maxLength={2}
                            />
                            <Input
                              placeholder="Label"
                              value={optionB.label}
                              onChange={(e) => setOptionB({...optionB, label: e.target.value})}
                            />
                            <Input
                              placeholder="Description"
                              value={optionB.description}
                              onChange={(e) => setOptionB({...optionB, description: e.target.value})}
                              className="col-span-1"
                            />
                          </div>
                        </div>

                        {/* Option C */}
                        <div className="space-y-2 p-4 border rounded-lg">
                          <Label className="font-semibold">Option C</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="📉"
                              value={optionC.emoji}
                              onChange={(e) => setOptionC({...optionC, emoji: e.target.value})}
                              className="text-center"
                              maxLength={2}
                            />
                            <Input
                              placeholder="Label"
                              value={optionC.label}
                              onChange={(e) => setOptionC({...optionC, label: e.target.value})}
                            />
                            <Input
                              placeholder="Description"
                              value={optionC.description}
                              onChange={(e) => setOptionC({...optionC, description: e.target.value})}
                              className="col-span-1"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreateVoting}
                        disabled={createLoading || !votingName || !votingStartTime}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        {createLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Create Voting Round
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Info Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-sm">ℹ️ How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p>• Participants vote by depositing USDC and selecting an encrypted option</p>
                      <p>• After voting ends, results are revealed through FHE decryption</p>
                      <p>• Rewards are distributed based on voting patterns (minority wins!)</p>
                      <p>• All votes remain encrypted until the round ends</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
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