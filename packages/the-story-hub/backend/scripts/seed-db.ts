import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v5 as uuidv5, v4 as uuidv4 } from "uuid";

// Configuration
const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "nlmonorepo-thestoryhub-datatable-dev";
const STAGE = process.env.STAGE || "dev";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

// UUID namespace for deterministic UUID generation
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Check if table already has items
async function tableHasItems(): Promise<boolean> {
  try {
    const resp = await ddbClient.send(
      new ScanCommand({ TableName: TABLE_NAME, Limit: 1 }),
    );
    const count =
      (resp as any).Count ??
      ((resp as any).Items ? (resp as any).Items.length : 0);
    return (count || 0) > 0;
  } catch (err) {
    console.warn(
      "⚠️  Could not check table contents, proceeding with seeding:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

// Get admin user data from environment or use defaults
function getAdminUser() {
  return {
    firstName: "Admin",
    lastName: "User",
    email: ADMIN_EMAIL,
    title: "Mr",
    screenName: "TheStoryteller",
  };
}

// Simple seed data - test users and stories
const SEED_DATA = {
  users: [
    getAdminUser(),
    {
      firstName: "Bob",
      lastName: "User",
      email: "bob.user@example.com",
      title: "Mr",
      screenName: "CyberScribe",
    },
    {
      firstName: "Charlie",
      lastName: "Smith",
      email: "charlie.smith@example.com",
      title: "Mr",
      screenName: "MysteryWriter",
    },
    {
      firstName: "Diana",
      lastName: "Jones",
      email: "diana.jones@example.com",
      title: "Ms",
      screenName: "DragonQuill",
    },
  ],
  stories: [
    {
      title: "The Enchanted Forest",
      synopsis:
        "A young adventurer discovers a magical forest where every choice leads to a different destiny. Navigate through mystical creatures, ancient secrets, and powerful magic as you forge your own path through this collaborative fantasy epic.",
      genre: ["Fantasy", "Adventure"],
      ageRating: "PG",
      contentWarnings: [],
      coverImage: "/images/covers/enchanted-forest.jpg",
      featured: true,
      authorEmail: ADMIN_EMAIL,
      rootChapterContent:
        "The ancient forest loomed before Elara, its trees towering impossibly high, their leaves shimmering with an otherworldly glow that seemed to pulse with the rhythm of an unseen heartbeat. She had traveled three days to reach this place, following the cryptic map her grandmother had pressed into her hands before passing.\n\nA worn path stretched into the shadows between the trees, smooth stones embedded in the earth marking the way countless travelers before her had walked. To her right, a massive oak tree stood apart from the others, its trunk carved with strange markings that seemed to shift when she wasn't looking directly at them. The symbols were old—older than any language she recognized from her studies at the Academy.\n\nThe air was thick with magic. Elara could feel it tingling against her skin, raising the fine hairs on her arms. This was the threshold her grandmother had spoken of, the place where ordinary rules bent and broke. Whatever waited beyond this point would change everything.\n\nShe took a deep breath, adjusted the pack on her shoulders, and stepped forward into the unknown.",
      branches: [
        {
          description: "The Path of Shadows",
          content: "Elara chose the worn path, following the smooth stones deeper into the forest. The trees closed in around her, their branches weaving together overhead to form a living tunnel. The light grew dimmer with each step, filtered through layers of luminescent leaves that cast everything in shades of silver and green.\n\nShe had been walking for perhaps an hour when she heard the singing. It was faint at first, barely distinguishable from the whisper of wind through leaves, but it grew stronger as she continued. The voice was beautiful, haunting, and utterly inhuman.\n\nThe path opened into a clearing where a stream cut through the earth, its water running black as ink under the forest canopy. On the far bank sat a creature Elara had only read about in her grandmother's journals—a Dryad, her skin the color of birch bark, her hair flowing like willow branches.\n\n\"Lost are you, daughter of the Academy?\" the Dryad sang, her voice carrying across the dark water. \"Or perhaps exactly where you need to be?\"",
        },
        {
          description: "The Ancient Oak",
          content: "The symbols on the oak tree seemed to call to her, and Elara found herself moving toward it almost without conscious thought. Up close, the markings were even stranger—not carved into the bark, but rather growing from within it, as if the tree itself had written them in its own flesh.\n\nShe reached out, fingers trembling, and traced one of the symbols. The moment her skin made contact with the bark, the world lurched sideways.\n\nWhen her vision cleared, Elara was no longer standing before the tree. She was inside it. Or perhaps the tree was inside her. The distinction seemed meaningless in this place where wood and thought intertwined. Memories that weren't hers flooded through her mind—thousands of years of seasons, of growth and decay, of secrets whispered to roots and wind.\n\nAnd at the center of it all, a voice as old as the forest itself: \"The Guardian's daughter returns at last. We have been waiting for you, Elara Moonwhisper, though you do not yet remember why.\"",
        },
        {
          description: "Into the Wild",
          content: "Elara ignored both the path and the oak, instead pushing directly into the untamed forest. If her grandmother had taught her anything, it was that the easiest way was rarely the right way. The undergrowth grabbed at her cloak and scratched her arms, but she pressed forward, trusting her instincts.\n\nThe forest seemed to test her, branches catching at her pack, roots appearing where her next step would fall. But Elara was quick and determined, ducking and weaving through the obstacles. After what felt like hours of struggle, the resistance suddenly ceased.\n\nShe stumbled into a part of the forest that felt... different. Older. The trees here were massive beyond reason, their trunks wider than houses. And between them, impossibly, floated fragments of stone architecture—pieces of what must have once been a great temple, now suspended in the air by threads of golden light.\n\nA small fox with fur that shifted between red and silver sat on one of the floating stones, watching her with eyes far too intelligent for an animal. \"Well,\" it said in a crisp, bemused voice, \"that's one way to find the Lost City. Most people die trying that route. I'm impressed.\"",
        },
      ],
    },
    {
      title: "Cyber Nexus",
      synopsis:
        "In a dystopian future where consciousness can be uploaded to the net, you must navigate corporate espionage, digital warfare, and the blurred lines between human and AI. Your choices will shape the future of humanity itself.",
      genre: ["Sci-Fi", "Thriller"],
      ageRating: "M",
      contentWarnings: ["Violence"],
      coverImage: "/images/covers/cyber-nexus.jpg",
      featured: true,
      authorEmail: "bob.user@example.com",
      rootChapterContent:
        "The neon-soaked streets of Neo Tokyo stretched endlessly in every direction, a labyrinth of light and shadow where the digital and physical worlds blurred into one. Rain slicked the pavement, reflecting holographic advertisements that danced across every surface—hawking neural upgrades, synthetic dreams, and lives you could never afford.\n\nKai's neural implant buzzed against the base of their skull, a familiar electric tingle that meant an incoming message. They ducked into an alley, letting the crowd flow past as they pulled up the interface with a thought. The message was marked urgent, encrypted with military-grade protocols. Anonymous sender, but the encryption key was unmistakable—it came from inside Zaibatsu Corp.\n\nThe very megacorporation Kai had been hired to infiltrate.\n\n'They know you're coming,' the message read. 'Meet me at the old arcade on Seventh Street. Come alone. You have two hours.'\n\nKai's hand instinctively moved to the concealed data chip in their jacket pocket—the fake credentials that were supposed to get them past Zaibatsu's security. If someone inside the corp already knew about the infiltration, the whole operation was compromised. But whoever sent this message had access to encryption keys that shouldn't exist outside the company's inner circle.\n\nTwo hours. The old arcade was across the city, deep in the forgotten district where the grid flickered and died. Going there meant walking away from the mission briefing, from the team waiting at the safehouse, from every protocol they'd been taught.\n\nKai stepped back into the rain and started walking.",
      branches: [
        {
          description: "Trust the Message",
          content: "The old arcade stood like a relic from another era, its faded sign still flickering with the ghosts of pixels long dead. Kai approached cautiously, hand near the neural stunner concealed beneath their jacket. The front door was unlocked.\n\nInside, ancient gaming cabinets lined the walls, their screens dark except for one in the back corner that glowed with soft blue light. A figure stood silhouetted against it—tall, elegant, wearing a Zaibatsu executive's suit.\n\n\"You came,\" the figure said, turning. It was Dr. Yuki Tanaka, Zaibatsu's head of AI development. The person Kai was supposed to be stealing secrets from. \"Good. That means you're smart enough to know when the game has changed.\"\n\nShe held up a data chip identical to the one in Kai's pocket. \"Your employers didn't tell you everything. They didn't tell you that what you're stealing isn't corporate secrets—it's the only copy of an AI that's achieved true consciousness. And if Zaibatsu's board gets their hands on it first, they'll weaponize it.\"\n\nThe arcade's door slammed shut behind Kai. Multiple footsteps echoed in the street outside.\n\n\"So here's your choice,\" Dr. Tanaka said quietly. \"Help me get this AI to safety, or we both die here tonight.\"",
        },
        {
          description: "Report to the Team",
          content: "Kai made it three blocks before their comm link exploded with angry voices. The safehouse team had been tracking Kai's neural signature, and they weren't happy about the detour.\n\n\"Abort and return immediately,\" Commander Hayes snapped through the encrypted channel. \"That message was obviously bait.\"\n\nBut when Kai arrived back at the safehouse, they found it wasn't empty. Someone had been there first. The team was alive, but restrained, and standing over them was a Zaibatsu security android—the expensive kind with true combat programming.\n\n\"Kai Nakamura,\" the android said pleasantly. \"Please don't resist. We know about the infiltration, we know about your fake credentials, and we know your team leader sold you out three days ago.\"\n\nCommander Hayes wouldn't meet Kai's eyes.\n\nThe android continued, \"Zaibatsu Corp would like to make you an offer. You clearly have skills we value. Work for us instead, help us identify and eliminate the rest of your organization, and we'll set you up with more money and augmentations than you've ever dreamed of.\"\n\nIt gestured to a briefcase on the table, which opened to reveal more credit chips than Kai had seen in their entire life.\n\n\"Or,\" the android added, \"we can do this the unpleasant way. Your choice has already been logged. You have sixty seconds to decide.\"",
        },
        {
          description: "Go Dark",
          content: "Kai yanked the neural implant's external connector, severing their link to the network in a shower of static and pain. Going dark was dangerous—it meant no comms, no database access, no AR overlay—but it also meant Zaibatsu couldn't track them.\n\nThey dumped the fake credentials chip in a recycling bin and disappeared into the crowd, using every street trick they'd learned growing up in the undercity. Three hours later, Kai emerged in the lowest levels, where even the corporations didn't bother maintaining infrastructure.\n\nThe Black Market clinic was exactly where it had been five years ago. Kai pushed through the plastic sheeting that served as a door and found Doc Miyamoto hunched over a workbench, installing black-market cyberware into an unconscious client.\n\n\"Well, well,\" Doc said without looking up. \"Kai Nakamura. Heard you went legit. Corporate contract work.\"\n\n\"That's done,\" Kai said shortly. \"I need a clean identity, new implant, and answers. Someone burned my operation.\"\n\nDoc finally turned, eyes narrowing behind mag-lenses. \"You know what I need in return.\"\n\nKai did know. Doc never dealt in money. They dealt in secrets, in data, in information that could topple empires. And Kai had just walked away from one of the biggest corporate jobs in the city, carrying knowledge that Zaibatsu would kill to keep quiet.\n\n\"I'm listening,\" Kai said.\n\nDoc smiled. \"Then let me tell you about a group called the Collective. They've been waiting for someone like you.\"",
        },
      ],
    },
    {
      title: "Mystery at Blackwood Manor",
      synopsis:
        "A classic murder mystery where readers vote on which suspect to investigate next. Uncover clues, interview suspects, and piece together the truth in this interactive detective story set in a remote English manor.",
      genre: ["Mystery", "Thriller"],
      ageRating: "PG_13",
      contentWarnings: ["Violence"],
      coverImage: "/images/covers/blackwood-manor.jpg",
      featured: false,
      authorEmail: "charlie.smith@example.com",
      rootChapterContent:
        "The storm had been raging for three hours when the screaming started.\n\nDetective Sarah Chen set down her teacup, the delicate china rattling against the saucer as thunder shook the windows of Blackwood Manor. She'd come here for a weekend retreat, accepting Lord Blackwood's invitation on a whim—a chance to escape London and the case that had been consuming her for months. The old manor house had seemed charming when she'd arrived that afternoon, all dark wood paneling and oil paintings of stern-faced ancestors.\n\nNow it felt like a trap.\n\nThe other guests were already crowding into the entrance hall when Sarah emerged from the library. Lady Margaret Ashford, the society maven, stood with one hand pressed to her mouth. The young American couple, the Hendersons, clung to each other by the stairs. James Crawford, Lord Blackwood's business partner, was shouting something about calling the police.\n\nBut it was the butler, Graves, standing pale and shaking at the door to the study, who drew Sarah's attention.\n\n\"He's dead,\" Graves said, his usual composure shattered. \"Lord Blackwood is dead.\"\n\nSarah pushed past the others and into the study. Lord Blackwood sat slumped over his desk, a letter opener protruding from between his shoulder blades. Blood had pooled on the mahogany surface, soaking into the papers scattered across it. His eyes were still open, staring at nothing.\n\nBehind her, someone tried the telephone. \"The line's dead,\" they reported.\n\n\"The bridge,\" Lady Margaret said faintly. \"I saw it from my window. The storm's washed it out. We're trapped here.\"\n\nSarah looked around the room, her detective's mind already cataloging details—the broken glass on the floor, the smell of expensive whiskey, the safe standing open behind a portrait. The killer was still in this house. Still among them.\n\nAnd the night was far from over.",
      branches: [
        {
          description: "Examine the Study",
          content: "Sarah spent the next hour methodically combing through the study while the others waited in the drawing room under Graves's watchful eye. The broken glass was from a whiskey tumbler—Lord Blackwood's, judging by his fingerprints on the intact pieces. But there was a second glass missing from the set.\n\nThe papers on the desk were more interesting. Financial documents, all of them. Blackwood Industries was hemorrhaging money, and the company's board had scheduled a vote of no confidence for next week. James Crawford stood to gain control if Blackwood was removed.\n\nBut it was what Sarah found in the open safe that changed everything—a leather journal, its pages filled with Lord Blackwood's tight handwriting. She flipped to the most recent entry, dated that very morning:\n\n'M. has discovered the truth about the Ashford inheritance. She knows I've been lying to her for thirty years. Tonight, I must tell her everything, or she'll expose us both. God help me.'\n\nSarah looked up sharply. Lady Margaret had been in this room. And she'd failed to mention it.\n\nWhen Sarah returned to the drawing room, Lady Margaret was gone. The French doors to the terrace stood open, rain blowing in.\n\n\"She said she needed air,\" Mrs. Henderson said nervously. \"But that was ten minutes ago.\"\n\nSarah ran to the terrace. In the mud at the base of the steps, barely visible in the storm, were footprints. Two sets. One heading toward the old chapel, one running back to the house.\n\nAnd next to them, dropped in the mud, was a silver locket with the Ashford family crest.",
        },
        {
          description: "Interview the Guests",
          content: "Sarah gathered everyone in the drawing room and began asking questions. James Crawford had been in his room changing for dinner when the murder occurred—or so he claimed. No alibi, and plenty of motive given the financial documents Sarah had glimpsed.\n\nThe Hendersons, married only six months, seemed genuinely shaken. But Mrs. Henderson kept glancing at the study door with an expression Sarah couldn't quite read. When pressed, she admitted she'd overheard an argument between Lord Blackwood and \"a woman\" earlier that afternoon.\n\n\"I couldn't see who,\" she insisted. \"But she was angry. Something about lies and betrayal.\"\n\nLady Margaret sat perfectly composed, but Sarah noticed her hands trembling as she sipped her brandy. When Sarah asked about her relationship with the deceased, the older woman's mask cracked slightly.\n\n\"We were engaged once,\" she said quietly. \"Forty years ago. Before he married for money and I married for title. Ancient history.\"\n\n\"Is it?\" Sarah asked. \"Because I found letters in his desk. Recent letters. Unsigned, but written in a woman's hand.\"\n\nLady Margaret's teacup shattered against the floor.\n\nThat's when Graves cleared his throat from the doorway. \"Pardon me, Detective, but you should see this.\" He held up a small key. \"I found it in the late Lord's waistcoat pocket. It opens the wine cellar. And there's something down there you need to see.\"\n\nThe blood had drained from Lady Margaret's face. \"No,\" she whispered. \"Not the cellar. Please.\"",
        },
        {
          description: "Search the Grounds",
          content: "Despite the storm, Sarah grabbed a torch and headed outside. Something about this murder felt staged, too neat. The killer wanted them focused on the study, which meant the real answers might be elsewhere.\n\nShe started with the garage. Lord Blackwood's Bentley sat gleaming in the lamplight, but the second bay was empty. Someone had recently taken a vehicle out—the floor was wet, and tire tracks led toward the side path.\n\nSarah followed them to the old groundskeeper's cottage. The door hung open, banging in the wind. Inside, she found chaos—furniture overturned, papers scattered everywhere, and a wall safe standing open and empty.\n\nBut it was what she found in the bedroom that made her blood run cold: a shrine. Photographs covered an entire wall—all of them Lord Blackwood, taken from a distance over what looked like years. Some were recent. Some were decades old. And in the center, a wedding photo that had been methodically defaced, the bride's face scratched out.\n\nSarah heard a sound behind her and spun, torch raised. A figure stood in the doorway, soaked with rain and holding a tire iron.\n\n\"I should have known you'd find this place,\" Graves said quietly. \"You always were too clever for your own good, Detective Chen.\"\n\nHe stepped into the cottage, and Sarah saw his butler's uniform was stained with something dark. \"Did you know,\" he continued conversationally, \"that I've been serving the Blackwood family for forty-three years? Since I was a boy. Long enough to know all their secrets. Long enough to know which ones deserved to die for them.\"\n\nThe tire iron gleamed as lightning flashed. Sarah's hand moved to her pocket, where her phone should have been. She'd left it in her room.\n\nShe was alone in a cottage with a murderer, and no one knew where she'd gone.",
        },
      ],
    },
    {
      title: "Love in the Time of Dragons",
      synopsis:
        "A romantic fantasy adventure where a baker falls in love with a dragon shapeshifter. Navigate courtly intrigue, magical mishaps, and the complexities of inter-species romance in this heartwarming tale.",
      genre: ["Romance", "Fantasy"],
      ageRating: "PG_13",
      contentWarnings: [],
      coverImage: "/images/covers/love-dragons.jpg",
      featured: false,
      authorEmail: "diana.jones@example.com",
      rootChapterContent:
        "The bell above the bakery door chimed just as Maya pulled the morning's batch of cinnamon rolls from the oven. The scent of brown sugar and spice filled the small shop, mixing with the yeasty warmth of rising bread. She set the tray on the cooling rack and wiped flour from her hands, ready to greet her first customer of the day.\n\nBut the words died in her throat.\n\nThe stranger who stepped through the door was tall—almost too tall for the low-ceilinged shop—with sharp features and eyes that shimmered like molten gold. They moved with an odd grace, as if not quite used to the constraints of the physical world, and their cloak, despite the morning rain, seemed completely dry.\n\n\"Good morning,\" Maya managed, falling back on the familiar routine. \"Welcome to Thornhaven Bakery. What can I—\"\n\nThe stranger sneezed.\n\nIt was a delicate, almost apologetic sneeze, but it was accompanied by a small puff of smoke that drifted from their nostrils and dissipated in the warm air of the bakery. The stranger's golden eyes widened in alarm, one hand flying up to cover their nose.\n\n\"I'm so sorry,\" they said quickly, their voice carrying an accent Maya couldn't quite place. \"The cinnamon—it's quite strong. Wonderful, but strong.\" They glanced at the menu board Maya had chalked up that morning, their expression turning cautious. \"I don't suppose... that is, do any of your pastries contain dragon's bane?\"\n\nMaya stared. Dragon's bane. The purple flowering herb that grew wild in the mountains, that the old folks said kept dragons away from the livestock. The herb that no one really believed had anything to do with actual dragons, because dragons were myths. Stories. Legends from a time before time.\n\nThe stranger smiled apologetically, revealing teeth that were just a touch too sharp.\n\n\"I can see I've alarmed you,\" they said. \"Perhaps I should explain.\"",
      branches: [
        {
          description: "Listen to Their Story",
          content: "Maya locked the bakery door and flipped the sign to closed. Whatever this was, she didn't need her regular customers walking in on it.\n\nThe stranger—who introduced themselves as Ember—settled at one of the small tables with surprising care, as if afraid of breaking the furniture. Over tea and a cinnamon roll (carefully verified to be dragon's bane free), they told Maya a story that should have been impossible.\n\n\"My kind have lived in the mountains for millennia,\" Ember explained. \"We learned to take human shape centuries ago, to walk among your people without causing panic. But there are rules. We can only hold this form for a limited time. And we must never, under any circumstances, let humans discover what we truly are.\"\n\nEmber looked down at their tea. \"I've been watching your bakery for months. At first, it was just curiosity—the smells reminded me of the volcanic springs near my home. But then I started watching you. The way you smile at children. The way you give bread to those who can't pay. The way you sing while you work.\"\n\nThey met Maya's eyes, and she saw something ancient and powerful and utterly vulnerable in that golden gaze.\n\n\"I've broken every rule by coming here,\" Ember whispered. \"The Dragon Council will be furious. But I couldn't stay away any longer. I had to meet you. To speak to you. Even if it's just once.\"\n\nMaya's heart was racing. This was insane. Impossible. And yet...\n\n\"Show me,\" she heard herself say. \"Your true form. Please.\"",
        },
        {
          description: "Call for Help",
          content: "Maya's hand moved to the bell she kept under the counter—the one that connected to the town guard station. This person—creature—whatever they were, had just admitted to being dangerous. To watching her. She'd be a fool not to—\n\nEmber's expression shifted from hopeful to devastated in an instant. \"I see,\" they said softly. \"Of course. I've frightened you. I should go.\"\n\nThey stood, moving toward the door, and Maya saw their hand trembling as they reached for the handle. In that moment, they looked so utterly human, so heartbreakingly lonely, that Maya's resolve wavered.\n\n\"Wait,\" she said.\n\nEmber turned, hope flickering in those golden eyes.\n\nBefore Maya could speak, the bakery door burst open. Captain Thorne of the town guard stood there, sword drawn, with three armed guards behind him. Old Mrs. Chen from across the street must have seen Ember enter and gotten suspicious—she'd always been paranoid about outsiders.\n\n\"Step away from the baker,\" Thorne commanded. His eyes narrowed as he took in Ember's unusual features. \"By order of the Crown, you're under arrest for suspected use of illegal transformation magic.\"\n\nEmber's whole body went rigid. \"Please,\" they said quietly. \"Don't do this. If they discover what I am—\"\n\n\"What you are is under arrest,\" Thorne interrupted. \"Guards, seize them.\"\n\nEmber looked at Maya one last time, something pleading in their expression. The guards moved forward. And Maya had perhaps three seconds to decide whether to stand aside or intervene.",
        },
        {
          description: "Keep It Professional",
          content: "\"I don't use dragon's bane in any of my recipes,\" Maya said carefully, keeping her tone light and professional despite her racing heart. \"But I'm afraid I'll need to ask you to leave. I have a business to run, and I can't have customers who... sneeze smoke in my bakery.\"\n\nShe expected hurt, or anger, but Ember just nodded sadly. \"Of course. I understand. I've overstepped.\"\n\nThey purchased a loaf of bread—paying with gold coins that looked very old and very real—and left without another word. Maya watched through the window as they disappeared down the rain-slicked street, their cloak billowing behind them.\n\nShe told herself she'd made the right choice. The safe choice. The sensible choice.\n\nThree days later, the King's soldiers arrived in Thornhaven.\n\nThey were hunting a dragon, they said. There had been attacks on livestock in the neighboring province. Sheep disappearing. A barn burned. The creature had been tracked to this region, and anyone harboring information would be considered complicit.\n\nThe captain showed Maya a sketch. It was crude, but distinctive—a dragon with scales that shifted between red and gold, with eyes like molten metal.\n\n\"Have you seen anything suspicious?\" the captain demanded. \"Any strangers with unusual features?\"\n\nMaya thought of Ember's golden eyes. Their too-sharp teeth. The smoke that had drifted from their sneeze.\n\nShe thought of the terror she'd seen in their face when they mentioned the Dragon Council. The loneliness in their voice when they'd said they couldn't stay away.\n\nAnd she thought of the bodies the soldiers claimed to have found. The burned barn. The missing sheep.\n\n\"Well?\" the captain pressed. \"Have you seen anything or not?\"",
        },
      ],
    },
  ],
};

interface TSHUserDB {
  PK: string;
  SK: string;
  userId: string;
  userEmail: string;
  userTitle: string;
  userFirstName: string;
  userLastName: string;
  userScreenName: string;
  userPhone: string;
  privacyPolicy: boolean;
  termsAndConditions: boolean;
  userAddedById: string;
  userCreated: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

// Generate deterministic UUID from email
function generateDeterministicUserId(email: string): string {
  return uuidv5(email, UUID_NAMESPACE);
}

// Generate deterministic phone number
function generateDeterministicPhone(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash = hash & hash;
  }
  const areaCode = 400 + (Math.abs(hash) % 200);
  const prefix = 100 + (Math.abs(hash >> 8) % 900);
  const lineNumber = 1000 + (Math.abs(hash >> 16) % 9000);
  return `+61${areaCode}${prefix}${lineNumber}`;
}

// Create user
function createUser(superAdminUserId: string, userData: any): TSHUserDB {
  const userId = generateDeterministicUserId(userData.email);

  const user: TSHUserDB = {
    PK: `USER#${userId}`,
    SK: `PROFILE#${userId}`,
    userId,
    userEmail: userData.email,
    userTitle: userData.title,
    userFirstName: userData.firstName,
    userLastName: userData.lastName,
    userScreenName: userData.screenName,
    userPhone: generateDeterministicPhone(userData.email),
    privacyPolicy: true,
    termsAndConditions: true,
    userAddedById: superAdminUserId,
    userCreated: new Date().toISOString(),
    GSI1PK: `USER#${userId}`,
    GSI1SK: `USER#${userId}`,
  };

  return user;
}

// Insert user
async function insertUser(user: TSHUserDB): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
      }),
    );
    console.log(`✅ ${user.userFirstName} ${user.userLastName}`);
    console.log(`   🆔 User ID: ${user.userId}`);
    console.log(`   📧 Email: ${user.userEmail}`);
  } catch (error) {
    console.error(
      `❌ Failed to create user ${user.userEmail}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Create story with root chapter
function createStory(authorId: string, authorScreenName: string, storyData: any) {
  const storyId = uuidv4();
  const rootNodeId = uuidv4();
  const now = new Date().toISOString();

  const story = {
    PK: `STORY#${storyId}`,
    SK: "METADATA",
    GSI1PK: "STORY",
    GSI1SK: `STORY#${storyId}`,
    storyId,
    authorId,
    authorName: authorScreenName, // Use screen name for display
    title: storyData.title,
    synopsis: storyData.synopsis,
    genre: storyData.genre,
    ageRating: storyData.ageRating,
    contentWarnings: storyData.contentWarnings,
    coverImageUrl: storyData.coverImage, // Rename to match schema
    featured: storyData.featured || false,
    rootNodeId,
    aiCreated: true, // All seed stories are AI-created
    allowAI: true, // Allow AI contributions for all seed stories
    status: "active",
    createdAt: now,
    updatedAt: now,
    stats: {
      totalReads: Math.floor(Math.random() * 1000) + 50,
      totalBranches: 0,
      totalChapters: 1,
      rating: 4.5, // Rename from averageRating to match schema
      ratingCount: Math.floor(Math.random() * 50) + 10,
    },
  };

  const nowEpochMillis = new Date().getTime();
  const editableUntilEpoch = nowEpochMillis + 3600000; // 1 hour from now
  const editableUntil = new Date(editableUntilEpoch).toISOString();

  const rootChapter = {
    PK: `STORY#${storyId}`,
    SK: `CHAPTER#${rootNodeId}`,
    GSI1PK: `USER#${authorId}`, // Changed to match createChapter schema
    GSI1SK: `BRANCH#${now}#${rootNodeId}`,
    storyId,
    nodeId: rootNodeId,
    chapterNumber: 1,
    authorId,
    authorName: authorScreenName, // Add screen name for display
    content: storyData.rootChapterContent,
    branchDescription: null, // First chapter has no branch description
    paragraphIndex: null,
    parentNodeId: null,
    createdAt: now,
    editableUntil,
    stats: {
      reads: 0,
      upvotes: Math.floor(Math.random() * 100) + 20,
      downvotes: Math.floor(Math.random() * 10),
      childBranches: 0, // Renamed from branchCount
    },
    badges: {
      matchesVision: false,
      authorApproved: false,
    },
  };

  return { story, rootChapter, storyId, rootNodeId };
}

