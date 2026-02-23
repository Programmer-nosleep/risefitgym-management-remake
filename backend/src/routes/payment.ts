import { Elysia, t } from "elysia";
import Midtrans from "midtrans-client";

export const paymentRoutes = new Elysia({ prefix: "/payment" })
    .derive(() => {
        const snap = new Midtrans.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });
        return { snap };
    })
    .post(
        "/token",
        async ({ body, snap }) => {
            const { order_id, amount } = body;

            const parameter = {
                transaction_details: {
                    order_id: order_id,
                    gross_amount: amount,
                },
                credit_card: {
                    secure: true,
                },
            };

            try {
                const transaction = await snap.createTransaction(parameter);
                return {
                    token: transaction.token,
                    redirect_url: transaction.redirect_url,
                };
            } catch (error: any) {
                return {
                    status: "error",
                    message: error.message,
                };
            }
        },
        {
            body: t.Object({
                order_id: t.String(),
                amount: t.Number(),
            }),
        }
    )
    .post("/notification", async ({ body }) => {
        // Handle Midtrans Webhook
        console.log("Midtrans Notification Received:", body);

        // In a real app, you would verify the notification signature and update the DB
        // const { order_id, transaction_status, fraud_status } = body;

        return { status: "ok" };
    });
