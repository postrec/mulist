import { NextResponse } from 'next/server';
export function GET() { return NextResponse.json({ service:'mulist-web', status:'ok' }); }
