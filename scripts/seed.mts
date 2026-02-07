/**
 * Seed script — populates MongoDB with demo data for Unheard.
 *
 * Run:  pnpm seed
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
const FLAG_THRESHOLD_DELETE = 10;

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
    comment: { type: String, maxlength: 500, default: undefined },
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

const FlagSchema = new mongoose.Schema(
  {
    flagHash: { type: String, required: true, unique: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userTokenHash: { type: String, required: true, index: true },
    reason: { type: String, maxlength: 500, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
const Flag = mongoose.models.Flag || mongoose.model("Flag", FlagSchema);

// ── Demo data ───────────────────────────────────────────────────

const DEMO_EMAILS = [
  "ahmed.khan@seecs.nust.edu.pk",
  "fatima.ali@ceme.nust.edu.pk",
  "usman.raza@nice.nust.edu.pk",
  "ayesha.malik@smme.nust.edu.pk",
  "hamza.sheikh@sns.nust.edu.pk",
  "sana.tariq@scee.nust.edu.pk",
  "bilal.hassan@nbs.nust.edu.pk",
  "hira.ahmed@s3h.nust.edu.pk",
  "zain.amir@seecs.nust.edu.pk",
  "maham.noor@ceme.nust.edu.pk",
  "ali.raza@nice.nust.edu.pk",
  "nimra.saeed@smme.nust.edu.pk",
  "omer.farooq@sns.nust.edu.pk",
  "maryam.khan@scee.nust.edu.pk",
  "saad.iqbal@nbs.nust.edu.pk",
  "amna.batool@s3h.nust.edu.pk",
  "asad.mehmood@seecs.nust.edu.pk",
  "rabia.zulfiqar@ceme.nust.edu.pk",
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
  ratingBias: number;
}[] = [
  // ── Verified rumors ──
  {
    titleTemplate: "SEECS GPU workstations getting RTX 5090s next semester",
    content:
      "A lab instructor in SEECS told us during the AI lab that the department has ordered RTX 5090 GPUs for all workstations in the deep learning lab. They apparently got funding from HEC for this. Should arrive before Fall 2026. Currently we're stuck with 3060s that can barely train a ResNet. This would be massive for FYP students working on computer vision and NLP.",
    status: "verified",
    ratingBias: 4.5,
  },
  {
    titleTemplate: "Cafeteria C2 shutting down for renovation until March",
    content:
      "C2 cafeteria (the one near CEME) has a notice up saying it's closing for renovation starting next week. A worker there said they're expanding the seating area and adding a new BBQ section. Expected to reopen in mid-March. Meanwhile everyone from CEME/SMME side will have to walk to C1 or the SEECS dhaba.",
    status: "verified",
    ratingBias: 4.3,
  },
  {
    titleTemplate: "Shuttle timings changing — last bus at 6 PM instead of 8 PM",
    content:
      "The transport office put up a notice (saw it on the board near gate 1) that the last shuttle from H-12 campus will now leave at 6 PM instead of 8 PM. Effective from next Monday. This is going to be a disaster for evening lab students. Apparently it's a cost-cutting measure. The Islamabad route and Rawalpindi route are both affected.",
    status: "verified",
    ratingBias: 4.6,
  },
  {
    titleTemplate: "Free WiFi upgrade across hostels — WiFi 6 access points",
    content:
      "IT department confirmed during a meeting with hostel wardens that they're upgrading all hostel WiFi to WiFi 6. The work starts over the winter break. Hostels 1-8 on boys side and girls hostels will all get new access points. The speed should actually work now, especially in the older hostels where you can barely load a webpage after 10 PM.",
    status: "verified",
    ratingBias: 4.4,
  },
  // ── False rumors ──
  {
    titleTemplate: "NUST switching to semester GPA-only system — no CGPA",
    content:
      "Heard from a student in the registrar's office that NUST is planning to switch to a semester-GPA-only system where your transcript won't show a cumulative GPA. Apparently some international universities follow this model. They say the academic council already approved it for Fall 2026. If true this would completely change how grading pressure works here.",
    status: "false",
    ratingBias: 1.8,
  },
  {
    titleTemplate: "H-12 campus being merged with H-11 campus next year",
    content:
      "A friend in admin said NUST is planning to merge the H-12 and H-11 campuses into one. The H-11 campus would handle all undergrad programs and H-12 would become a dedicated research/postgrad campus. This would mean massive changes for hostels and transport. No official announcement yet but supposedly the VC has already signed off on it.",
    status: "false",
    ratingBias: 1.5,
  },
  {
    titleTemplate: "SEECS adding mandatory military fitness test for graduation",
    content:
      "Someone in our batch WhatsApp group shared a circular saying SEECS is introducing a mandatory physical fitness test as a graduation requirement. Running, pushups, the works. Because NUST is technically under the army. They say it starts next semester. Several profs apparently opposed it but it got pushed through. Can anyone confirm?",
    status: "false",
    ratingBias: 1.7,
  },
  // ── Disputed rumors ──
  {
    titleTemplate: "Prof using ChatGPT to grade CS 210 assignments",
    content:
      "Multiple students in CS 210 (Data Structures) compared their assignment feedback and found almost identical comments across different submissions. One feedback comment referenced a function that didn't exist in the student's code. At least 8 students have reported similar findings. Looks like the prof or TA is running submissions through ChatGPT for grading. The HOD hasn't responded to the email complaint yet.",
    status: "disputed",
    ratingBias: 3.0,
  },
  {
    titleTemplate: "Underground tunnels connecting SEECS, SMME, and the old library",
    content:
      "Was in the SEECS basement helping a lab instructor move equipment and noticed a locked steel door I'd never seen before. The instructor said there's a tunnel system connecting SEECS to SMME and the old library building. Built when the campus was originally constructed. Apparently maintenance staff use it sometimes. Has anyone else seen this? The door had a heavy padlock on it.",
    status: "disputed",
    ratingBias: 3.2,
  },
  {
    titleTemplate: "Hostel ragging incident covered up by administration",
    content:
      "Three freshmen in Hostel 5 were allegedly subjected to severe ragging last week. One needed medical attention at the campus clinic. The administration supposedly handled it internally without filing an FIR or issuing any public notice. The seniors involved are allegedly still in the hostel. Multiple witnesses but nobody wants to go on record because they fear retaliation.",
    status: "disputed",
    ratingBias: 2.8,
  },
  // ── Open (recent) rumors ──
  {
    titleTemplate: "NUST Olympiad prize money doubled to 2 lakh per event",
    content:
      "Organizing committee member for NUST Olympiad told me the prize money for all competitions is being doubled this year. First place in coding, robotics, and business competitions will get 2 lakh each instead of 1 lakh. Apparently they got a big sponsor from a telecom company. Registration opens next week. If true this would be the biggest Olympiad yet.",
    status: "open",
    ratingBias: 3.5,
  },
  {
    titleTemplate: "Someone's been sleeping in the SEECS building after hours",
    content:
      "Night security found a sleeping bag, snacks, and a laptop charger in the unused room behind Lab 7 in SEECS. Apparently someone has been staying there for at least two weeks. The room is supposed to be locked but the lock was broken. Security is checking camera footage. A janitor said they've been finding food wrappers there for a while. No idea if it's a student or someone from outside.",
    status: "open",
    ratingBias: 3.8,
  },
  {
    titleTemplate: "Mess food supplier failed health inspection — cockroaches found",
    content:
      "The mess food supplier (the one that handles hostels 3-6) apparently failed a surprise health inspection last week. A student who was there when the inspectors came says they found cockroaches in the storage area and expired spices. The mess committee is supposed to address this but nothing has been communicated to students. We deserve to know what we're eating.",
    status: "open",
    ratingBias: 3.4,
  },
  {
    titleTemplate: "New parking area being built — east ground near SMME gone",
    content:
      "Surveyors were marking up the east ground near SMME yesterday. Apparently they're building a new multi-level parking structure. If true, the cricket ground we use for evening matches will be gone. Commuter students need parking but so do we need that ground. No announcement from admin. Has anyone heard anything official?",
    status: "open",
    ratingBias: 3.6,
  },
  {
    titleTemplate: "Star cricketer from NUST team has stress fracture — out of intervarsity",
    content:
      "Zain Abbas, our opening batsman, was spotted at the campus medical center with his arm in a sling. The intervarsity tournament is in three weeks. He was the top scorer last year. The sports department hasn't said anything. A teammate said it's a stress fracture and he's out for at least 6 weeks. This would seriously hurt our chances.",
    status: "open",
    ratingBias: 3.3,
  },
  {
    titleTemplate: "Sleep deprivation study at SNS went wrong — participant hospitalized?",
    content:
      "A friend doing RA work at SNS (School of Natural Sciences) mentioned a sleep deprivation study had a participant who fainted during the experiment and was taken to PIMS. The study was approved by the ethics board but apparently the protocol wasn't followed properly. The PI has suspended the study. If this is true, there should be an investigation.",
    status: "open",
    ratingBias: 2.9,
  },
  {
    titleTemplate: "NUST bookshop closing — being replaced by an online-only system",
    content:
      "The campus bookshop near the library has been reducing inventory for months. A staff member said they're shutting down and all textbook orders will move to an online portal. Current employees are supposedly being offered transfers to admin roles. The bookshop has been here since forever. Where will freshmen get their lab manuals last-minute?",
    status: "open",
    ratingBias: 3.1,
  },
  {
    titleTemplate: "Film crew spotted on campus — drama serial being shot at NUST",
    content:
      "There are production vans and lighting equipment near the main gate and the iconic NUST entrance road. Someone talked to a crew member and they said they're shooting scenes for a new drama serial set at a fictional university. The admin gave permission apparently. Anyone know which channel? They were filming near the fountains area too.",
    status: "open",
    ratingBias: 4.0,
  },
  {
    titleTemplate: "Lab explosion in SCEE was covered up — no safety alert sent",
    content:
      "Two weeks ago there was a small chemical fire in an SCEE lab during a practical. Two students got minor burns. I was in the adjacent lab and heard the commotion. But NUST never sent a safety alert email or acknowledged it publicly. The lab was quietly repaired over the weekend. Where's the transparency? Students have a right to know about safety incidents.",
    status: "open",
    ratingBias: 3.5,
  },
  {
    titleTemplate: "IT department can read all your NUST email without telling you",
    content:
      "Read through the NUST IT acceptable use policy on the portal. There's a clause saying the university reserves the right to access any data on university systems for 'legitimate purposes' without notifying the user. This includes NUST email, LMS data, and browsing history on campus WiFi. Did anyone else know about this? Seems like a privacy issue.",
    status: "open",
    ratingBias: 3.7,
  },
  {
    titleTemplate: "NUST alumni donating $2M for new AI research center",
    content:
      "A well-connected faculty member in SEECS told our class that a NUST BSCS alumnus from the 2005 batch who's now a VP at a FAANG company is about to donate $2 million for a new AI research center on campus. The announcement is supposedly planned for the Founder's Day ceremony. This would be one of the largest individual donations to NUST.",
    status: "open",
    ratingBias: 3.9,
  },
  {
    titleTemplate: "Stray cats on campus are getting aggressive — student scratched near library",
    content:
      "This is the third incident I've heard about this month. A girl got scratched by a stray cat near the library entrance yesterday and had to get a tetanus shot at the medical center. The cats near the C1 cafeteria are especially aggressive during lunch hours. They jump on tables and snatch food. The campus has way too many strays now. Is anyone going to do something?",
    status: "open",
    ratingBias: 4.1,
  },
  {
    titleTemplate: "Hidden room discovered during renovation in the old SNS building",
    content:
      "Workers doing renovation in the old SNS building broke through a wall and found a sealed-off room with old lab equipment, notebooks from the 90s, and what looks like an old darkroom setup. The room wasn't on any current blueprints. Facilities took photos before sealing it back up. A janitor who's been at NUST for 20+ years said he'd never seen it. Anyone know the history?",
    status: "open",
    ratingBias: 4.2,
  },
  {
    titleTemplate: "Mess portions getting smaller but fees went up 15%",
    content:
      "Has anyone else noticed the mess portions have gotten noticeably smaller this semester? The chicken used to be a full piece, now it's clearly a half portion. Roti count went from 4 to 3 in the standard plate. But the mess fee went up from 8500 to 9800 this semester. I've been comparing with last semester's photos. It's not just me — my whole hostel floor has noticed.",
    status: "open",
    ratingBias: 3.6,
  },
  {
    titleTemplate: "Ghost sighting in the old admin building caught on security camera",
    content:
      "A friend who works as a night security guard showed me footage from the old admin building from last Friday at 3 AM. There's a weird white figure that appears in the corridor and moves through a wall. Could be a camera glitch but it's really creepy. The old admin building has had ghost stories since the 2000s. The video is making rounds among security staff apparently.",
    status: "open",
    ratingBias: 2.5,
  },
];

// ── Comment templates per rating level ──

const COMMENT_TEMPLATES: Record<number, string[]> = {
  1: [
    "This is completely made up. I checked with admin myself.",
    "Fake news. The official notice board says nothing about this.",
    "My friend works there and confirmed this is false.",
    "Stop spreading misinformation. This never happened.",
    "I was literally there. None of this is true.",
  ],
  2: [
    "Seems exaggerated. The original situation was different.",
    "I doubt this. The details don't add up.",
    "Probably taken out of context. The reality is more nuanced.",
    "Heard a different version of this story that contradicts key details.",
  ],
  3: [
    "Hard to say. I've heard conflicting accounts.",
    "Could go either way. Waiting for more info.",
    "Some parts might be true but the rest is speculation.",
    "No idea honestly. Let's see if someone can verify.",
    "Interesting if true. But I'm not convinced yet.",
  ],
  4: [
    "Seems legit. A batchmate mentioned something similar.",
    "I've seen some evidence pointing in this direction.",
    "Probably true based on what I've heard from others.",
    "This matches what I observed last week.",
  ],
  5: [
    "100% true. I was there when it happened.",
    "Can confirm. Saw it with my own eyes.",
    "My friend who works there verified this personally.",
    "This is accurate. Multiple people have confirmed it.",
    "Definitely true. I have screenshots to prove it.",
  ],
};

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
    Flag.deleteMany({}),
  ]);

  // ── 1. Create users ──
  console.log("Creating users …");
  const users: DemoUser[] = [];
  for (const email of DEMO_EMAILS) {
    const token = generateToken();
    const tokenHash = await sha256(token);
    const emailHash = await sha256(email.toLowerCase().trim());
    const credibility =
      users.length === 0
        ? 22
        : users.length === 1
          ? 18
          : users.length === DEMO_EMAILS.length - 1
            ? 3
            : Math.floor(Math.random() * 8) + 8;
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

    let createdAt: Date;
    if (p.status === "verified" || p.status === "false") {
      createdAt = new Date(now - (21 + Math.random() * 14) * 24 * 60 * 60 * 1000);
    } else if (p.status === "disputed") {
      createdAt = new Date(now - (14 + Math.random() * 14) * 24 * 60 * 60 * 1000);
    } else {
      createdAt = new Date(now - Math.random() * 13 * 24 * 60 * 60 * 1000);
    }

    postDocs.push({
      title: p.titleTemplate,
      content: p.content,
      media: [],
      status: p.status,
      posterTokenHash: poster.tokenHash,
      trustScore: 0,
      interactionCount: 0,
      evaluatedAt: p.status !== "open" ? new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000) : null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  const posts = await Post.insertMany(postDocs);
  console.log(`  Created ${posts.length} posts`);

  // ── 3. Create interactions (ratings) + ~30% with comments ──
  console.log("Creating interactions …");
  let interactionCount = 0;
  let commentCount = 0;
  const interactionBulk: {
    interactionHash: string;
    postId: mongoose.Types.ObjectId;
    userTokenHash: string;
    rating: number;
    comment?: string;
    credibilitySnapshot: number;
    createdAt: Date;
  }[] = [];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    const template = DEMO_POSTS[pi];
    const postPoster = users[pi % users.length];

    let raterCount: number;
    if (template.status !== "open") {
      raterCount = Math.min(users.length - 1, 12 + Math.floor(Math.random() * 5));
    } else {
      raterCount = 3 + Math.floor(Math.random() * 12);
    }

    const availableRaters = users.filter((u) => u.tokenHash !== postPoster.tokenHash);
    const shuffled = availableRaters.sort(() => Math.random() - 0.5);
    const raters = shuffled.slice(0, raterCount);

    for (const rater of raters) {
      const bias = template.ratingBias;
      let rating = Math.round(bias + (Math.random() - 0.5) * 2);
      rating = Math.max(1, Math.min(5, rating));

      const hash = await sha256(rater.token + post._id.toString());
      const ratingDate = new Date(
        post.createdAt.getTime() + Math.random() * (now - post.createdAt.getTime()),
      );

      // ~30% of interactions have comments
      let comment: string | undefined;
      if (Math.random() < 0.3) {
        const templates = COMMENT_TEMPLATES[rating];
        comment = templates[Math.floor(Math.random() * templates.length)];
        commentCount++;
      }

      interactionBulk.push({
        interactionHash: hash,
        postId: post._id as mongoose.Types.ObjectId,
        userTokenHash: rater.tokenHash,
        rating,
        ...(comment ? { comment } : {}),
        credibilitySnapshot: rater.credibility,
        createdAt: ratingDate,
      });
      interactionCount++;
    }
  }

  await Interaction.insertMany(interactionBulk);
  console.log(`  Created ${interactionCount} interactions (${commentCount} with comments)`);

  // ── 4. Compute trust scores ──
  console.log("Computing trust scores …");
  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    const interactions = interactionBulk.filter(
      (i) => i.postId.toString() === post._id.toString(),
    );

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
    // Shuttle timings + cafeteria closing (campus logistics)
    [2, 1],
    // GPU workstations + WiFi upgrade (tech improvements)
    [0, 3],
    // GPA system change + mess fees (policy changes)
    [4, 23],
    // Ragging incident + sleep study (student safety)
    [9, 15],
    // Bookshop closing + parking area (campus changes)
    [16, 13],
    // Prof AI grading + IT email policy (tech oversight)
    [7, 19],
    // Cricket player + film crew (campus buzz)
    [14, 17],
    // Hidden room + ghost sighting (campus mysteries)
    [22, 24],
    // Underground tunnels + hidden room
    [8, 22],
    // Mess food supplier + mess portions
    [12, 23],
    // Lab explosion + sleep study (safety)
    [18, 15],
    // Alumni donation + GPU workstations
    [20, 0],
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

  // ── 7. Create flags on 4-5 posts ──
  console.log("Creating flags …");
  const flagTargets = [
    { postIdx: 9, flagCount: 6 },   // Ragging incident — controversial
    { postIdx: 12, flagCount: 4 },   // Mess food supplier — inflammatory
    { postIdx: 15, flagCount: 3 },   // Sleep study — sensitive
    { postIdx: 18, flagCount: 5 },   // Lab explosion cover-up — accusatory
    { postIdx: 24, flagCount: 2 },   // Ghost sighting — spam-ish
  ];

  let totalFlags = 0;
  const flagBulk: {
    flagHash: string;
    postId: mongoose.Types.ObjectId;
    userTokenHash: string;
    reason?: string;
  }[] = [];

  const flagReasons = [
    "Spreading unverified accusations",
    "Could cause unnecessary panic",
    "This is defamatory",
    "Spam / not a real campus rumor",
    "Potentially harmful content",
    "Violates privacy of individuals mentioned",
  ];

  for (const target of flagTargets) {
    const postId = posts[target.postIdx]._id as mongoose.Types.ObjectId;
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5).slice(0, target.flagCount);

    for (const user of shuffledUsers) {
      const hash = await sha256("flag:" + user.token + postId.toString());
      const reason = Math.random() < 0.6
        ? flagReasons[Math.floor(Math.random() * flagReasons.length)]
        : undefined;

      flagBulk.push({
        flagHash: hash,
        postId,
        userTokenHash: user.tokenHash,
        ...(reason ? { reason } : {}),
      });
      totalFlags++;
    }
  }

  await Flag.insertMany(flagBulk);
  console.log(`  Created ${totalFlags} flags on ${flagTargets.length} posts`);

  // ── Done ──
  console.log("\n--- Seed complete ---");
  console.log(`  Users:        ${users.length}`);
  console.log(`  Posts:         ${posts.length}`);
  console.log(`  Interactions:  ${interactionCount} (${commentCount} with comments)`);
  console.log(`  Relations:     ${relations.length}`);
  console.log(`  Votes:         ${voteCount}`);
  console.log(`  Flags:         ${totalFlags}`);

  console.log("\n--- Demo login tokens ---");
  console.log("Copy any token below and use it to log in:\n");
  for (const u of users.slice(0, 5)) {
    console.log(`  ${u.email.padEnd(40)} → ${u.token}`);
  }
  console.log(`  ... and ${users.length - 5} more users`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
