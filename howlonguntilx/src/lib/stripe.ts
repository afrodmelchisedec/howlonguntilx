
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const PLANS = {
  PRO_MONTHLY: {
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    name: 'Pro Monthly',
    price: '$4/mo',
    features: [
      'All premium analytics (crypto, life, world)',
      'Unlimited saved countdowns',
      'Priority reminders',
      'No ads',
      'Custom embed themes',
      'API access (1000 req/min)',
    ],
  },
};
