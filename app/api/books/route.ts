import { NextResponse } from 'next/server';

// This MUST be a named export matching the HTTP method "GET"
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const topic = searchParams.get('topic') || '';

  let targetUrl = 'https://gutendex.com/books/';
  if (search) {
    targetUrl += `?search=${encodeURIComponent(search)}`;
  } else if (topic) {
    targetUrl += `?topic=${encodeURIComponent(topic)}`;
  }

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Gutendex returned status code: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server-side fetch error details:", error);
    return NextResponse.json(
      { error: 'Failed to connect to public directories' }, 
      { status: 500 }
    );
  }
}