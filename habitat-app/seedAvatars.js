/**
 * Run this once to seed the Firestore avatars collection:
 *   node seedAvatars.js
 */
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDTgUzUJyus4_v8B6raB5nSj4pzGf0HH5E",
  authDomain: "habitat-71bbc.firebaseapp.com",
  projectId: "habitat-71bbc",
  storageBucket: "habitat-71bbc.firebasestorage.app",
  messagingSenderId: "294477577859",
  appId: "1:294477577859:web:78bc9d107482fbc2be65b6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AVATARS = [
  { id: "panda",   name: "Panda",   emoji: "🐼", milestoneRequired: 0,   assetKey: "panda",   order: 1 },
  { id: "turtle",  name: "Turtle",  emoji: "🐢", milestoneRequired: 0,   assetKey: "turtle",  order: 2 },
  { id: "dino",    name: "Dino",    emoji: "🦕", milestoneRequired: 0,   assetKey: "dino",    order: 3 },
  { id: "lion",    name: "Lion",    emoji: "🦁", milestoneRequired: 50,  assetKey: "lion",    order: 4 },
  { id: "penguin", name: "Penguin", emoji: "🐧", milestoneRequired: 100, assetKey: "penguin", order: 5 },
];

async function seed() {
  for (const avatar of AVATARS) {
    const { id, ...data } = avatar;
    await setDoc(doc(db, "avatars", id), data);
    console.log(`✅ Added: ${id}`);
  }
  console.log("🎉 Done! All avatars seeded.");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Error seeding:", e);
  process.exit(1);
});
