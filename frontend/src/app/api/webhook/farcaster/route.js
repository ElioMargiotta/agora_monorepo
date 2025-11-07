import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { untrustedData, trustedData } = body;
    
    // Log the event for debugging
    console.log('Farcaster webhook received:', {
      fid: untrustedData?.fid,
      buttonIndex: untrustedData?.buttonIndex,
      url: untrustedData?.url,
      timestamp: new Date().toISOString(),
    });

    // Handle different types of interactions
    const eventType = determineEventType(untrustedData);
    
    switch (eventType) {
      case 'app_open':
        await handleAppOpen(untrustedData);
        break;
      case 'button_click':
        await handleButtonClick(untrustedData);
        break;
      case 'funding_view':
        await handleFundingView(untrustedData);
        break;
      case 'transaction':
        await handleTransaction(untrustedData);
        break;
      default:
        console.log('Unknown event type:', eventType);
    }

    // Respond with success
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

function determineEventType(untrustedData) {
  if (!untrustedData) return 'unknown';
  
  // Determine event type based on URL and button index
  const url = untrustedData.url || '';
  const buttonIndex = untrustedData.buttonIndex;
  
  if (url.includes('/funding')) return 'funding_view';
  if (url.includes('/onchain-demo')) return 'transaction';
  if (buttonIndex) return 'button_click';
  
  return 'app_open';
}

async function handleAppOpen(data) {
  console.log('User opened Aequilibra app:', {
    fid: data.fid,
    timestamp: new Date().toISOString(),
  });
  
  // Track app opens in your analytics
  // await analytics.track('app_open', { fid: data.fid });
}

async function handleButtonClick(data) {
  console.log('User clicked button:', {
    fid: data.fid,
    buttonIndex: data.buttonIndex,
    url: data.url,
  });
  
  // Track button interactions
  // await analytics.track('button_click', {
  //   fid: data.fid,
  //   buttonIndex: data.buttonIndex,
  //   page: data.url,
  // });
}

async function handleFundingView(data) {
  console.log('User viewed funding rates:', {
    fid: data.fid,
    url: data.url,
  });
  
  // Track funding rate views
  // await analytics.track('funding_view', { fid: data.fid });
}

async function handleTransaction(data) {
  console.log('User initiated transaction:', {
    fid: data.fid,
    url: data.url,
    buttonIndex: data.buttonIndex,
  });
  
  // Track onchain transactions
  // await analytics.track('transaction_initiated', {
  //   fid: data.fid,
  //   type: 'onchain_demo',
  // });
}

// Optional: GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'Aequilibra Farcaster Webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}