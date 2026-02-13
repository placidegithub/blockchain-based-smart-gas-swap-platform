import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), '..', 'staff-registry.json');

export async function GET() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({ entries: [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save registry' },
      { status: 500 }
    );
  }
}
