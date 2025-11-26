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
  // FHE encryption must be performed client-side for security and compatibility
  return new Response(
    JSON.stringify({ 
      error: 'FHE encryption must be performed client-side. Please use the browser-based FHE implementation.' 
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}
