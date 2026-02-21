import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: stations, error } = await supabase
      .from('hyrox_stations')
      .select('*')
      .order('station_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stations: stations ?? [] });
  } catch (err) {
    createLogger({}).error('GET /api/stations failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
