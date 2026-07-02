import crypto from 'crypto';
import Order from '../../models/order.model.js';

export const generateHash = (req, res) => {
    try {
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_SECRET;

        const { order_id, amount, currency = "LKR" } = req.body;

        if (!merchantId || !merchantSecret) {
            return res.status(500).json({ error: "PayHere credentials not configured" });
        }
        
        // Ensure amount is formatted to 2 decimal places as required by PayHere
        const formattedAmount = parseFloat(amount).toFixed(2);
        
        // Step 1: Generate MD5 of the merchant secret and uppercase it
        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        
        // Step 2: Concatenate merchantId, order_id, amount, currency, and the hashedSecret
        const hashString = `${merchantId}${order_id}${formattedAmount}${currency}${hashedSecret}`;
        
        // Step 3: Generate the final MD5 hash and uppercase it
        const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

        console.log("PAYHERE DEBUG => ", {
            merchantId,
            order_id,
            formattedAmount,
            currency,
            hashedSecret,
            hashString,
            finalHash: hash
        });

        res.json({ hash, merchantId, currency, amount: formattedAmount });
    } catch (error) {
        console.error("Error generating hash:", error);
        res.status(500).json({ error: error.message });
    }
};

export const payhereNotify = async (req, res) => {
    try {
        const merchantSecret = process.env.PAYHERE_SECRET;
        const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;

        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const hashString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`;
        const localMd5sig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
        
        // Verify that the callback is genuinely from PayHere
        if (localMd5sig === md5sig) {
            // Status Code 2 means successful payment
            if (status_code == 2) {
                // Payment Success - Update order
                const order = await Order.findById(order_id);
                if (order) {
                    order.paymentStatus = 'Paid';
                    await order.save();
                    console.log(`Order ${order_id} marked as Paid via PayHere webhook.`);
                }
            } else if (status_code == 0 || status_code == -1 || status_code == -2 || status_code == -3) {
                 console.log(`Payment failed or pending for order ${order_id} (Status: ${status_code})`);
            }
            // Always return 200 OK so PayHere knows we received the webhook
            res.status(200).send("OK");
        } else {
            console.error("PayHere Hash verification failed");
            res.status(400).send("Hash verification failed");
        }
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).send("Webhook error");
    }
};
