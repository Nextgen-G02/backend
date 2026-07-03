import Newsletter from "../../models/newsletter.model.js";
import NewsletterHistory from "../../models/newsletterHistory.model.js";
import sendEmail from "../../utils/sendEmail.js";

export const subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Check if already subscribed
        const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });

        if (existingSubscriber) {
            if (existingSubscriber.status === 'Unsubscribed') {
                // Resubscribe them
                existingSubscriber.status = 'Active';
                existingSubscriber.subscribedAt = Date.now();
                await existingSubscriber.save();
                return res.status(200).json({
                    success: true,
                    message: "Welcome back! You have been resubscribed."
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "This email is already subscribed to our newsletter."
                });
            }
        }

        // Create new subscription
        const newSubscriber = new Newsletter({
            email
        });

        await newSubscriber.save();

        res.status(201).json({
            success: true,
            message: "Subscribed successfully! Welcome to the Nirosha Sweet House family."
        });

    } catch (error) {
        console.error("Newsletter Subscription Error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while subscribing. Please try again later.",
            error: error.message
        });
    }
};

// ADMIN FUNCTIONS

export const getSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
        res.status(200).json({ success: true, data: subscribers });
    } catch (error) {
        console.error("Get Subscribers Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch subscribers", error: error.message });
    }
};

export const addSubscriber = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        if (existing) {
            if (existing.status === 'Unsubscribed') {
                existing.status = 'Active';
                existing.subscribedAt = Date.now();
                await existing.save();
                return res.status(200).json({ success: true, message: "Subscriber re-activated successfully", data: existing });
            }
            return res.status(400).json({ success: false, message: "Email is already subscribed" });
        }

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();
        res.status(201).json({ success: true, message: "Subscriber added successfully", data: newSubscriber });
    } catch (error) {
        console.error("Add Subscriber Error:", error);
        res.status(500).json({ success: false, message: "Failed to add subscriber", error: error.message });
    }
};

export const deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Newsletter.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Subscriber not found" });
        res.status(200).json({ success: true, message: "Subscriber deleted successfully" });
    } catch (error) {
        console.error("Delete Subscriber Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete subscriber", error: error.message });
    }
};

export const broadcastNewsletter = async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ success: false, message: "Subject and message are required" });
        }

        const activeSubscribers = await Newsletter.find({ status: 'Active' });

        if (activeSubscribers.length === 0) {
            return res.status(400).json({ success: false, message: "No active subscribers found" });
        }

        // Format message to support basic line breaks
        const formattedMessage = message.replace(/\n/g, '<br/>');

        // Professional HTML Template Wrapper
        const htmlTemplate = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
          <!-- Header Image / Banner Area -->
          <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Nirosha <span style="color: #C29D59; font-style: italic; font-weight: 400;">Sweet House</span></h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">Fresh Batches • Artisan Quality</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0;">${formattedMessage}</p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #C29D59; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Visit Our Shop</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Nirosha Sweet House. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">You are receiving this because you subscribed on our website.</p>
          </div>
        </div>
        `;

        // Create history record instantly so frontend updates immediately
        let newHistory;
        try {
            newHistory = await NewsletterHistory.create({
                subject,
                message: htmlTemplate, 
                sentCount: 0,
                failedCount: 0
            });
        } catch (historyErr) {
            console.error("Failed to create initial newsletter history:", historyErr);
        }

        // Immediately respond to the frontend
        res.status(200).json({
            success: true,
            message: `Newsletter broadcast started for ${activeSubscribers.length} subscribers.`,
            newHistory
        });

        // Run the email sending loop in the background
        setImmediate(async () => {
            let sentCount = 0;
            let failedCount = 0;

            for (const subscriber of activeSubscribers) {
                try {
                    await sendEmail({
                        email: subscriber.email,
                        subject: subject,
                        html: htmlTemplate
                    });
                    sentCount++;
                } catch (err) {
                    console.error(`Failed to send to ${subscriber.email}:`, err);
                    failedCount++;
                }
            }
            console.log(`Newsletter Broadcast Complete! Sent: ${sentCount}, Failed: ${failedCount}`);

            // Update the history record with final counts
            if (newHistory) {
                try {
                    await NewsletterHistory.findByIdAndUpdate(newHistory._id, {
                        sentCount,
                        failedCount
                    });
                } catch (updateErr) {
                    console.error("Failed to update newsletter history:", updateErr);
                }
            }
        });

    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ success: false, message: "Failed to start newsletter broadcast", error: error.message });
    }
};

export const getHistory = async (req, res) => {
    try {
        const history = await NewsletterHistory.find().sort({ sentAt: -1 });
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch newsletter history", error: error.message });
    }
};
