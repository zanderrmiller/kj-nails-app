import { NextResponse } from 'next/server';
import { getFraudStats } from '@/lib/fraud-protection';

/**
 * GET /api/fraud-stats
 * Returns fraud protection statistics (for admin monitoring)
 * 
 * ⚠️ This endpoint should be protected by authentication in production
 */
export async function GET(request: Request) {
  // TODO: Add authentication check here
  // Example: verify request has valid admin token
  
  const stats = getFraudStats();
  
  return NextResponse.json(stats);
}
