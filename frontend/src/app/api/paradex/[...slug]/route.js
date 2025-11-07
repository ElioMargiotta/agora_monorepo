import { NextResponse } from 'next/server';

const BASE_URL = 'https://api.prod.paradex.trade/v1';

export async function GET(request, { params }) {
  const { slug } = await params;
  const endpoint = slug.join('/');

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = `${BASE_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
