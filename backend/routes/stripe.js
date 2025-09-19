const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, totalAmount, address, userEmail, clientReferenceId } =
      req.body;

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !totalAmount ||
      !address ||
      !userEmail ||
      !clientReferenceId
    ) {
      return res.status(400).json({
        msg: "Items, totalAmount, address, userEmail, and clientReferenceId are required",
      });
    }

    const lineItems = items.map((item) => {
      if (
        !item.name ||
        !item.price ||
        !item.quantity ||
        item.price <= 0 ||
        item.quantity <= 0
      ) {
        throw new Error(`Invalid item data: ${item.name || "unknown"}`);
      }
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: Math.floor(item.quantity),
      };
    });

    const orderData = encodeURIComponent(
      JSON.stringify({
        items,
        totalAmount,
        address,
        userEmail,
        clientReferenceId,
      })
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `http://localhost:3000/payment/success?orderData=${orderData}`,
      cancel_url: "http://localhost:3000/payment/cancel",
      client_reference_id: clientReferenceId,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe error:", err.message, err.stack);
    res
      .status(500)
      .json({ msg: `Failed to create checkout session: ${err.message}` });
  }
});

module.exports = router;
