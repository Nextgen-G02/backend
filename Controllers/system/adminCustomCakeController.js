import CustomCake from '../../models/customCake.model.js';
import sendEmail from '../../utils/sendEmail.js';

// Get all custom cake requests for the admin dashboard
export const getAllRequests = async (req, res) => {
    try {
        const requests = await CustomCake.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching all custom cake requests:", error);
        res.status(500).json({ message: "Server error fetching requests." });
    }
};

// Update request status, set price, requirement, and send email
export const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, estimatedPrice, paymentRequired, reason } = req.body;

        const request = await CustomCake.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        // Update fields
        if (status) request.status = status;
        if (estimatedPrice !== undefined) request.estimatedPrice = estimatedPrice;
        if (paymentRequired) request.paymentRequired = paymentRequired;

        await request.save();

        // Send email if status is changed to Approved
        if (status === 'Approved' && request.email) {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                        <h2 style="color: #fff; margin: 0;">Your Custom Cake Request is Approved!</h2>
                    </div>
                    <div style="padding: 24px; background-color: #fff;">
                        <p style="color: #334155; font-size: 16px; margin-bottom: 16px;">Dear ${request.customerName},</p>
                        <p style="color: #334155; font-size: 16px; margin-bottom: 24px;">Great news! We have reviewed your custom cake request and are thrilled to bring your vision to life.</p>
                        
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                            <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Quote Details</h3>
                            <p style="margin: 8px 0; color: #475569;"><strong>Estimated Total Price:</strong> LKR ${request.estimatedPrice.toLocaleString()}</p>
                            <p style="margin: 8px 0; color: #475569;"><strong>Payment Required:</strong> ${request.paymentRequired === 'Half' ? '50% Deposit' : 'Full Payment'} (LKR ${request.paymentRequired === 'Half' ? (request.estimatedPrice / 2).toLocaleString() : request.estimatedPrice.toLocaleString()})</p>
                            <p style="margin: 8px 0; color: #475569;"><strong>Scheduled For:</strong> ${new Date(request.scheduleDate).toLocaleDateString()}</p>
                        </div>

                        <p style="color: #334155; font-size: 16px; margin-bottom: 24px;">Please log in to your account to complete the payment and confirm your order.</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-custom-orders" style="display: inline-block; background-color: #C29D59; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Pay Now to Confirm</a>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">Sweet Cake Shop &copy; ${new Date().getFullYear()}</p>
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    email: request.email,
                    subject: "Your Custom Cake Request Has Been Approved",
                    html: emailHtml
                });
            } catch (emailError) {
                console.error("Failed to send approval email:", emailError);
                // We still want to return success for the update even if email fails
            }
        }

        // Send email if rejected (optional but good practice)
        if (status === 'Rejected' && request.email) {
             const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                        <h2 style="color: #fff; margin: 0;">Update on Your Custom Cake Request</h2>
                    </div>
                    <div style="padding: 24px; background-color: #fff;">
                        <p style="color: #334155; font-size: 16px; margin-bottom: 16px;">Dear ${request.customerName},</p>
                        <p style="color: #334155; font-size: 16px; margin-bottom: 24px;">Thank you for your custom cake request. Unfortunately, we are unable to fulfill this request at this time.</p>
                        ${reason ? `<p style="color: #334155; font-size: 14px; margin-bottom: 24px; padding: 12px; background-color: #f1f5f9; border-left: 4px solid #94a3b8;"><strong>Reason:</strong> ${reason}</p>` : ''}
                        <p style="color: #334155; font-size: 16px;">If you have any questions, please feel free to contact us.</p>
                    </div>
                </div>
            `;
            try {
                await sendEmail({
                    email: request.email,
                    subject: "Update on Your Custom Cake Request",
                    html: emailHtml
                });
            } catch (emailError) {
                console.error("Failed to send rejection email:", emailError);
            }
        }

        res.status(200).json({ message: "Request updated successfully.", request });
    } catch (error) {
        console.error("Error updating request status:", error);
        res.status(500).json({ message: "Server error updating request." });
    }
};
