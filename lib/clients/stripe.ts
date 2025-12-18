import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Stripe Price IDs for each plan
// These should be created in your Stripe Dashboard under Products
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_ID_STARTER || 'price_starter', // Replace with actual price ID
  professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL || 'price_professional', // Replace with actual price ID
  turbo: process.env.STRIPE_PRICE_ID_TURBO || 'price_turbo', // Replace with actual price ID
} as const;

export type SubscriptionPlan = keyof typeof STRIPE_PRICE_IDS;

