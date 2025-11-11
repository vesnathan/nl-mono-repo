#!/usr/bin/env python3
"""
Generate audio manifest for all AI player dialogue
Creates JSON manifest for ElevenLabs batch audio generation
"""

import json

# AI Character voice IDs
VOICE_IDS = {
    "drunk-danny": "Vr1ZyHpAtTpW6DEVZwwI",
    "clumsy-claire": "ef1T91Fo2YqVYGug3C2p",
    "chatty-carlos": "MnqYh9UZerXWcrKflGOg",
    "superstitious-susan": "8t6aWwL1WUiIpGgYJKnOYrXLriTqHsJZvuBMRrvc",
    "cocky-kyle": "XiPuSi02djl3mdNjSaio",
    "nervous-nancy": "lo7AgX1athQfnbY9sVMj",
    "lucky-larry": "xefN48Dq40rKHHpNo8gn",
    "unlucky-ursula": "ADk3UhQjkXzfOux4ovHq",
}

# Distraction lines from aiCharacters.ts
DISTRACTIONS = {
    "drunk-danny": [
        "Hey barkeep! Another round!",
        "Did I tell you about my ex-wife? She took EVERYTHING...",
        "What was I betting again?",
        "You're a counter aren't ya? I can always tell!",
        "*knocks over chip stack* Oops! My bad buddy!",
        "The room's spinning... is it hot in here?",
        "I once won $10,000 on this very table! Or was it $1,000?",
    ],
    "clumsy-claire": [
        "*drops purse spilling contents everywhere* Oh no! I'm so sorry!",
        "*knocks drink over* I am SO sorry! Does anyone have napkins?",
        "Oops! Did I just hit the wrong button?",
        "*bumps into you* Oh my goodness, excuse me!",
        "Is this chip mine or yours? I can never keep track!",
        "*drops phone* Why do I always do this?",
        "Sorry, sorry! I'm such a klutz!",
    ],
    "chatty-carlos": [
        "So I just closed a deal on THREE luxury sedans! Can you believe it?",
        "My son's in medical school now. I'm paying $60K a year!",
        "Let me tell you about interest rates these days...",
        "You look smart! What do you do for a living?",
        "I've been coming here for 15 years. I know ALL the dealers!",
        "The secret to success is simple: work hard, play hard!",
        "Did you see the game last night? UNBELIEVABLE!",
    ],
    "superstitious-susan": [
        "Wait! My crystal is telling me this isn't a good shoe.",
        "No, no, no! You can't sit there - that's my lucky seat!",
        "The energy at this table feels OFF today.",
        "Mercury is in retrograde, we should all be careful!",
        "I need to sage this table before we continue.",
        "*touching rabbit's foot* Okay universe, show me a sign!",
        "Did anyone else feel that? The energy just shifted!",
    ],
    "cocky-kyle": [
        "I made more today than you'll make all year, buddy.",
        "This? Oh it's just a $3,000 watch. No big deal.",
        "I bet more on breakfast than most people bet all night.",
        "*tips dealer $100* Keep the change, sweetheart.",
        "You playing scared money? That's why you'll never win big.",
        "I could buy this casino if I wanted to.",
        "Amateur hour at this table, I see.",
    ],
    "nervous-nancy": [
        "*whispers* Are they watching us? I think they're watching us!",
        "Is it legal to... never mind, forget I asked!",
        "What if I'm doing this wrong? What if I get banned?",
        "*looking around nervously* Does that camera move?",
        "Should I leave? I feel like I should leave.",
        "My heart is racing. Is this normal?",
        "What happens if security comes over here?",
    ],
    "lucky-larry": [
        "I'm telling you, I can FEEL when I'm gonna win!",
        "This is my seventh blackjack today! SEVEN!",
        "I never lose on Tuesdays. It's my lucky day!",
        "Should I hit on 17? Last time I did, I got a 4!",
        "*wins again* I don't know how I do it folks!",
        "My wife says I should quit while I'm ahead. But why?",
        "Lightning DOES strike twice! I'm proof!",
    ],
    "unlucky-ursula": [
        "Of COURSE the dealer has blackjack. Why wouldn't they?",
        "I bust on 12. That's just... that's my life.",
        "Anyone else would've won that hand. Not me though!",
        "I could have a 20 and the dealer would pull a 21.",
        "*laughs* At least I'm consistent! Consistently unlucky!",
        "You think YOUR luck is bad? Let me tell you...",
        "If it wasn't for bad luck, I'd have no luck at all!",
    ],
}

