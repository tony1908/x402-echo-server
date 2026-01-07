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

// STX402 API x402 info endpoint - comprehensive multi-category API
app.get("/x402-stx402", (_req: Request, res: Response) => {
    const serverAddress = process.env.SERVER_ADDRESS || "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
    const baseAmount = "1000"; // 0.001 STX base price

    res.status(402).json({
        x402Version: 1,
        name: "STX402 API",
        description: "X402 micropayment-gated API endpoints on Stacks. Pay-per-use with STX, sBTC, or USDCx.",
        image: "https://stx402.com/logo.png",
        accepts: [
            // ===== STACKS ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/get-bns-name/:address",
                description: "Get primary BNSV2 name for Stacks address",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { address: { type: "string", required: true } } },
                    output: { name: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/validate-address/:address",
                description: "Validate a Stacks address",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { address: { type: "string", required: true } } },
                    output: { valid: "boolean", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/convert-address/:address",
                description: "Convert Stacks address to specified network",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { address: { type: "string", required: true } }, queryParams: { network: { type: "string", enum: ["mainnet", "testnet"] } } },
                    output: { address: "string", convertedAddress: "string", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/decode-clarity-hex",
                description: "Decode Clarity value from hex string",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { hex: { type: "string", required: true } } },
                    output: { decoded: "object", hex: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/contract-source/:contract_id",
                description: "Get contract source code and hash (cacheable indefinitely)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { contract_id: { type: "string", required: true } } },
                    output: { contractId: "string", source: "string", hash: "string", publishHeight: "integer", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/contract-abi/:contract_id",
                description: "Get contract ABI/interface (cacheable indefinitely)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { contract_id: { type: "string", required: true } } },
                    output: { contractId: "string", abi: "object", summary: "object", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/to-consensus-buff",
                description: "Serialize a Clarity value to consensus buffer",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { value: { type: "object", required: true } } },
                    output: { hex: "string", bytes: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/from-consensus-buff",
                description: "Deserialize a consensus buffer to Clarity value",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { hex: { type: "string", required: true } } },
                    output: { type: "string", value: "object", repr: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/decode-tx",
                description: "Decode raw Stacks transaction hex",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { hex: { type: "string", required: true } } },
                    output: { version: "integer", chainId: "integer", authType: "string", payloadType: "string", payload: "object", fee: "string", nonce: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/call-readonly",
                description: "Call a read-only Clarity function",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { contractAddress: { type: "string", required: true }, contractName: { type: "string", required: true }, functionName: { type: "string", required: true }, functionArgs: { type: "array" }, senderAddress: { type: "string" } } },
                    output: { result: "object", okay: "boolean", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/stx-balance/:address",
                description: "Get STX balance for an address",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { address: { type: "string", required: true } } },
                    output: { address: "string", balance: "string", balanceFormatted: "string", locked: "string", nonce: "integer", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/block-height",
                description: "Get current Stacks block height and network status",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET" },
                    output: { stacksBlockHeight: "integer", burnBlockHeight: "integer", stacksTip: "string", serverVersion: "string", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/ft-balance/:address",
                description: "Get SIP-010 fungible token balances for an address",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { address: { type: "string", required: true } } },
                    output: { address: "string", tokens: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/nft-holdings/:address",
                description: "Get NFT holdings for an address",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { address: { type: "string", required: true } }, queryParams: { limit: { type: "integer", default: 50 } } },
                    output: { address: "string", nfts: "array", total: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/stacks/tx-status/:txid",
                description: "Get transaction status by txid",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { txid: { type: "string", required: true } } },
                    output: { txid: "string", status: "string", type: "string", tokenType: "string" }
                }
            },

            // ===== AI ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000", // Higher price for AI
                resource: "/api/ai/dad-joke",
                description: "Generate a dad joke using AI inference",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET" },
                    output: { joke: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "10000", // Higher price for vision AI
                resource: "/api/ai/image-describe",
                description: "Describe image and generate tags using vision AI",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 120,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { image: { type: "string", required: true }, prompt: { type: "string" } } },
                    output: { description: "string", tags: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "10000",
                resource: "/api/ai/tts",
                description: "Generate speech from text using TTS AI (English/Spanish)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 120,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, speaker: { type: "string" } } },
                    output: { audio: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/ai/summarize",
                description: "Summarize text using AI inference",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, max_length: { type: "number", default: 100 } } },
                    output: { summary: "string", original_length: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "50000", // High price for image generation
                resource: "/api/ai/generate-image",
                description: "Generate image from text prompt using Flux AI",
                mimeType: "image/png",
                payTo: serverAddress,
                maxTimeoutSeconds: 180,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { prompt: { type: "string", required: true } } },
                    output: { binary: "image/png" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "20000",
                resource: "/api/ai/explain-contract/:contract_id",
                description: "AI analysis of a Clarity smart contract",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 120,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { contract_id: { type: "string", required: true } } },
                    output: { contractId: "string", explanation: "string", category: "string", riskFlags: "array", functionSummaries: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/ai/translate",
                description: "Translate text between languages using AI",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, target: { type: "string", required: true }, source: { type: "string" } } },
                    output: { translated: "string", source: "string", target: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "3000",
                resource: "/api/ai/sentiment",
                description: "Analyze sentiment of text",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, detailed: { type: "boolean", default: false } } },
                    output: { sentiment: "string", confidence: "number", score: "number", emotions: "object", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "3000",
                resource: "/api/ai/keywords",
                description: "Extract keywords from text",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, count: { type: "integer", default: 10 } } },
                    output: { keywords: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/ai/language-detect",
                description: "Detect the language of text",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true } } },
                    output: { language: "string", code: "string", confidence: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/ai/paraphrase",
                description: "Paraphrase text in different styles",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, style: { type: "string", enum: ["formal", "casual", "simple", "academic", "creative"] } } },
                    output: { original: "string", paraphrased: "string", style: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "3000",
                resource: "/api/ai/grammar-check",
                description: "Check grammar and suggest corrections",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true } } },
                    output: { original: "string", corrected: "string", issues: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/ai/question-answer",
                description: "Answer a question based on provided context",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { context: { type: "string", required: true }, question: { type: "string", required: true } } },
                    output: { question: "string", answer: "string", confidence: "number", tokenType: "string" }
                }
            },

            // ===== RANDOM ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/uuid",
                description: "Generate a cryptographically secure UUID v4",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET" },
                    output: { uuid: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/number",
                description: "Generate cryptographically secure random numbers",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { min: { type: "integer", default: 0 }, max: { type: "integer", default: 100 }, count: { type: "integer", default: 1 } } },
                    output: { numbers: "array", min: "integer", max: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/string",
                description: "Generate cryptographically secure random string",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { length: { type: "integer", default: 16 }, charset: { type: "string", default: "alphanumeric" } } },
                    output: { string: "string", length: "integer", charset: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/password",
                description: "Generate a secure random password",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { length: { type: "integer", default: 16 }, uppercase: { type: "boolean" }, lowercase: { type: "boolean" }, numbers: { type: "boolean" }, symbols: { type: "boolean" } } },
                    output: { password: "string", length: "integer", entropy: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/color",
                description: "Generate random colors in various formats",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { format: { type: "string", default: "all" }, count: { type: "integer", default: 1 } } },
                    output: { colors: "array", count: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/dice",
                description: "Roll dice with standard or custom notation",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { notation: { type: "string", default: "1d6" } } },
                    output: { notation: "string", rolls: "array", kept: "array", modifier: "integer", total: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/random/shuffle",
                description: "Randomly shuffle an array",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { items: { type: "array", required: true } } },
                    output: { shuffled: "array", count: "integer", tokenType: "string" }
                }
            },

            // ===== MATH ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/math/calculate",
                description: "Evaluate a mathematical expression",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { expression: { type: "string", required: true }, precision: { type: "integer", default: 10 } } },
                    output: { expression: "string", result: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/math/percentage",
                description: "Calculate percentages and percentage changes",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { operation: { type: "string", required: true }, value: { type: "number" }, percent: { type: "number" }, from: { type: "number" }, to: { type: "number" } } },
                    output: { operation: "string", result: "number", explanation: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/math/statistics",
                description: "Calculate statistics for a dataset",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { numbers: { type: "array", required: true } } },
                    output: { count: "integer", sum: "number", mean: "number", median: "number", mode: "array", min: "number", max: "number", range: "number", variance: "number", standardDeviation: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/math/prime-check",
                description: "Check if a number is prime and find nearby primes",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { number: { type: "integer", required: true } } },
                    output: { number: "integer", isPrime: "boolean", factors: "array", nextPrime: "integer", previousPrime: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/math/gcd-lcm",
                description: "Calculate GCD and LCM",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { numbers: { type: "array", required: true } } },
                    output: { numbers: "array", gcd: "integer", lcm: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/math/factorial",
                description: "Calculate factorial and related functions",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { n: { type: "integer", required: true }, operation: { type: "string", default: "factorial" }, r: { type: "integer" } } },
                    output: { n: "integer", operation: "string", result: "number", formula: "string", tokenType: "string" }
                }
            },

            // ===== TEXT ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/text/base64-encode",
                description: "Encode text to base64 (UTF-8 safe)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, urlSafe: { type: "boolean", default: false } } },
                    output: { encoded: "string", urlSafe: "boolean", inputLength: "integer", outputLength: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/text/base64-decode",
                description: "Decode base64 to text (UTF-8 safe)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { encoded: { type: "string", required: true }, urlSafe: { type: "boolean", default: false } } },
                    output: { decoded: "string", urlSafe: "boolean", inputLength: "integer", outputLength: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/text/sha256",
                description: "Compute SHA-256 hash using SubtleCrypto",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, encoding: { type: "string", default: "hex" } } },
                    output: { hash: "string", algorithm: "string", encoding: "string", inputLength: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/text/sha512",
                description: "Compute SHA-512 hash using SubtleCrypto",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, encoding: { type: "string", default: "hex" } } },
                    output: { hash: "string", algorithm: "string", encoding: "string", inputLength: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/text/keccak256",
                description: "Compute Keccak-256 hash (Ethereum/Clarity compatible)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, encoding: { type: "string", default: "hex" } } },
                    output: { hash: "string", algorithm: "string", encoding: "string", inputLength: "integer", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/text/hash160",
                description: "Compute Hash160: RIPEMD160(SHA256(x)) - Bitcoin/Clarity compatible",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { text: { type: "string", required: true }, encoding: { type: "string", default: "hex" } } },
                    output: { hash: "string", algorithm: "string", encoding: "string", inputLength: "integer", tokenType: "string" }
                }
            },

            // ===== UTILITY ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/util/timestamp",
                description: "Get current timestamp in multiple formats",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET" },
                    output: { unix: "integer", unixMs: "integer", iso: "string", utc: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/util/dns-lookup",
                description: "DNS lookup - resolve domain to records",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { domain: { type: "string", required: true }, type: { type: "string", default: "A" } } },
                    output: { domain: "string", type: "string", records: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/util/ip-info",
                description: "IP geolocation info",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { ip: { type: "string" } } },
                    output: { ip: "string", country: "string", countryCode: "string", region: "string", city: "string", postalCode: "string", latitude: "string", longitude: "string", timezone: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/util/qr-generate",
                description: "Generate QR code as SVG or base64",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { data: { type: "string", required: true }, format: { type: "string", default: "svg" }, size: { type: "integer", default: 200 } } },
                    output: { base64: "string", mimeType: "string", tokenType: "string" }
                }
            },

            // ===== NETWORK ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/net/geo-ip",
                description: "Geo-locate requester's IP using Cloudflare edge data",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET" },
                    output: { ip: "string", country: "string", countryCode: "string", continent: "string", region: "string", city: "string", latitude: "string", longitude: "string", timezone: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/net/asn-lookup",
                description: "ASN/ISP info for requester's IP",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET" },
                    output: { ip: "string", asn: "integer", asOrganization: "string", httpProtocol: "string", tlsVersion: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/net/http-probe",
                description: "Probe a URL for status, timing, headers, and redirect chain",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { url: { type: "string", required: true }, method: { type: "string", default: "HEAD" }, followRedirects: { type: "boolean", default: true } } },
                    output: { url: "string", finalUrl: "string", status: "integer", statusText: "string", timing: "object", headers: "object", redirectChain: "array", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/net/ssl-check",
                description: "Check SSL/TLS certificate and HTTPS connectivity",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { domain: { type: "string", required: true }, port: { type: "integer", default: 443 } } },
                    output: { domain: "string", valid: "boolean", protocol: "string", httpVersion: "string", responseTime: "number", securityHeaders: "object", tokenType: "string" }
                }
            },

            // ===== KV STORAGE ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/kv/set",
                description: "Store a value with optional TTL",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { key: { type: "string", required: true }, value: { required: true }, ttl: { type: "number" }, visibility: { type: "string", default: "private" } } },
                    output: { success: "boolean", key: "string", visibility: "string", expiresAt: "string", bytes: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/kv/get",
                description: "Retrieve a stored value by key",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { key: { type: "string", required: true }, owner: { type: "string" } } },
                    output: { key: "string", value: "any", visibility: "string", createdAt: "string", bytes: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/kv/delete",
                description: "Delete a stored value by key",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { key: { type: "string", required: true } } },
                    output: { success: "boolean", deleted: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/kv/list",
                description: "List stored keys with optional prefix filter",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { prefix: { type: "string" }, visibility: { type: "string", default: "all" }, limit: { type: "number", default: 100 } } },
                    output: { keys: "array", cursor: "string", complete: "boolean", tokenType: "string" }
                }
            },

            // ===== PASTE ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/paste/create",
                description: "Create a paste and get a short code",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { content: { type: "string", required: true }, language: { type: "string" }, ttl: { type: "number" } } },
                    output: { code: "string", url: "string", expiresAt: "string", bytes: "number", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/paste/:code",
                description: "Retrieve a paste by short code",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", pathParams: { code: { type: "string", required: true } } },
                    output: { code: "string", content: "string", language: "string", createdAt: "string", createdBy: "string", bytes: "number", tokenType: "string" }
                }
            },

            // ===== MEMORY ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/memory/store",
                description: "Store a memory with metadata and optional embedding",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 120,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { key: { type: "string", required: true }, content: { type: "string", required: true }, metadata: { type: "object" }, generateEmbedding: { type: "boolean", default: true }, ttl: { type: "number" } } },
                    output: { key: "string", stored: "boolean", hasEmbedding: "boolean", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/memory/recall",
                description: "Retrieve a memory by key",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { key: { type: "string", required: true } } },
                    output: { key: "string", content: "string", summary: "string", tags: "array", type: "string", importance: "number", hasEmbedding: "boolean", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/memory/search",
                description: "Search memories semantically using AI embeddings",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 120,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { query: { type: "string", required: true }, limit: { type: "number", default: 10 }, filter: { type: "object" } } },
                    output: { query: "string", results: "array", count: "number", tokenType: "string" }
                }
            },

            // ===== REGISTRY ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "5000",
                resource: "/api/registry/probe",
                description: "Probe an x402 endpoint to discover payment requirements",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { url: { type: "string", required: true }, timeout: { type: "number", default: 10000 } } },
                    output: { success: "boolean", isX402Endpoint: "boolean", data: "object", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "10000",
                resource: "/api/registry/register",
                description: "Register an x402 endpoint in the registry",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 120,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { url: { type: "string", required: true }, name: { type: "string", required: true }, description: { type: "string", required: true }, category: { type: "string" }, tags: { type: "array" } } },
                    output: { success: "boolean", entry: "object", probeResult: "object", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/registry/details",
                description: "Get full details of a registered x402 endpoint with live health check",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { url: { type: "string" }, id: { type: "string" }, liveProbe: { type: "boolean", default: true } } },
                    output: { entry: "object", liveStatus: "object", tokenType: "string" }
                }
            },

            // ===== AGENT REGISTRY ENDPOINTS =====
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/agent/info",
                description: "Get full agent info (owner, URI) from ERC-8004 registry",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { agentId: { type: "number", required: true } } },
                    output: { agentId: "number", owner: "string", uri: "string", network: "string", contractId: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/agent/owner",
                description: "Get agent owner by ID",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { agentId: { type: "number", required: true } } },
                    output: { agentId: "number", owner: "string", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/agent/uri",
                description: "Get agent metadata URI by ID",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "GET", queryParams: { agentId: { type: "number", required: true } } },
                    output: { agentId: "number", uri: "string", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: "2000",
                resource: "/api/agent/lookup",
                description: "Lookup agents by owner address",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { owner: { type: "string", required: true }, startId: { type: "number", default: 0 }, maxScan: { type: "number", default: 100 } } },
                    output: { owner: "string", agents: "array", count: "number", scanned: "number", hasMore: "boolean", network: "string", tokenType: "string" }
                }
            },
            {
                scheme: "exact",
                network: "stacks",
                maxAmountRequired: baseAmount,
                resource: "/api/agent/reputation/summary",
                description: "Get reputation summary (count, average, total score)",
                mimeType: "application/json",
                payTo: serverAddress,
                maxTimeoutSeconds: 60,
                asset: "STX",
                outputSchema: {
                    input: { type: "http", method: "POST", bodyType: "json", bodyFields: { agentId: { type: "number", required: true } } },
                    output: { agentId: "number", count: "number", averageScore: "number", network: "string", tokenType: "string" }
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
