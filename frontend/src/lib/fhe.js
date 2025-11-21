let fheInstance = null;

/**
 * Initialize FHEVM instance
 * Uses CDN for browser environments to avoid bundling issues
 * Updated for RelayerSDK 0.3.0-5 (FHEVM 0.9)
 */
export async function initializeFheInstance(options) {
  // Detect environment
  if (typeof window !== 'undefined' && window.ethereum) {
    // Browser environment
    return initializeBrowserFheInstance();
  } else {
    // Node.js environment - use new functionality
    return initializeNodeFheInstance(options?.rpcUrl);
  }
}

/**
 * Initialize FHEVM instance for browser environment
 */
async function initializeBrowserFheInstance() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask or connect a wallet.');
  }

  // Check for both uppercase and lowercase versions of RelayerSDK
  let sdk = (window).RelayerSDK || (window).relayerSDK;
  
  if (!sdk) {
    throw new Error('RelayerSDK not loaded. Please include the script tag in your HTML:\n<script src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"></script>');
  }

  const { initSDK, createInstance, SepoliaConfig } = sdk;

  // Initialize SDK with CDN
  await initSDK();
    console.log('✅ FHEVM SDK initialized with CDN');
  
  const config = { ...SepoliaConfig, network: window.ethereum };
  
  try {
    fheInstance = await createInstance(config);
    return fheInstance;
  } catch (err) {
    console.error('FHEVM browser instance creation failed:', err);
    throw err;
  }
}

/**
 * Initialize FHEVM instance for Node.js environment
 * REAL FUNCTIONALITY - uses actual RelayerSDK
 */
async function initializeNodeFheInstance(rpcUrl) {
  try {
    console.log('🚀 Initializing REAL FHEVM Node.js instance...');
    
    // Use eval to prevent webpack from analyzing these imports
    const relayerSDKModule = await eval('import("@zama-fhe/relayer-sdk/node")');
    const { createInstance, SepoliaConfig, generateKeypair } = relayerSDKModule;
    
    // Create an EIP-1193 compatible provider for Node.js
    const ethersModule = await eval('import("ethers")');
    const provider = new ethersModule.ethers.JsonRpcProvider(rpcUrl || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
    
    // Create EIP-1193 provider wrapper
    const eip1193Provider = {
      request: async ({ method, params }) => {
        switch (method) {
          case 'eth_chainId':
            return '0xaa36a7'; // Sepolia chain ID
          case 'eth_accounts':
            return ['---YOUR-ADDRESS-HERE---'];
          case 'eth_requestAccounts':
            return ['---YOUR-ADDRESS-HERE---'];
          case 'eth_call':
            // Use the real provider for blockchain calls
            return await provider.call(params[0]);
          case 'eth_sendTransaction':
            // Use the real provider for transactions
            return await provider.broadcastTransaction(params[0]);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      on: () => {},
      removeListener: () => {}
    };
    
    const config = { 
      ...SepoliaConfig, 
      network: eip1193Provider 
    };
    
    fheInstance = await createInstance(config);
    console.log('✅ REAL FHEVM Node.js instance created successfully!');
    return fheInstance;
  } catch (err) {
    console.error('FHEVM Node.js instance creation failed:', err);
    throw err;
  }
}

export function getFheInstance() {
  return fheInstance;
}

/**
 * Create encrypted input for contract interaction (matches showcase API)
 */
export async function createEncryptedInput(contractAddress, userAddress, value) {
  const fhe = getFheInstance();
  if (!fhe) throw new Error('FHE instance not initialized. Call initializeFheInstance() first.');

  console.log(`🔐 Creating encrypted input for contract ${contractAddress}, user ${userAddress}, value ${value}`);
  
  const inputHandle = fhe.createEncryptedInput(contractAddress, userAddress);
  inputHandle.add8(value); // Changed to add8 for 8-bit values
  const result = await inputHandle.encrypt();
  
  console.log('✅ Encrypted input created successfully');
  console.log('🔍 Encrypted result structure:', result);
  
  // The FHEVM SDK returns an object with handles and inputProof
  // We need to extract the correct values for the contract
  if (result && typeof result === 'object') {
    // If result has handles array, use the first handle
    if (result.handles && Array.isArray(result.handles) && result.handles.length > 0) {
      return {
        encryptedData: result.handles[0],
        proof: result.inputProof
      };
    }
    // If result has encryptedData and proof properties
    else if (result.encryptedData && result.proof) {
      return {
        encryptedData: result.encryptedData,
        proof: result.proof
      };
    }
    // Fallback: use the result as-is
    else {
      return {
        encryptedData: result,
        proof: result
      };
    }
  }
  
  // If result is not an object, use it directly
  return {
    encryptedData: result,
    proof: result
  };
}