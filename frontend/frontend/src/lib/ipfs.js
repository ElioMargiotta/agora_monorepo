// IPFS Upload utility

/**
 * Upload proposal metadata to IPFS via the API route
 * @param {Object} metadata - Proposal metadata (title, description, choices, etc.)
 * @returns {Promise<string>} - IPFS hash/URL
 */
export async function pinJSONToIPFS(metadata) {
  try {
    const response = await fetch('/api/upload-ipfs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: JSON.stringify(metadata, null, 2)
      })
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.ipfsUrl;
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    throw error;
  }
}
