import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { activateClub } from '@/lib/firebase/club-registration';

const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const conversationId = searchParams.get('conversationId');
  const mock = searchParams.get('mock');
  const sessionId = searchParams.get('sessionId');

  const baseUrl = getBaseUrl();

  // Handle mock payments (development mode)
  if (mock === 'true' && sessionId) {
    try {
      const sessionRef = doc(db, 'paymentSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();

        // Activate the club
        await activateClub(
          sessionData.clubId,
          sessionData.subscriptionId,
          `mock_payment_${Date.now()}`
        );

        // Update session status
        await setDoc(sessionRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
        }, { merge: true });

        // Redirect to success page
        const successUrl = `${baseUrl}/tr/register-club/success?clubId=${sessionData.clubId}`;
        return NextResponse.redirect(successUrl);
      }
    } catch (error) {
      console.error('Mock payment callback error:', error);
    }

    return NextResponse.redirect(`${baseUrl}/tr/register-club?error=payment_failed`);
  }

  // Handle iyzico callback
  if (provider === 'iyzico' && conversationId) {
    try {
      // Get session from Firestore
      const sessionRef = doc(db, 'paymentSessions', conversationId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return NextResponse.redirect(`${baseUrl}/tr/register-club?error=session_not_found`);
      }

      const sessionData = sessionDoc.data();

      // Check if iyzico is configured
      const iyzicoApiKey = process.env.IYZICO_API_KEY;
      const iyzicoSecretKey = process.env.IYZICO_SECRET_KEY;
      const iyzicoEnv = process.env.IYZICO_ENV || 'sandbox';

      if (!iyzicoApiKey || !iyzicoSecretKey) {
        return NextResponse.redirect(`${baseUrl}/tr/register-club?error=payment_not_configured`);
      }

      // Verify payment with iyzico REST API
      const iyzicoBaseUrl = iyzicoEnv === 'production'
        ? 'https://api.iyzipay.com'
        : 'https://sandbox-api.iyzipay.com';

      const requestBody = {
        locale: 'tr',
        conversationId,
        token: sessionData.token,
      };

      // Generate iyzico authorization header
      const randomString = Math.random().toString(36).substring(2, 15);
      const hashString = `${iyzicoApiKey}${randomString}${iyzicoSecretKey}${JSON.stringify(requestBody)}`;
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha1').update(hashString).digest('base64');
      const authorizationHeader = `IYZWS ${iyzicoApiKey}:${hash}`;

      const verifyResponse = await fetch(`${iyzicoBaseUrl}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorizationHeader,
          'x-iyzi-rnd': randomString,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await verifyResponse.json();

      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        // Payment successful - activate club
        await activateClub(
          sessionData.clubId,
          sessionData.subscriptionId,
          result.paymentId
        );

        // Update session status
        await setDoc(sessionRef, {
          status: 'completed',
          paymentId: result.paymentId,
          completedAt: serverTimestamp(),
        }, { merge: true });

        // Redirect to success page
        const successUrl = `${baseUrl}/tr/register-club/success?clubId=${sessionData.clubId}`;
        return NextResponse.redirect(successUrl);
      } else {
        // Payment failed
        await setDoc(sessionRef, {
          status: 'failed',
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        return NextResponse.redirect(`${baseUrl}/tr/register-club?error=payment_failed`);
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return NextResponse.redirect(`${baseUrl}/tr/register-club?error=internal_error`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/tr/register-club?error=invalid_callback`);
}

// Handle POST callback (some providers send POST)
export async function POST(request: NextRequest) {
  return GET(request);
}
