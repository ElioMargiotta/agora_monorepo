import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Use Pinata for pinning
    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json({ error: 'IPFS upload not configured' }, { status: 500 });
    }

    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    pinataFormData.append('pinataMetadata', metadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata upload failed:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to upload image' 
    }, { status: 500 });
  }
}