// Create branch chapter
function createBranchChapter(
  storyId: string,
  parentNodeId: string,
  chapterNumber: number,
  authorId: string,
  authorName: string,
  content: string,
  branchDescription: string,
) {
  const nodeId = uuidv4();
  const now = new Date().toISOString();
  const nowEpochMillis = new Date().getTime();
  const editableUntilEpoch = nowEpochMillis + 3600000; // 1 hour from now
  const editableUntil = new Date(editableUntilEpoch).toISOString();

  return {
    PK: `STORY#${storyId}`,
    SK: `CHAPTER#${nodeId}`,
    GSI1PK: `USER#${authorId}`,
    GSI1SK: `BRANCH#${now}#${nodeId}`,
    storyId,
    nodeId,
    chapterNumber,
    authorId,
    authorName,
    content,
    branchDescription,
    paragraphIndex: null,
    parentNodeId,
    createdAt: now,
    editableUntil,
    stats: {
      reads: 0,
      upvotes: Math.floor(Math.random() * 50) + 5,
      downvotes: Math.floor(Math.random() * 5),
      childBranches: 0,
    },
    badges: {
      matchesVision: Math.random() > 0.7, // 30% chance
      authorApproved: Math.random() > 0.8, // 20% chance
    },
  };
}

// Create comment
function createComment(
  storyId: string,
  nodeId: string,
  authorId: string,
  authorName: string,
  content: string,
  parentCommentId: string | null = null,
  depth: number = 0,
) {
  const commentId = uuidv4();
  const now = new Date().toISOString();

  return {
    PK: `STORY#${storyId}#NODE#${nodeId}`,
    SK: `COMMENT#${commentId}`,
    GSI1PK: parentCommentId ? `COMMENT#${parentCommentId}` : `NODE#${nodeId}`,
    GSI1SK: `CREATED#${now}`,
    commentId,
    storyId,
    nodeId,
    authorId,
    authorName,
    content,
    parentCommentId,
    depth,
    createdAt: now,
    updatedAt: now,
    edited: false,
    stats: {
      upvotes: Math.floor(Math.random() * 20) + 1,
      downvotes: Math.floor(Math.random() * 3),
      replyCount: 0,
      totalReplyCount: 0,
    },
  };
}

