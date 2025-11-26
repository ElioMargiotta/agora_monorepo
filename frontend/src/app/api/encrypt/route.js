import { initializeFheInstance, createEncryptedInput, createEncryptedPercentages } from '@/lib/fhevm';

let fheInitialized = false;

/**
 * Convert FHEVM encrypted data to ethers.js compatible format
 */
function convertToBytesLike(data) {
  // If it's already a string (hex), return as-is
  if (typeof data === 'string') {
    return data;
  }
  
  // If it's an object with numeric string keys (like {"0": 44, "1": 136, ...})
  if (data && typeof data === 'object') {
    const keys = Object.keys(data).filter(key => !isNaN(Number(key))).sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0) {
      // Convert to Uint8Array
      const uint8Array = new Uint8Array(keys.length);
      for (let i = 0; i < keys.length; i++) {
        uint8Array[i] = data[keys[i]];
      }
      // Convert to hex string for JSON serialization
      return '0x' + Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }
  
  // If it's already a Uint8Array, convert to hex
  if (data instanceof Uint8Array) {
    return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback: try to convert to string
  return String(data);
}

export async function POST(request) {
  try {
    // Initialize FHE instance if not already done
    if (!fheInitialized) {
      console.log('API: Initializing FHE instance...');
      await initializeFheInstance({
        rpcUrl: 'https://sepolia.infura.io/v3/73c573e5a8854465ad19e8e4e7e2e20c'
      });
      fheInitialized = true;
      console.log('API: FHE instance initialized successfully.');
    } else {
      console.log('API: FHE instance already initialized.');
    }

    const { proposalAddress, userAddress, voteType, choiceIndex, percentages } = await request.json();
    console.log('API: Received request:', { proposalAddress, userAddress, voteType, choiceIndex, percentages });

    if (!proposalAddress || !userAddress || voteType === undefined) {
      console.log('API: Validation failed - missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: proposalAddress, userAddress, and voteType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let result;
    if (voteType === 0 || voteType === 1) {
      // Non-weighted or weighted single choice
      if (choiceIndex === undefined) {
        console.log('API: Validation failed - choiceIndex required for vote types 0 and 1');
        return new Response(
          JSON.stringify({ error: 'choiceIndex is required for vote types 0 and 1' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('API: Creating encrypted input for single choice vote...');
      result = await createEncryptedInput(proposalAddress, userAddress, choiceIndex);
      console.log('API: Encrypted input created successfully');
      // Convert to ethers-compatible format
      result = {
        encryptedData: convertToBytesLike(result.encryptedData),
        proof: convertToBytesLike(result.proof)
      };

    } else if (voteType === 2) {
      // Weighted fractional
      if (!percentages || !Array.isArray(percentages)) {
        console.log('API: Validation failed - percentages array required for vote type 2');
        return new Response(
          JSON.stringify({ error: 'percentages array is required for vote type 2' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('API: Creating encrypted percentages for fractional vote...');
      result = await createEncryptedPercentages(proposalAddress, userAddress, percentages);
      console.log('API: Raw encrypted percentages result:', result);
      console.log('API: encryptedInputs type:', typeof result.encryptedInputs, 'length:', result.encryptedInputs?.length);
      console.log('API: proof type:', typeof result.proof, 'length:', result.proof?.length);
      console.log('API: Encrypted percentages created successfully');
      // Convert to ethers-compatible format
      result = {
        encryptedInputs: result.encryptedInputs.map(input => convertToBytesLike(input)),
        proof: convertToBytesLike(result.proof)
      };
      console.log('API: Converted result:', result);
      console.log('API: converted encryptedInputs:', result.encryptedInputs);
      console.log('API: converted proof:', result.proof);

    } else {
      console.log('API: Validation failed - unsupported vote type:', voteType);
      return new Response(
        JSON.stringify({ error: 'Unsupported vote type. Must be 0, 1, or 2' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('API: Encryption successful, returning result');
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API: Encryption error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Encryption failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