# Personality reactions
PERSONALITY_REACTIONS = {
    "drunk-danny": {
        "bust": "*hiccup* BUSTED! Fuck!",
        "hit21": "TWENTY-ONE BABY! *slams table*",
        "goodHit": "Haha! Not bad!",
        "badStart": "Ah shit... *squints at cards*",
    },
    "clumsy-claire": {
        "bust": "Oh no! I busted! *drops cards*",
        "hit21": "Twenty-one?! Really?! *knocks drink*",
        "goodHit": "Oh! That's good right?",
        "badStart": "Oh dear... this isn't good...",
    },
    "chatty-carlos": {
        "bust": "BUSTED! Just like that deal I lost last month!",
        "hit21": "TWENTY-ONE! That's how you DO IT!",
        "goodHit": "Nice! Reminds me of this one time...",
        "badStart": "Not great, but you know what I always say...",
    },
    "superstitious-susan": {
        "bust": "BUST! The energy was OFF! I knew it!",
        "hit21": "TWENTY-ONE! The universe provides!",
        "goodHit": "My crystals were RIGHT!",
        "badStart": "Bad energy... I should've cleansed first...",
    },
    "cocky-kyle": {
        "bust": "BUST?! How the FUCK?!",
        "hit21": "TWENTY-ONE! Too easy!",
        "goodHit": "Of course. I called it.",
        "badStart": "Whatever, I've had worse hands...",
    },
    "nervous-nancy": {
        "bust": "BUSTED! Oh god, is that bad?!",
        "hit21": "Twenty-one! *nervous sweat* Did I win?!",
        "goodHit": "Oh! Is that good? That's good right?!",
        "badStart": "*sweating* This feels illegal...",
    },
    "lucky-larry": {
        "bust": "BUST?! My streak is OVER?!",
        "hit21": "TWENTY-ONE! I FELT it coming!",
        "goodHit": "Called it! Lucky Larry strikes!",
        "badStart": "Hmm, my gut says this'll work out...",
    },
    "unlucky-ursula": {
        "bust": "BUST! Of COURSE! *laughs*",
        "hit21": "Twenty-one?! Did that actually happen?!",
        "goodHit": "Wait, I got a GOOD card?!",
        "badStart": "And here we go... classic me...",
    },
}

# Win reactions (5 per character for variety)
WIN_REACTIONS = {
    "drunk-danny": [
        "Haha! Still got it! *hiccup*",
        "Not too shabby for a drunk old man, huh?",
        "I'll drink to that! Another win!",
        "Winner winner! *waves glass*",
        "Bartender! Victory round!",
    ],
    "clumsy-claire": [
        "I won! I actually won! *nervously excited*",
        "Oh! Did I do it right? I think I won!",
        "Yay! *carefully stacks chips*",
        "Is this real? I'm not dreaming?",
        "I didn't mess up! Hooray!",
    ],
    "chatty-carlos": [
        "Nice! That reminds me of this one time...",
        "See? Confidence pays off!",
        "Another win! Just like last Tuesday!",
        "You know, winning's all about attitude...",
        "Victory! Let me tell you about my strategy...",
    ],
    "superstitious-susan": [
        "My crystals KNEW it! Thank you universe!",
        "The energy shift! I felt it coming!",
        "Mercury's in retrograde but I STILL won!",
        "My lucky ritual worked! As always!",
        "Positive vibes! I manifested this!",
    ],
    "cocky-kyle": [
        "Of course I won. Did you expect otherwise?",
        "Too easy. Next?",
        "And THAT'S how it's done.",
        "Did anyone doubt me? Anyone?",
        "I could do this in my sleep.",
    ],
    "nervous-nancy": [
        "I won?! Oh my gosh! *sweating*",
        "Wait, really?! I did it?!",
        "Is this allowed? Am I in trouble?",
        "*nervously celebrates* Yay...?",
        "I won! Why am I still shaking?!",
    ],
    "lucky-larry": [
        "Called it! Lucky Larry strikes again!",
        "My streak continues! Boom!",
        "Luck's on my side tonight!",
        "I FELT this win coming!",
        "Can't stop won't stop!",
    ],
    "unlucky-ursula": [
        "Wait, I WON?! Actually won?!",
        "Did the dealer make a mistake?",
        "I... I won? Is this a trick?",
        "Finally! FINALLY!",
        "A win! Mark your calendars!",
    ],
}

