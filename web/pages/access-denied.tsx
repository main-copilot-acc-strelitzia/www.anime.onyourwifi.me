'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '@/styles/access-denied.module.css';

// 50 taunts for wrong answers (40 anime-themed)
const WRONG_ANSWER_TAUNTS = [
  // Anime-themed (40)
  "NANI?! Wrong answer! Even Naruto would get this right! 😒",
  "DATTEBAYO! That wasn't it! Better luck next time! 😒",
  "Sugoi! WRONG! Did you skip the opening like Erwin commanded? 😒",
  "Yabai! Wrong answer, you absolute baka! 😒",
  "Omae wa mou shindeiru - your answer anyway! 😒",
  "PLUS ULTRA was about your answer being ULTRA wrong! 😒",
  "That answer was more cursed than Sukuna! 😒",
  "Your answer is as weak as a Demon Slayer without a sword! 😒",
  "Even Tanjiro could smell that wrong answer from a mile away! 😒",
  "That's giving 'I haven't watched anime' energy! 😒",
  "Wrong! Even a side character would know this! 😒",
  "Your answer just got sent to the shadow realm! 😒",
  "That answer is as weak as Yamcha! 😒",
  "SHINZOU WO SASAGEYO your brain cells! 😒",
  "Wrong answer! Did you sleep through the episodes? 😒",
  "That answer gets an F from All Might! 😒",
  "Itachi is disappointed in your answer! 😒",
  "Even Deku with no quirk would know this! 😒",
  "Your answer just got demolished by a Titan! 😒",
  "Wrong! Did you only watch the opening? 😒",
  "That answer is more lost than Zoro! 😒",
  "Your answer got caught in an infinite tsukuyomi! 😒",
  "Even the weakest Straw Hat would get this right! 😒",
  "That answer just got genjutsu'd! 😒",
  "Wrong! Saitama could defeat that with one punch! 😒",
  "Your answer is as edgy as Sasuke! 😒",
  "That's a major L like losing to the enemy's final form! 😒",
  "Your answer needs a redemption arc! 😒",
  "Even Mitsuri would protect the right answer better! 😒",
  "That answer is cursed to the Shadow Realm! 😒",
  "Wrong! You're not the protagonist of this story! 😒",
  "Your answer just triggered All For One's disappointment! 😒",
  "That's weaker than a quirk-less Deku! 😒",
  "Your answer failed the entrance exam! 😒",
  "Even Bakugo's explosions didn't hurt as much as that! 😒",
  "Your answer got sent to the Underworld! 😒",
  "That answer is more tangled than Rapunzel's hair! 😒",
  "Wrong! Even a filler episode had better plot! 😒",
  "Your answer just got banished to another dimension! 😒",
  "That's as bad as a beach episode plot! 😒",

  // Regular taunts (10)
  "Wrong answer! Better luck next time! 😒",
  "Nope! Try again when you're ready! 😒",
  "That's not it! Keep thinking! 😒",
  "Wrong! Did you even read the question? 😒",
  "Not quite! Want to try again? 😒",
  "Ouch! That was way off! 😒",
  "Wrong answer! Go sit in the corner! 😒",
  "You're not even close! 😒",
  "WRONG! Better luck in 60 seconds! 😒",
  "That answer is incorrect! Step back! 😒",
];

