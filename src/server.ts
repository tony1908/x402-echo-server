import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { x402PaymentRequired } from "x402-stacks";
import { STXtoMicroSTX } from "x402-stacks";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const network = (process.env.NETWORK as "mainnet" | "testnet") || "mainnet";

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

// Echo endpoint - protected with x402 payment
app.post(
    "/echo",
    x402PaymentRequired({
        amount: STXtoMicroSTX(0.001), // 0.001 STX = 1000 microSTX
        address: process.env.SERVER_ADDRESS!,
        network,
        facilitatorUrl: process.env.FACILITATOR_URL,
    }),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { message } = req.body;

            if (!message) {
                res.status(400).json({ error: "Message is required" });
                return;
            }

            console.log("Echoing message:", message);

            res.json({
                echo: message,
                timestamp: new Date().toISOString(),
                originalLength: message.length
            });
        } catch (error) {
            console.error("Echo error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// x402 info endpoint - returns the x402 schema for registration
app.get("/x402", (_req: Request, res: Response) => {
    const serverAddress = process.env.SERVER_ADDRESS || "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";

    res.status(402).json({
        x402Version: 1,
        name: "Echo Demo Server",
        image: "https://x402scan.com/echo-logo.png",
        accepts: [
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "1000", // 0.001 STX = 1000 microSTX
                resource: "/echo",
                description: "Echo API - Returns your message back with metadata",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: {
                        type: "http",
                        method: "POST",
                        bodyType: "json",
                        bodyFields: {
                            message: {
                                type: "string",
                                required: true,
                                description: "The message to echo back"
                            }
                        }
                    },
                    output: {
                        echo: "string",
                        timestamp: "string",
                        originalLength: "number"
                    }
                }
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`x402 Echo Demo Server running on http://localhost:${PORT}`);
    console.log(`x402 info endpoint: http://localhost:${PORT}/x402`);
    console.log(`Echo endpoint: POST http://localhost:${PORT}/echo`);
    console.log(`Network: ${network}`);
});
