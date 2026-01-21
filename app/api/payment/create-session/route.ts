import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// iyzico types
interface CreatePaymentRequest {
  clubId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annually';
  clubName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  returnUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: CreatePaymentRequest = await request.json();

    const {
      clubId,
      subscriptionId,
      amount,
      currency,
      billingCycle,
      clubName,
      userName,
      userEmail,
      userPhone,
      returnUrl,
    } = data;

    // Validate required fields
    if (!clubId || !amount || !returnUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sessionId = `session_${clubId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if iyzico is configured (env vars present)
    const iyzicoApiKey = process.env.IYZICO_API_KEY;
    const iyzicoSecretKey = process.env.IYZICO_SECRET_KEY;
    const iyzicoEnv = process.env.IYZICO_ENV || 'sandbox';

    // If iyzico is not configured, use mock payment
    if (!iyzicoApiKey || !iyzicoSecretKey) {
      // Save mock session to Firestore
      const sessionRef = doc(db, 'paymentSessions', sessionId);
      await setDoc(sessionRef, {
        provider: 'mock',
        clubId,
        subscriptionId,
        amount,
        currency,
        billingCycle,
        userName,
        userEmail,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Return mock payment URL
      const mockPaymentUrl = `${returnUrl}/api/payment/callback?sessionId=${sessionId}&mock=true`;

      return NextResponse.json({
        success: true,
        sessionId,
        paymentUrl: mockPaymentUrl,
        provider: 'mock',
        mode: 'development',
      });
    }

    // For production with iyzico configured, we need to call iyzico API directly
    // Since the iyzipay SDK has compatibility issues with Turbopack,
    // we use the REST API directly
    const baseUrl = iyzicoEnv === 'production'
      ? 'https://api.iyzipay.com'
      : 'https://sandbox-api.iyzipay.com';

    const conversationId = sessionId;
    const basketId = `basket_${Date.now()}`;

    // Prepare buyer info
    const nameParts = userName.split(' ');
    const buyer = {
      id: `club_${clubId}`,
      name: nameParts[0] || 'Club',
      surname: nameParts.slice(1).join(' ') || 'Admin',
      gsmNumber: userPhone || '+905000000000',
      email: userEmail || 'club@example.com',
      identityNumber: '11111111111',
      registrationAddress: 'Istanbul, Turkey',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      city: 'Istanbul',
      country: 'Turkey',
    };

    const address = {
      contactName: userName || 'Club Admin',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Istanbul, Turkey',
    };

    const paymentDescription = billingCycle === 'monthly'
      ? `Be Tennis - ${clubName} - Aylık Abonelik`
      : `Be Tennis - ${clubName} - Yıllık Abonelik`;

    const basketItems = [
      {
        id: subscriptionId,
        name: paymentDescription,
        category1: 'Yazılım',
        category2: 'SaaS',
        itemType: 'VIRTUAL',
        price: amount.toFixed(2),
      },
    ];

    const iyzicoRequestBody = {
      locale: 'tr',
      conversationId,
      price: amount.toFixed(2),
      paidPrice: amount.toFixed(2),
      currency: 'TRY',
      basketId,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || returnUrl}/api/payment/callback?provider=iyzico&conversationId=${conversationId}`,
      buyer,
      shippingAddress: address,
      billingAddress: address,
      basketItems,
      enabledInstallments: [1],
    };

    // Generate iyzico authorization header
    const randomString = Math.random().toString(36).substring(2, 15);
    const hashString = `${iyzicoApiKey}${randomString}${iyzicoSecretKey}${JSON.stringify(iyzicoRequestBody)}`;
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha1').update(hashString).digest('base64');
    const authorizationHeader = `IYZWS ${iyzicoApiKey}:${hash}`;

    try {
      const iyzicoResponse = await fetch(`${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorizationHeader,
          'x-iyzi-rnd': randomString,
        },
        body: JSON.stringify(iyzicoRequestBody),
      });

      const iyzicoResult = await iyzicoResponse.json();

      if (iyzicoResult.status === 'success') {
        // Save session to Firestore
        const sessionRef = doc(db, 'paymentSessions', conversationId);
        await setDoc(sessionRef, {
          provider: 'iyzico',
          token: iyzicoResult.token,
          conversationId,
          clubId,
          subscriptionId,
          amount,
          currency,
          billingCycle,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          sessionId: conversationId,
          paymentUrl: iyzicoResult.paymentPageUrl,
          provider: 'iyzico',
        });
      } else {
        // Fall back to mock payment on error
        console.error('iyzico error:', iyzicoResult);

        const sessionRef = doc(db, 'paymentSessions', sessionId);
        await setDoc(sessionRef, {
          provider: 'mock',
          clubId,
          subscriptionId,
          amount,
          currency,
          billingCycle,
          status: 'pending',
          iyzicoError: iyzicoResult.errorMessage,
          createdAt: serverTimestamp(),
        });

        const mockPaymentUrl = `${returnUrl}/api/payment/callback?sessionId=${sessionId}&mock=true`;

        return NextResponse.json({
          success: true,
          sessionId,
          paymentUrl: mockPaymentUrl,
          provider: 'mock',
          mode: 'fallback',
        });
      }
    } catch (fetchError) {
      console.error('iyzico fetch error:', fetchError);

      // Fall back to mock payment
      const sessionRef = doc(db, 'paymentSessions', sessionId);
      await setDoc(sessionRef, {
        provider: 'mock',
        clubId,
        subscriptionId,
        amount,
        currency,
        billingCycle,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const mockPaymentUrl = `${returnUrl}/api/payment/callback?sessionId=${sessionId}&mock=true`;

      return NextResponse.json({
        success: true,
        sessionId,
        paymentUrl: mockPaymentUrl,
        provider: 'mock',
        mode: 'fallback',
      });
    }
  } catch (error: any) {
    console.error('Payment session error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