// 50 taunts for refresh detection (40 anime-themed)
const REFRESH_TAUNTS = [
  // Anime-themed (40)
  "🤖 YOU ARE A BOT! Refreshing is not allowed! Did Naruto teach you nothing?! 🤖",
  "🤖 BOT DETECTED! Just like how Shikamaru detects enemy patterns! 🤖",
  "🤖 BEEP BOOP! Automated behavior detected! Not on my watch! 🤖",
  "🤖 You're showing bot behavior like a malfunctioning cyborg from Cyberpunk! 🤖",
  "🤖 ROBOT MODE ACTIVATED! This is automatic bot detection! 🤖",
  "🤖 Refreshing detected! You're acting like a script, not a human! 🤖",
  "🤖 BOT ALERT! This is more suspicious than Itachi's motives! 🤖",
  "🤖 Caught red-handed! Your refresh attempt screams BOT! 🤖",
  "🤖 BEEP BOOP! Automated refresh detected - you're not fooling anyone! 🤖",
  "🤖 Bot behavior level: Skynet! Refreshing won't help you! 🤖",
  "🤖 You're as mechanical as a Gundam refresh cycle! 🤖",
  "🤖 That refresh was more predictable than filler episodes! 🤖",
  "🤖 Bot detected! Even Saitama wouldn't fall for this! 🤖",
  "🤖 Your refresh pattern is as obvious as a jump in an anime season finale! 🤖",
  "🤖 BZZZT! Bot sounds! Automatic behavior won't work here! 🤖",
  "🤖 You're showing more bot traits than code:Breaker! 🤖",
  "🤖 Refresh attempt = Bot confirmed! This is not a glitch! 🤖",
  "🤖 Even Alphonse could tell you're being too mechanical! 🤖",
  "🤖 Your refresh is as clumsy as a first-time power-up scene! 🤖",
  "🤖 Bot mode: ENGAGED! You just triggered the alarm! 🤖",
  "🤖 REFLEXIVE DETECTION ACTIVATED! You're acting like a machine! 🤖",
  "🤖 Refreshing = Bot signature! Caught in 4K! 🤖",
  "🤖 Your behavior pattern matches ZERO from Megaman! 🤖",
  "🤖 BEEP! BOOP! Bot detected by advanced algorithms! 🤖",
  "🤖 That's not how humans interact! You're a bot! 🤖",
  "🤖 Refresh cycle detected! Very robotic of you! 🤖",
  "🤖 Your pattern recognition just failed - you're clearly automated! 🤖",
  "🤖 ARTIFICIAL BEHAVIOR CONFIRMED! No humans refresh this! 🤖",
  "🤖 You're showing more artificial signs than an AI love interest! 🤖",
  "🤖 Refresh detected! More obvious than a tsundere character! 🤖",
  "🤖 BOT PROTOCOL ACTIVATED! Automatic refresh = automatic fail! 🤖",
  "🤖 Your mechanical behavior is showing! And we don't like bots here! 🤖",
  "🤖 SYSTEM ALERT: BOT DETECTED IN SECTOR 7! 🤖",
  "🤖 That refresh screams 'I'm running a script'! 🤖",
  "🤖 Your behavior matches bot signature #42! You're busted! 🤖",
  "🤖 Refreshing? Really? That's bot 101! 🤖",
  "🤖 Your pattern is more predictable than a magical girl transformation! 🤖",
  "🤖 BEEP BOOP BEEP! Automatic behavior detected! 🤖",
  "🤖 Even a sentient AI would laugh at your bot attempt! 🤖",
  "🤖 Refresh = Evidence of automation! Case closed! 🤖",

  // Regular taunts (10)
  "🤖 YOU ARE A BOT! Refreshing is not allowed! 🤖",
  "🤖 Bot behavior detected! No refreshing allowed! 🤖",
  "🤖 Automatic refresh = Automatic ban! Stop it! 🤖",
  "🤖 BEEP BOOP! Bot detected! 🤖",
  "🤖 Refreshing won't save you, bot! 🤖",
  "🤖 Your refresh attempt is very suspicious, bot! 🤖",
  "🤖 Automatic behavior detected! You're clearly a bot! 🤖",
  "🤖 BEEP! That's bot behavior! 🤖",
  "🤖 Refresh detected! We don't allow bots here! 🤖",
  "🤖 You're showing clear signs of being automated! 🤖",
];

