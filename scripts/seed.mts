/**
 * Seed script — populates MongoDB with demo data for VeriCampus.
 *
 * Run:  npx tsx scripts/seed.mts
 */

import mongoose from "mongoose";
import { webcrypto } from "node:crypto";

// ── Inline helpers (avoid @/ path alias issues outside Next.js) ──

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await webcrypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  webcrypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("hex");
}

const INITIAL_CREDIBILITY = 10;

// ── Mongoose schemas (duplicated so the script is self-contained) ──

const UserSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    emailHash: { type: String, required: true, unique: true, index: true },
    credibility: { type: Number, default: INITIAL_CREDIBILITY },
    cooldownUntil: { type: Date, default: null },
  },
  { timestamps: true },
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    media: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["open", "verified", "false", "disputed", "deleted"],
      default: "open",
      index: true,
    },
    posterTokenHash: { type: String, required: true, index: true },
    trustScore: { type: Number, default: 0 },
    interactionCount: { type: Number, default: 0 },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

const InteractionSchema = new mongoose.Schema(
  {
    interactionHash: { type: String, required: true, unique: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userTokenHash: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    credibilitySnapshot: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
const Interaction = mongoose.models.Interaction || mongoose.model("Interaction", InteractionSchema);

const RelationSchema = new mongoose.Schema(
  {
    sourcePostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    targetPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    creatorTokenHash: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    severed: { type: Boolean, default: false },
  },
  { timestamps: true },
);
RelationSchema.index({ sourcePostId: 1, targetPostId: 1 }, { unique: true });
const Relation = mongoose.models.Relation || mongoose.model("Relation", RelationSchema);

const RelationVoteSchema = new mongoose.Schema(
  {
    voteHash: { type: String, required: true, unique: true },
    relationId: { type: mongoose.Schema.Types.ObjectId, ref: "Relation", required: true, index: true },
    vote: { type: String, enum: ["up", "down"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
const RelationVote = mongoose.models.RelationVote || mongoose.model("RelationVote", RelationVoteSchema);

// ── Demo data ───────────────────────────────────────────────────

const DEMO_EMAILS = [
  "alex.rivera@stanford.edu",
  "jordan.chen@mit.edu",
  "priya.patel@berkeley.edu",
  "marcus.johnson@harvard.edu",
  "sofia.martinez@yale.edu",
  "liam.oconnor@columbia.edu",
  "aisha.williams@princeton.edu",
  "noah.kim@upenn.edu",
  "emma.thompson@cornell.edu",
  "dev.singh@caltech.edu",
  "olivia.brown@nyu.edu",
  "ethan.davis@uchicago.edu",
  "zara.ahmed@gatech.edu",
  "tyler.wilson@umich.edu",
  "maya.jackson@ucla.edu",
  "ryan.lee@cmu.edu",
  "chloe.nguyen@duke.edu",
  "kai.yamamoto@washu.edu",
];

interface DemoUser {
  email: string;
  token: string;
  tokenHash: string;
  emailHash: string;
  credibility: number;
}

const DEMO_POSTS: {
  titleTemplate: string;
  content: string;
  status: "open" | "verified" | "false" | "disputed";
  ratingBias: number; // center of rating distribution (1-5)
}[] = [
  // ── Verified rumors ──
  {
    titleTemplate: "Library closing 2 hours early on Fridays starting next month",
    content:
      "I overheard two librarians talking about new Friday hours. Apparently budget cuts are forcing them to close at 6 PM instead of 8 PM starting February 21st. This affects the main library and the science library. Has anyone else heard about this?",
    status: "verified",
    ratingBias: 4.5,
  },
  {
    titleTemplate: "New dining hall opening in the old student union building",
    content:
      "Construction crew has been working on the east wing of the old student union for weeks now. A friend who works in facilities confirmed it's going to be a new dining hall with international food stations. Expected to open mid-March. The menu is supposed to include halal, kosher, and vegan options.",
    status: "verified",
    ratingBias: 4.3,
  },
  {
    titleTemplate: "CS department adding a new AI/ML concentration next fall",
    content:
      "Professor Williams mentioned in lecture today that the CS department got approval for a new AI/ML concentration. It'll require Linear Algebra, Probability, and three new electives they're developing. Registration should be available for Fall 2026. This is huge for anyone interested in machine learning.",
    status: "verified",
    ratingBias: 4.6,
  },
  {
    titleTemplate: "Campus WiFi upgrade happening over spring break",
    content:
      "IT department sent an internal memo (leaked by a work-study student) about a full WiFi overhaul during spring break. They're replacing all access points in dorms and academic buildings with WiFi 7 equipment. Speed should jump from 500 Mbps to 2+ Gbps. The dead zones in the engineering building basement should finally be fixed.",
    status: "verified",
    ratingBias: 4.4,
  },
  // ── False rumors ──
  {
    titleTemplate: "University president reportedly resigning end of semester",
    content:
      "Heard from someone in the admin building that President Morrison is stepping down at the end of this semester. Supposedly there's a disagreement with the board about the new campus expansion project. No official statement yet but my source is usually reliable.",
    status: "false",
    ratingBias: 1.8,
  },
  {
    titleTemplate: "Tuition increasing 15% next academic year",
    content:
      "A student senator leaked that the board of trustees is voting on a 15% tuition increase for the 2026-2027 year. This would be the largest increase in the university's history. Supposedly it's to fund the new research center but students are furious.",
    status: "false",
    ratingBias: 1.5,
  },
  {
    titleTemplate: "Campus police getting tasers and body cameras by March",
    content:
      "My roommate's cousin works in campus safety and says officers are being trained to carry tasers starting in March. They're also getting body cameras. This is a huge policy shift from the current unarmed approach. Student government apparently wasn't consulted.",
    status: "false",
    ratingBias: 1.7,
  },
  // ── Disputed rumors ──
  {
    titleTemplate: "Professor caught using AI to grade final essays",
    content:
      "Multiple students in ENG 201 noticed their essay feedback contained identical phrasing and some comments referenced points they never made. Looks like Professor Harrison might be using ChatGPT to grade papers. At least 5 students have compared their feedback and found suspicious similarities. The department hasn't responded yet.",
    status: "disputed",
    ratingBias: 3.0,
  },
  {
    titleTemplate: "Secret underground tunnels connecting campus buildings",
    content:
      "Was exploring the basement of the physics building after hours and found a locked door with 'AUTHORIZED PERSONNEL ONLY' that I've never seen before. A maintenance worker told me there's a tunnel system connecting the physics, chemistry, and engineering buildings. Built during the Cold War apparently. Has anyone else found entrances?",
    status: "disputed",
    ratingBias: 3.2,
  },
  {
    titleTemplate: "Greek life getting banned after incident at Sigma house",
    content:
      "After last weekend's incident at the Sigma Chi house (ambulance was called around 2 AM), I'm hearing the administration is seriously considering suspending all Greek life activities for the rest of the semester. The Dean of Students office has been in meetings all week. Some say it's just Sigma Chi, others say it's all fraternities.",
    status: "disputed",
    ratingBias: 2.8,
  },
  // ── Open (recent) rumors ──
  {
    titleTemplate: "Free Patagonia jackets for all RAs next semester?",
    content:
      "Residence Life apparently got a sponsorship deal with Patagonia. Every RA is supposedly getting a free fleece jacket with the university logo. Sounds too good to be true but two different RAs in my building mentioned it independently. Anyone in ResLife able to confirm?",
    status: "open",
    ratingBias: 3.5,
  },
  {
    titleTemplate: "Someone's been living in the library basement",
    content:
      "Night security found a sleeping bag, a hot plate, and personal belongings in a storage room in the library basement. Apparently someone has been sleeping there for weeks. Library staff are being tight-lipped but a custodian confirmed they found the setup last Tuesday. Security is reviewing camera footage.",
    status: "open",
    ratingBias: 3.8,
  },
  {
    titleTemplate: "Dining hall food supplier linked to health code violations",
    content:
      "Our main food supplier, AraGourmet Services, just had 3 facilities in the state cited for health code violations according to public records I found online. Violations include improper food storage temperatures and pest issues. The university contract is up for renewal this spring. Should we be worried about our dining hall food?",
    status: "open",
    ratingBias: 3.4,
  },
  {
    titleTemplate: "New parking garage construction starting this summer",
    content:
      "Saw surveyors marking up the east parking lot near the gym yesterday. Overheard them mentioning a 4-story parking garage project. If true, where are commuter students supposed to park during construction? The east lot has 400 spaces. No announcement from admin yet.",
    status: "open",
    ratingBias: 3.6,
  },
  {
    titleTemplate: "Star basketball player seen in walking boot at health center",
    content:
      "Jaylen Morris, our starting point guard, was spotted in a walking boot at the campus health center this morning. The conference tournament is in 3 weeks. No update from the athletics department. He wasn't at practice yesterday either according to someone on the team. This could be devastating for our tournament run.",
    status: "open",
    ratingBias: 3.3,
  },
  {
    titleTemplate: "Psychology department experiment gone wrong — participants hospitalized?",
    content:
      "A friend who works as a research assistant in the psych department said a study involving sleep deprivation had two participants who needed medical attention. The study was supposedly approved by the IRB but the protocol may have been violated. The PI has been asked to suspend the study while it's being reviewed.",
    status: "open",
    ratingBias: 2.9,
  },
  {
    titleTemplate: "Campus bookstore being replaced by Amazon pickup center",
    content:
      "The campus bookstore has been slowly reducing inventory for months. Now I'm hearing it's going to be converted into an Amazon Hub pickup center and a smaller textbook-only shop. The current bookstore employees are apparently being offered severance. The student paper is supposedly working on a story about this.",
    status: "open",
    ratingBias: 3.1,
  },
  {
    titleTemplate: "Spotted: Film crew setting up in the quad for a Netflix production",
    content:
      "There are production trucks and lighting equipment being set up around the main quad right now. Someone talked to a crew member who said they're scouting/filming for a Netflix series set at a fictional university. Anyone know what show this could be? They had permits from the city.",
    status: "open",
    ratingBias: 4.0,
  },
  {
    titleTemplate: "Chemistry lab explosion was covered up by administration",
    content:
      "Three weeks ago there was a small chemical fire in Chem 302's lab section. Two students got minor burns. I was there. But the university never sent a safety alert or acknowledged it publicly. A facilities worker told me the lab was quietly repaired over the weekend. Where's the transparency?",
    status: "open",
    ratingBias: 3.5,
  },
  {
    titleTemplate: "IT department can read all your campus email without a warrant",
    content:
      "Read through the campus IT acceptable use policy and found a clause that says the university reserves the right to access any data on university systems 'for legitimate business purposes' without notifying the user. This includes email, cloud storage, and browsing history on campus WiFi. Did anyone else know about this?",
    status: "open",
    ratingBias: 3.7,
  },
  {
    titleTemplate: "Famous alumni donating $50M for new arts center",
    content:
      "A well-connected faculty member told me that a famous alumni (class of '98, now a tech CEO) is about to announce a $50 million donation for a state-of-the-art performing arts center. The announcement is supposedly planned for Founders' Day in April. This would be the largest single donation in university history.",
    status: "open",
    ratingBias: 3.9,
  },
  {
    titleTemplate: "Squirrels on campus are getting aggressive — multiple students bitten",
    content:
      "This is the third time this week I've seen a squirrel charge at someone near the oak grove. My friend actually got bitten on Tuesday and had to get a tetanus shot at the health center. The squirrels near the science building are especially bold. They're literally snatching food out of people's hands. Is the university going to do anything?",
    status: "open",
    ratingBias: 4.1,
  },
  {
    titleTemplate: "Janitor found hidden room behind wall in old history building",
    content:
      "A maintenance worker doing renovations in the history building (built 1923) broke through a wall and found a sealed-off room with old furniture, books from the 1940s, and what appears to be a prohibition-era bar setup. The room isn't on any building blueprints. Facilities took photos before sealing it back up. Anyone seen the pictures?",
    status: "open",
    ratingBias: 4.2,
  },
  {
    titleTemplate: "Meal plan prices going up but portions getting smaller",
    content:
      "Has anyone else noticed the portions at the main dining hall have gotten noticeably smaller this semester? The chicken breast used to be a full breast, now it's clearly half. Rice portions are smaller too. But the unlimited meal plan went up $200 this year. I weighed my plate — it's about 30% less food than last semester.",
    status: "open",
    ratingBias: 3.6,
  },
  {
    titleTemplate: "Campus ghost sighting in Thompson Hall caught on security camera",
    content:
      "A friend who works campus security showed me footage from Thompson Hall (the oldest building on campus) from last Friday at 3 AM. There's a weird white figure that moves across the hallway and through a wall. Could be a glitch but it's pretty creepy. Thompson Hall has had ghost stories since the 1950s. The video is apparently making rounds among security staff.",
    status: "open",
    ratingBias: 2.5,
  },
];

// ── Seed logic ──────────────────────────────────────────────────

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hackathon";
  console.log(`Connecting to ${MONGODB_URI} …`);
  await mongoose.connect(MONGODB_URI);

  // Clear existing data
  console.log("Clearing existing data …");
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Interaction.deleteMany({}),
    Relation.deleteMany({}),
    RelationVote.deleteMany({}),
  ]);

  // ── 1. Create users ──
  console.log("Creating users …");
  const users: DemoUser[] = [];
  for (const email of DEMO_EMAILS) {
    const token = generateToken();
    const tokenHash = await sha256(token);
    const emailHash = await sha256(email.toLowerCase().trim());
    // Vary credibility: most users have 8-15, a few higher (veterans), one low
    const credibility =
      users.length === 0
        ? 22 // first user is a veteran
        : users.length === 1
          ? 18
          : users.length === DEMO_EMAILS.length - 1
            ? 3 // last user has low credibility
            : Math.floor(Math.random() * 8) + 8; // 8-15
    users.push({ email, token, tokenHash, emailHash, credibility });
  }

  await User.insertMany(
    users.map((u) => ({
      tokenHash: u.tokenHash,
      emailHash: u.emailHash,
      credibility: u.credibility,
      cooldownUntil: null,
    })),
  );
  console.log(`  Created ${users.length} users`);

  // ── 2. Create posts ──
  console.log("Creating posts …");
  const now = Date.now();

  const postDocs = [];
  for (let i = 0; i < DEMO_POSTS.length; i++) {
    const p = DEMO_POSTS[i];
    const poster = users[i % users.length];

    // Stagger creation dates: evaluated posts are older, open posts are recent
    let createdAt: Date;
    if (p.status === "verified" || p.status === "false") {
      // 3-5 weeks ago (old enough to be evaluated)
      createdAt = new Date(now - (21 + Math.random() * 14) * 24 * 60 * 60 * 1000);
    } else if (p.status === "disputed") {
      // 2-4 weeks ago
      createdAt = new Date(now - (14 + Math.random() * 14) * 24 * 60 * 60 * 1000);
    } else {
      // Open: 0-13 days ago
      createdAt = new Date(now - Math.random() * 13 * 24 * 60 * 60 * 1000);
    }

    postDocs.push({
      title: p.titleTemplate,
      content: p.content,
      media: [],
      status: p.status,
      posterTokenHash: poster.tokenHash,
      trustScore: 0, // will be computed after interactions
      interactionCount: 0,
      evaluatedAt: p.status !== "open" ? new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000) : null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  const posts = await Post.insertMany(postDocs);
  console.log(`  Created ${posts.length} posts`);

  // ── 3. Create interactions (ratings) ──
  console.log("Creating interactions …");
  let interactionCount = 0;
  const interactionBulk: {
    interactionHash: string;
    postId: mongoose.Types.ObjectId;
    userTokenHash: string;
    rating: number;
    credibilitySnapshot: number;
    createdAt: Date;
  }[] = [];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    const template = DEMO_POSTS[pi];
    const postPoster = users[pi % users.length];

    // Decide how many ratings this post gets
    let raterCount: number;
    if (template.status !== "open") {
      // Evaluated posts need many interactions
      raterCount = Math.min(users.length - 1, 12 + Math.floor(Math.random() * 5));
    } else {
      // Open posts: 3-14 ratings
      raterCount = 3 + Math.floor(Math.random() * 12);
    }

    // Pick random raters (excluding poster)
    const availableRaters = users.filter((u) => u.tokenHash !== postPoster.tokenHash);
    const shuffled = availableRaters.sort(() => Math.random() - 0.5);
    const raters = shuffled.slice(0, raterCount);

    for (const rater of raters) {
      // Generate rating biased toward the template's bias
      const bias = template.ratingBias;
      let rating = Math.round(bias + (Math.random() - 0.5) * 2);
      rating = Math.max(1, Math.min(5, rating));

      const hash = await sha256(rater.token + post._id.toString());
      const ratingDate = new Date(
        post.createdAt.getTime() + Math.random() * (now - post.createdAt.getTime()),
      );

      interactionBulk.push({
        interactionHash: hash,
        postId: post._id as mongoose.Types.ObjectId,
        userTokenHash: rater.tokenHash,
        rating,
        credibilitySnapshot: rater.credibility,
        createdAt: ratingDate,
      });
      interactionCount++;
    }
  }

  await Interaction.insertMany(interactionBulk);
  console.log(`  Created ${interactionCount} interactions`);

  // ── 4. Compute trust scores ──
  console.log("Computing trust scores …");
  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    const interactions = interactionBulk.filter(
      (i) => i.postId.toString() === post._id.toString(),
    );

    // Weighted average: weight = log2(1 + credibilitySnapshot)
    let weightedSum = 0;
    let totalWeight = 0;
    for (const ix of interactions) {
      if (ix.credibilitySnapshot <= 0) continue;
      const w = Math.log2(1 + ix.credibilitySnapshot);
      weightedSum += ix.rating * w;
      totalWeight += w;
    }
    const trustScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    await Post.updateOne(
      { _id: post._id },
      {
        trustScore: Math.round(trustScore * 100) / 100,
        interactionCount: interactions.length,
      },
    );
  }
  console.log("  Trust scores updated");

  // ── 5. Create relations (evidence links) ──
  console.log("Creating relations …");
  const relationPairs: [number, number][] = [
    // Library closing + meal plan prices (budget theme)
    [0, 23],
    // CS concentration + WiFi upgrade (tech improvements)
    [2, 3],
    // Tuition increase + meal plan portions
    [5, 23],
    // Greek life + psych experiment (student safety)
    [9, 15],
    // Bookstore + Amazon (campus changes)
    [16, 13],
    // Professor AI grading + IT email policy (tech oversight)
    [7, 19],
    // Basketball player + film crew (campus buzz)
    [14, 17],
    // Hidden room + ghost sighting (campus mysteries)
    [21, 24],
    // Secret tunnels + hidden room
    [8, 21],
    // Dining hall food supplier + meal portions
    [12, 23],
    // Chemistry lab + psych experiment (safety)
    [18, 15],
    // Famous alumni donation + new dining hall
    [20, 1],
  ];

  const relationDocs = [];
  for (const [srcIdx, tgtIdx] of relationPairs) {
    const creator = users[Math.floor(Math.random() * users.length)];
    const upvotes = Math.floor(Math.random() * 8) + 1;
    const downvotes = Math.floor(Math.random() * 3);
    relationDocs.push({
      sourcePostId: posts[srcIdx]._id,
      targetPostId: posts[tgtIdx]._id,
      creatorTokenHash: creator.tokenHash,
      upvotes,
      downvotes,
      severed: false,
    });
  }

  const relations = await Relation.insertMany(relationDocs);
  console.log(`  Created ${relations.length} relations`);

  // ── 6. Create relation votes ──
  console.log("Creating relation votes …");
  let voteCount = 0;
  const voteBulk: {
    voteHash: string;
    relationId: mongoose.Types.ObjectId;
    vote: "up" | "down";
  }[] = [];

  for (const rel of relations) {
    // 3-8 voters per relation
    const voterCount = 3 + Math.floor(Math.random() * 6);
    const shuffledVoters = [...users].sort(() => Math.random() - 0.5).slice(0, voterCount);

    for (const voter of shuffledVoters) {
      const hash = await sha256(voter.token + rel._id.toString());
      const vote: "up" | "down" = Math.random() > 0.3 ? "up" : "down";
      voteBulk.push({
        voteHash: hash,
        relationId: rel._id as mongoose.Types.ObjectId,
        vote,
      });
      voteCount++;
    }
  }

  await RelationVote.insertMany(voteBulk);
  console.log(`  Created ${voteCount} relation votes`);

  // ── Done ──
  console.log("\n--- Seed complete ---");
  console.log(`  Users:        ${users.length}`);
  console.log(`  Posts:         ${posts.length}`);
  console.log(`  Interactions:  ${interactionCount}`);
  console.log(`  Relations:     ${relations.length}`);
  console.log(`  Votes:         ${voteCount}`);

  // Print a token the user can log in with
  console.log("\n--- Demo login tokens ---");
  console.log("Copy any token below and use it to log in:\n");
  for (const u of users.slice(0, 5)) {
    console.log(`  ${u.email.padEnd(35)} → ${u.token}`);
  }
  console.log(`  ... and ${users.length - 5} more users`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