// Insert item
async function insertItem(item: any, description: string): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );
    console.log(`✅ ${description}`);
  } catch (error) {
    console.error(
      `❌ Failed to create ${description}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Batch insert items (DynamoDB allows 25 items per batch)
async function batchInsertItems(items: any[], description: string): Promise<void> {
  try {
    const BATCH_SIZE = 25;
    const batches = [];

    // Split items into batches of 25
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const writeRequests = batch.map((item) => ({
        PutRequest: {
          Item: item,
        },
      }));

      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: writeRequests,
          },
        }),
      );

      console.log(`✅ ${description} (batch ${i + 1}/${batches.length}, ${batch.length} items)`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to batch create ${description}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Main seed function
async function seedDatabase() {
  try {
    if (await tableHasItems()) {
      console.log("ℹ️  Table already contains items — skipping seeding.");
      return;
    }

    console.log(`🌱 Starting The Story Hub database seeding...`);
    console.log(`📍 Region: ${REGION}`);
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🏷️  Stage: ${STAGE}`);
    console.log("");

    const superAdminUserId =
      process.env.SUPER_ADMIN_USER_ID || "super-admin-fixed-uuid";

    // Map to store user IDs and screen names by email
    const userIdMap = new Map<string, string>();
    const userScreenNameMap = new Map<string, string>();

    console.log(`🏗️  Creating ${SEED_DATA.users.length} test users...`);
    console.log("");

    // Create and insert users
    for (const userData of SEED_DATA.users) {
      const user = createUser(superAdminUserId, userData);
      userIdMap.set(userData.email, user.userId);
      userScreenNameMap.set(userData.email, user.userScreenName);
      await insertUser(user);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("");
    console.log(
      `📚 Creating ${SEED_DATA.stories.length} stories with branches...`,
    );
    console.log("");

    let storyCount = 0;
    let chapterCount = 0;
    let commentCount = 0;

    // Create and insert stories with branches
    for (const storyData of SEED_DATA.stories) {
      const authorId = userIdMap.get(storyData.authorEmail);
      const authorScreenName = userScreenNameMap.get(storyData.authorEmail);
      if (!authorId || !authorScreenName) {
        console.warn(
          `⚠️  Skipping story "${storyData.title}" - author not found`,
        );
        continue;
      }

      const { story, rootChapter, storyId, rootNodeId } = createStory(
        authorId,
        authorScreenName,
        storyData,
      );

      await insertItem(story, `Story: "${storyData.title}"`);
      storyCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));

      await insertItem(rootChapter, `  Root chapter for "${storyData.title}"`);
      chapterCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Track total branches for this story
      let totalBranches = 0;
      const chapterNodeIds: string[] = [rootNodeId]; // Track all chapter nodes for commenting

      // Create branches using predefined content if available
      if (storyData.branches && storyData.branches.length > 0) {
        const otherUsers = SEED_DATA.users.filter(
          (u) => u.email !== storyData.authorEmail,
        );

        // Add 3 first-level branches
        console.log(`  🌿 Creating 3 first-level branches...`);
        const firstLevelBranches: any[] = [];

        for (let i = 0; i < Math.min(3, storyData.branches.length); i++) {
          const branchData = storyData.branches[i];
          const branchAuthor = otherUsers[i % otherUsers.length];
          const branchAuthorId = userIdMap.get(branchAuthor.email);
          if (!branchAuthorId) continue;

          const branchChapter = createBranchChapter(
            storyId,
            rootNodeId,
            2,
            branchAuthorId,
            branchAuthor.screenName,
            branchData.content,
            branchData.description,
          );

          await insertItem(
            branchChapter,
            `  Branch ${i + 1}: ${branchData.description}`,
          );
          chapterCount++;
          totalBranches++;
          chapterNodeIds.push(branchChapter.nodeId);
          firstLevelBranches.push(branchChapter);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Add 1-2 second-level branches from the first branch
        if (firstLevelBranches.length > 0) {
          console.log(`  🌿 Adding 1-2 second-level branches...`);
          const parentBranch = firstLevelBranches[0];
          const numSecondLevel = Math.floor(Math.random() * 2) + 1; // 1-2 branches

          for (let i = 0; i < numSecondLevel; i++) {
            const branchAuthor = otherUsers[(i + 1) % otherUsers.length];
            const branchAuthorId = userIdMap.get(branchAuthor.email);
            if (!branchAuthorId) continue;

            const secondLevelBranch = createBranchChapter(
              storyId,
              parentBranch.nodeId,
              3,
              branchAuthorId,
              branchAuthor.screenName,
              `${branchAuthor.screenName} continues the story deeper into the narrative.`,
              `${branchAuthor.screenName}'s continuation`,
            );

            await insertItem(
              secondLevelBranch,
              `    Second-level branch ${i + 1}`,
            );
            chapterCount++;
            totalBranches++;
            chapterNodeIds.push(secondLevelBranch.nodeId);
            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          // Update parent branch's childBranches stat
          parentBranch.stats.childBranches = numSecondLevel;
          await docClient.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: parentBranch,
            }),
          );
          console.log(`  ✅ Updated parent branch with ${numSecondLevel} child branches`);
        }
      }

      // Add comments to chapters - MINIMAL and FAST
      console.log(`  💬 Generating comments for chapters...`);
      const allUsers = Array.from(userIdMap.entries());
      const allComments: any[] = [];

      for (const nodeId of chapterNodeIds) {
        // Add 2-3 top-level comments per chapter
        const numTopLevelComments = Math.floor(Math.random() * 2) + 2; // 2-3 comments

        for (let i = 0; i < numTopLevelComments; i++) {
          const [email, userId] = allUsers[Math.floor(Math.random() * allUsers.length)];
          const screenName = userScreenNameMap.get(email) || "Anonymous";

          const commentTexts = [
            "Great chapter!",
            "Love this direction!",
            "Well written!",
            "Can't wait for more!",
          ];

          const comment = createComment(
            storyId,
            nodeId,
            userId,
            screenName,
            commentTexts[Math.floor(Math.random() * commentTexts.length)],
          );

          allComments.push(comment);
          commentCount++;

          // Add 1-2 replies to this comment
          const numReplies = Math.floor(Math.random() * 2) + 1; // 1-2 replies

          for (let j = 0; j < numReplies; j++) {
            const [replyEmail, replyUserId] = allUsers[Math.floor(Math.random() * allUsers.length)];
            const replyScreenName = userScreenNameMap.get(replyEmail) || "Anonymous";

            const reply = createComment(
              storyId,
              nodeId,
              replyUserId,
              replyScreenName,
              "I agree!",
              comment.commentId,
              1,
            );

            allComments.push(reply);
            commentCount++;

            // 50% chance to add ONE reply to reply
            if (Math.random() > 0.5 && j === 0) {
              const [deepReplyEmail, deepReplyUserId] = allUsers[Math.floor(Math.random() * allUsers.length)];
              const deepReplyScreenName = userScreenNameMap.get(deepReplyEmail) || "Anonymous";

              const deepReply = createComment(
                storyId,
                nodeId,
                deepReplyUserId,
                deepReplyScreenName,
                "Thanks!",
                reply.commentId,
                2,
              );

              allComments.push(deepReply);
              commentCount++;
            }
          }
        }
      }

      // Batch insert all comments at once
      if (allComments.length > 0) {
        console.log(`  📦 Inserting ${allComments.length} comments in batches...`);
        await batchInsertItems(allComments, "Comments");
      }

      // Update story with total branches count
      if (totalBranches > 0) {
        story.stats.totalBranches = totalBranches;
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: story,
          }),
        );
        console.log(`  ✅ Updated story with ${totalBranches} total branches`);
      }

      console.log("");
    }

    console.log("");
    console.log(`✨ Seeding complete!`);
    console.log(`   ✅ Successfully created:`);
    console.log(`      👥 Users: ${userIdMap.size}`);
    console.log(`      📚 Stories: ${storyCount}`);
    console.log(`      📖 Chapters: ${chapterCount}`);
    console.log(`      💬 Comments: ${commentCount}`);
    console.log("");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase()
  .then(() => {
    console.log("🎉 Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
