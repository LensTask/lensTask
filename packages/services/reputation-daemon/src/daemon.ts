import "dotenv/config";
import { Client } from "pg";
import { Bonsai } from "bonsai-sdk";

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const bonsai = new Bonsai(process.env.BONSAI_API_KEY!);

setInterval(async () => {
  const { rows } = await db.query<
    { profileid: string; answers: number; gho: string }
  >("SELECT * FROM profile_stats");
  for (const row of rows) {
    await bonsai.update({
      templateId: "lin.reputation.badge",
      tokenId: row.profileid,
      inputs: {
        answersAccepted: row.answers,
        totalGhoEarned: row.gho
      }
    });
  }
  console.log("badge refresh run");
}, 60_000);