// 50 taunts for timeout (40 anime-themed)
const TIMEOUT_TAUNTS = [
  // Anime-themed (40)
  "⏰ TIME'S UP! Even speedsters need to read questions! You got isekai'd to timeout! ⏰",
  "⏰ DATTEBAYO! Your time expired like a jutsu cooldown! ⏰",
  "⏰ YOU WERE TOO SLOW! Even Iida's speed would have answered! ⏰",
  "⏰ TIME OVER! Did you activate a 10-second rule like Jojo's? ⏰",
  "⏰ COUNTDOWN COMPLETE! Your window closed faster than a manga chapter! ⏰",
  "⏰ TIME'S UP! Even Okabe's time travel can't save you now! ⏰",
  "⏰ BUZZER SOUNDS! Like an anime tournament elimination! ⏰",
  "⏰ TEN SECONDS WASN'T ENOUGH! You're slower than Saitama's comedy bits! ⏰",
  "⏰ TIME EXPIRED! You froze like Todoroki's ice wall! ⏰",
  "⏰ TICK TOCK! That's why you failed faster than Sakura's plans! ⏰",
  "⏰ TIME OUT! You're eliminated like a tournament contestant! ⏰",
  "⏰ WHAT?! You ran out of time like a hero's first encounter! ⏰",
  "⏰ NO TIME LEFT! Even Nagato couldn't extend your countdown! ⏰",
  "⏰ YOU WERE TOO SLOW! Flash is disappointed! ⏰",
  "⏰ RING THE BELL! Your turn is over! ⏰",
  "⏰ TIME PARADOX! You needed more time than 10 seconds! ⏰",
  "⏰ SPEED TEST FAILED! You're slower than a slime isekai! ⏰",
  "⏰ TIMEOUT ENGAGED! Like a boss battle timer! ⏰",
  "⏰ CLOCK STRUCK ZERO! Your answer window closed! ⏰",
  "⏰ TEN SECONDS WAS GENEROUS! You still failed! ⏰",
  "⏰ TIMER EXPIRED! You're out like a failed transformation! ⏰",
  "⏰ BUZZER ACTIVATED! Better luck in 60 seconds! ⏰",
  "⏰ TIME'S UP! Even with more time, you'd still fail! ⏰",
  "⏰ COUNTDOWN ENDED! Like a manga chapter cliffhanger! ⏰",
  "⏰ YOU LOST THE RACE AGAINST TIME! ⏰",
  "⏰ TEN SECONDS PASSED! Did you even start thinking? ⏰",
  "⏰ SPEED RUN FAILED! Even casual players did better! ⏰",
  "⏰ TIME LOOP BROKEN! And you're stuck in timeout! ⏰",
  "⏰ TICK TOCK BOOM! Your time is up! ⏰",
  "⏰ THE CLOCK HAS SPOKEN! Time to cool down! ⏰",
  "⏰ TEMPORAL PARADOX! You needed infinity time! ⏰",
  "⏰ TIMER RINGS! Your turn is finished! ⏰",
  "⏰ SECONDS CONSUMED! 10 was too little? Really? ⏰",
  "⏰ CLOCK MOCKING YOU! Time's up, speedster! ⏰",
  "⏰ YOUR TIME IS COMPLETE! Better luck in 60! ⏰",
  "⏰ TEN SECONDS FLEW BY! You didn't even try! ⏰",
  "⏰ TIMEOUT ACTIVATED! No more free time! ⏰",
  "⏰ TIMER EXPLODED! Just like your chances! ⏰",
  "⏰ BELL RANG! Class is over, genius! ⏰",
  "⏰ SAND RAN OUT! Your hourglass is empty! ⏰",

  // Regular taunts (10)
  "⏰ TIME'S UP! You were too slow! ⏰",
  "⏰ You ran out of time! Better luck next round! ⏰",
  "⏰ TIMEOUT! 10 seconds wasn't enough for you! ⏰",
  "⏰ THE CLOCK HAS SPOKEN! Time to rest! ⏰",
  "⏰ YOU WERE TOO SLOW! Time expired! ⏰",
  "⏰ BUZZER SOUNDS! Your time is up! ⏰",
  "⏰ TIMEOUT ENGAGED! Cool down and try again! ⏰",
  "⏰ YOU DIDN'T ANSWER IN TIME! ⏰",
  "⏰ TICK TOCK! Your turn is over! ⏰",
  "⏰ TIME'S UP! Better luck in 60 seconds! ⏰",
];

