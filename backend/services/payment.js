import Razorpay from "razorpay";
import Product from "../models/Product.js";

// Built lazily (not at module load time) so the client is only constructed once
// env vars are guaranteed to be loaded, and so a missing key gives a clear error
// at the moment a payment link is actually requested, not an opaque crash on boot.
let razorpay;
function getClient() {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing — check backend/.env is filled in and named .env (not .env.example)."
      );
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// Creates a real Razorpay Payment Link (test mode) for a given product.
// Docs: https://razorpay.com/docs/api/payment-links/
export async function createPaymentLink({ productId, customerName, discountPercent = 0, discountCode = "" }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  let finalPrice = product.price;
  if (discountPercent > 0) {
    finalPrice = Math.max(100, Math.round(product.price * (1 - discountPercent / 100)));
  }

  const description = discountCode 
    ? `${product.name} (${discountPercent}% OFF with ${discountCode})`
    : product.name;

  const link = await getClient().paymentLink.create({
    amount: finalPrice, // paise
    currency: "INR",
    description,
    customer: customerName ? { name: customerName } : undefined,
    notify: { sms: false, email: false },
    reminder_enable: false,
  });

  return { 
    url: link.short_url, 
    id: link.id, 
    product: product.name, 
    amount: finalPrice,
    originalAmount: product.price,
    discountCode: discountCode || null,
    discountPercent: discountPercent || 0
  };
}
