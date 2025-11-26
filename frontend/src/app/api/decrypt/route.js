export async function POST(request) {
  // FHE decryption must be performed client-side for security and compatibility
  return new Response(
    JSON.stringify({ 
      error: 'FHE decryption must be performed client-side. Please use the browser-based FHE implementation.' 
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}