export default function AccessDeniedPage() {
  const router = useRouter();
  const [reason, setReason] = useState<'wrong_answer' | 'refresh' | 'timeout' | 'unknown'>('unknown');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [taunt, setTaunt] = useState('');

  useEffect(() => {
    // Determine reason from query params
    const queryReason = router.query.reason as string;
    if (queryReason && ['wrong_answer', 'refresh', 'timeout'].includes(queryReason)) {
      setReason(queryReason as any);
    }

    // Get cooldown from localStorage or query
    const cooldownStr = router.query.cooldown as string;
    if (cooldownStr) {
      const cooldown = parseInt(cooldownStr);
      setTimeRemaining(cooldown);

      // Start countdown
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push('/security-challenge');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [router.query, router]);

  useEffect(() => {
    // Select taunt based on reason
    let selectedTaunts: string[] = WRONG_ANSWER_TAUNTS;
    
    if (reason === 'refresh') {
      selectedTaunts = REFRESH_TAUNTS;
    } else if (reason === 'timeout') {
      selectedTaunts = TIMEOUT_TAUNTS;
    }

    const randomTaunt = selectedTaunts[Math.floor(Math.random() * selectedTaunts.length)];
    setTaunt(randomTaunt);
  }, [reason]);

  const getTauntMessage = () => {
    return taunt || "Wrong answer! Better luck next time!";
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'wrong_answer':
        return getTauntMessage();
      case 'refresh':
        return "🤖 We detected automated refresh behavior!";
      case 'timeout':
        return "⏰ You ran out of time!";
      default:
        return "Wrong! Sit in the corner and think about what you did.";
    }
  };

  const getEmoji = () => {
    switch (reason) {
      case 'wrong_answer':
        return '😒';
      case 'refresh':
        return '🤖';
      case 'timeout':
        return '⏰';
      default:
        return '❌';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        {[...Array(15)].map((_, i) => (
          <div key={i} className={styles.particle}></div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.emoji}>{getEmoji()}</div>

        <h1 className={styles.title}>
          {reason === 'refresh'
            ? 'BOT DETECTED!'
            : reason === 'timeout'
            ? "TIME'S UP!"
            : 'WRONG ANSWER!'}
        </h1>

        <p className={styles.message}>{getTauntMessage()}</p>

        {reason === 'refresh' && (
          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              🤖 Refreshing the security challenge is bot-like behavior.
              <br />
              <strong>Next time, just answer the question without reloading!</strong>
            </p>
          </div>
        )}

        <div className={styles.cooldownBox}>
          <div className={styles.cooldownLabel}>Come back in:</div>
          <div className={styles.cooldownTime}>{Math.max(0, timeRemaining)}</div>
          <div className={styles.cooldownUnit}>
            {Math.max(0, timeRemaining) === 1 ? 'second' : 'seconds'}
          </div>
        </div>

        <div className={styles.timerBar}>
          <div
            className={styles.timerFill}
            style={{
              width: `${Math.max(0, timeRemaining) * 5}%`,
            }}
          ></div>
        </div>

        <div className={styles.advice}>
          <h3>Quick Tips for Next Time:</h3>
          <ul>
            <li>
              <strong>Read carefully:</strong> Don't rush through the question
            </li>
            <li>
              <strong>Double-check:</strong> Make sure your answer is correct
            </li>
            <li>
              <strong>No refreshing:</strong> That's exactly what bots do
            </li>
            <li>
              <strong>You have 10 seconds:</strong> Plan your answer wisely
            </li>
          </ul>
        </div>

        <div className={styles.notice}>
          <p>
            <strong>Auto-redirecting to security challenge...</strong>
          </p>
          <Link href="/security-challenge">
            <a className={styles.manualLink}>Or click here to try again now</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
