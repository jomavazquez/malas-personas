import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const loadDeck = (filename) => JSON.parse(readFileSync(join(__dirname, "data", filename), "utf-8"));

const seedDeck = async (deckData) => {
  const existing = await prisma.deck.findFirst({
    where: { name: deckData.name, language: deckData.language },
  });

  if (existing) {
    console.log(`⏭️  Skipping "${deckData.name}" (${deckData.language}) — already exists`);
    return;
  }

  const deck = await prisma.deck.create({
    data: {
      name: deckData.name,
      language: deckData.language,
      cards: {
        create: [
          ...deckData.blacks.map((card) => ({ type: "BLACK", text: card.text, blanks: card.blanks })),
          ...deckData.whites.map((text) => ({ type: "WHITE", text, blanks: 0 })),
        ],
      },
    },
  });

  console.log(`✅ Seeded "${deck.name}" (${deck.language}) — ${deckData.blacks.length} black, ${deckData.whites.length} white`);
};

const main = async () => {
  console.log("🌱 Starting seed...\n");
  await seedDeck(loadDeck("deck-base-es.json"));
  await seedDeck(loadDeck("deck-base-en.json"));
  console.log("\n🎉 Seed complete");
};

main()
  .catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
