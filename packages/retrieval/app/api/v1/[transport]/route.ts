import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
const handler = createMcpHandler(
  (server) => {
    server.tool(
      "roll_dice",
      "Rolls an N-sided die",
      {
        sides: z.number().int().min(2),
      },
      async ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [{ type: "text", text: `🎲 You rolled a ${value}!` }],
        };
      }
    );

    server.tool(
      "random_yes_no",
      "Returns a random yes or no answer",
      {},
      async () => {
        const isYes = Math.random() < 0.5;
        const answer = isYes ? "Yes" : "No";
        return {
          content: [{ type: "text", text: `${answer}!` }],
        };
      }
    );

  },
  {
    // Optional server options
  },
  {
    // Optional redis config
    basePath: "/api/v1", // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
  }
);
export { handler as GET, handler as POST };