# Loss reactions (5 per character for variety)
LOSS_REACTIONS = {
    "drunk-danny": [
        "Ah hell... where'd my chips go?",
        "Son of a... *hiccup* ...I had that!",
        "Dammit. Dealer got lucky that time.",
        "*slurs* That was MY hand!",
        "Bartender! I need another drink!",
    ],
    "clumsy-claire": [
        "Oh no... I lost... *sad face*",
        "Aww... did I do something wrong?",
        "I tried my best... *sighs*",
        "*carefully collects remaining chips*",
        "Maybe next time... *hopeful*",
    ],
    "chatty-carlos": [
        "Well THAT'S frustrating! You know what though...",
        "Loss! But here's the thing about losses...",
        "Dealer wins! Reminds me of Q3 earnings...",
        "Ah well! As my mentor always said...",
        "Lost that one! But perspective is key...",
    ],
    "superstitious-susan": [
        "The dealer's energy was too strong!",
        "I KNEW I should've cleansed before this hand!",
        "The moon's phase was against me!",
        "Negative vibes! I felt them!",
        "My crystals need recharging!",
    ],
    "cocky-kyle": [
        "Dealer got lucky. That's all.",
        "Fluke. Pure fluke.",
        "Whatever. Next hand's mine.",
        "That shouldn't have happened.",
        "Luck. Nothing but luck.",
    ],
    "nervous-nancy": [
        "Oh no oh no! I KNEW it!",
        "*panicking* I lost! Is everyone mad?!",
        "I'm so sorry! *to nobody in particular*",
        "I should've known! *sweating*",
        "This is bad! This is really bad!",
    ],
    "lucky-larry": [
        "Lost? Huh. Doesn't happen often!",
        "Dealer got one over on me! Rare!",
        "Well that's unusual for me...",
        "Lost! But my luck'll turn around!",
        "A loss! But I'll bounce back!",
    ],
    "unlucky-ursula": [
        "Of course! Why would I expect anything else?!",
        "Classic me! *laughs bitterly*",
        "Lost again! Story of my life!",
        "Yep. There it is. As expected.",
        "I called it! Knew I'd lose!",
    ],
}

# Dealer blackjack reactions (5 per character)
DEALER_BLACKJACK_REACTIONS = {
    "drunk-danny": [
        "Dealer blackjack?! This night just gets worse!",
        "Of course the dealer pulls 21. OF COURSE!",
        "*hiccup* Blackjack? Really?!",
        "That's just... *waves hand* ...unfair!",
        "Dealer blackjack! Bartender! NOW!",
    ],
    "clumsy-claire": [
        "Dealer got blackjack?! Oh my!",
        "Oh no! Natural 21! *gasps*",
        "Blackjack! Well... okay then...",
        "The dealer got blackjack? *nervous laugh*",
        "*sighs* Dealer blackjack... of course...",
    ],
    "chatty-carlos": [
        "Dealer blackjack! You know, statistically...",
        "Natural 21! That's like when my client...",
        "Dealer blackjack! Reminds me of this seminar...",
        "Blackjack! But here's an interesting fact...",
        "Dealer 21! Well THAT'S a conversation starter!",
    ],
    "superstitious-susan": [
        "Dealer blackjack! The universe is testing me!",
        "Natural 21! Dark energy at work!",
        "Dealer blackjack! Mercury retrograde strikes!",
        "The dealer's aura is TOO strong!",
        "Blackjack! The cosmos are against me!",
    ],
    "cocky-kyle": [
        "Dealer blackjack?! That's BULLSHIT!",
        "How?! HOW does the dealer get blackjack?!",
        "Dealer 21! That's just lucky!",
        "Blackjack! Unbelievable!",
        "Of COURSE the dealer gets blackjack!",
    ],
    "nervous-nancy": [
        "DEALER BLACKJACK?! *panics*",
        "Oh god! Natural 21! We're doomed!",
        "*hyperventilating* Blackjack! Blackjack!",
        "Dealer blackjack! I KNEW this would happen!",
        "Natural 21! This is my nightmare!",
    ],
    "lucky-larry": [
        "Dealer blackjack?! My luck ran out!",
        "Natural 21! Well that's rare!",
        "Dealer blackjack! Even I can't beat that!",
        "Blackjack! The streak ends here!",
        "Dealer 21! That's... actually impressive!",
    ],
    "unlucky-ursula": [
        "Dealer blackjack! Of course! CLASSIC!",
        "Natural 21! Because why WOULDN'T they?!",
        "Dealer blackjack! This is SO on-brand for my luck!",
        "*laughs* Dealer blackjack! I CALLED IT!",
        "Blackjack! The universe hates me!",
    ],
}

