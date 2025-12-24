import { NextRequest, NextResponse } from 'next/server';

// TODO: Connect to database for persistent service management
// Placeholder for service endpoints

interface Service {
  id: string;
  name: string;
  duration: number;
  basePrice: number;
}

const mockServices: Service[] = [
  { id: 'manicure', name: 'Manicure', duration: 45, basePrice: 35 },
  { id: 'pedicure', name: 'Pedicure', duration: 60, basePrice: 45 },
  { id: 'gel', name: 'Gel Polish', duration: 60, basePrice: 50 },
  { id: 'extensions', name: 'Nail Extensions', duration: 90, basePrice: 60 },
  { id: 'design', name: 'Custom Design', duration: 30, basePrice: 15 },
  { id: 'removal', name: 'Removal', duration: 20, basePrice: 20 },
];

export async function GET(request: NextRequest) {
  try {
    // TODO: Fetch from database
    return NextResponse.json(mockServices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.duration || body.basePrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TODO: Save to database
    const newService: Service = {
      id: `service-${Date.now()}`,
      name: body.name,
      duration: body.duration,
      basePrice: body.basePrice,
    };

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
