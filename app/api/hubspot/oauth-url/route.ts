import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
  const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;
  const scopes = [
    "contacts",
    "crm.objects.contacts.read",
    "crm.objects.contacts.write"
  ];
  const state = Math.random().toString(36).substring(2, 15); // TODO: store state for CSRF
  const url = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&scope=${scopes.join("%20")}&redirect_uri=${encodeURIComponent(HUBSPOT_REDIRECT_URI)}&state=${state}`;
  return NextResponse.redirect(url);
}