# Voice settings optimized for character performances
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.82,
    "style": 0.15,
    "use_speaker_boost": True
}

def generate_manifest():
    """Generate complete AI player audio manifest"""
    items = []

    for char_id, voice_id in VOICE_IDS.items():
        char_name = char_id.replace("-", "_")

        # 1. Distractions (7 per character)
        for idx, text in enumerate(DISTRACTIONS[char_id], 1):
            items.append({
                "voice_id": voice_id,
                "text": text,
                "voice_settings": VOICE_SETTINGS,
                "filename": f"audio/players/{char_id}/distraction_{idx:02d}.mp3"
            })

        # 2. Personality reactions (4 per character: bust, hit21, goodHit, badStart)
        for reaction_type, text in PERSONALITY_REACTIONS[char_id].items():
            items.append({
                "voice_id": voice_id,
                "text": text,
                "voice_settings": VOICE_SETTINGS,
                "filename": f"audio/players/{char_id}/{reaction_type}_01.mp3"
            })

        # 3. Win reactions (5 per character)
        for idx, text in enumerate(WIN_REACTIONS[char_id], 1):
            items.append({
                "voice_id": voice_id,
                "text": text,
                "voice_settings": VOICE_SETTINGS,
                "filename": f"audio/players/{char_id}/win_{idx:02d}.mp3"
            })

        # 4. Loss reactions (5 per character)
        for idx, text in enumerate(LOSS_REACTIONS[char_id], 1):
            items.append({
                "voice_id": voice_id,
                "text": text,
                "voice_settings": VOICE_SETTINGS,
                "filename": f"audio/players/{char_id}/loss_{idx:02d}.mp3"
            })

        # 5. Dealer blackjack reactions (5 per character)
        for idx, text in enumerate(DEALER_BLACKJACK_REACTIONS[char_id], 1):
            items.append({
                "voice_id": voice_id,
                "text": text,
                "voice_settings": VOICE_SETTINGS,
                "filename": f"audio/players/{char_id}/dealer_blackjack_{idx:02d}.mp3"
            })

    manifest = {
        "model_id": "eleven_multilingual_v2",
        "output_format": "mp3_44100",
        "items": items
    }

    return manifest

if __name__ == "__main__":
    manifest = generate_manifest()

    # Write to file
    output_file = "ai-players-manifest.json"
    with open(output_file, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"✓ Generated manifest with {len(manifest['items'])} audio files")
    print(f"✓ Written to {output_file}")

    # Summary
    print("\nBreakdown:")
    print(f"  - 8 characters × 7 distractions = {8 * 7} files")
    print(f"  - 8 characters × 4 reactions = {8 * 4} files")
    print(f"  - 8 characters × 5 wins = {8 * 5} files")
    print(f"  - 8 characters × 5 losses = {8 * 5} files")
    print(f"  - 8 characters × 5 dealer_blackjack = {8 * 5} files")
    print(f"  TOTAL: {len(manifest['items'])} audio files")
