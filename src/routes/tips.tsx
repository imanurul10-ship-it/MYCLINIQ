import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Clock,
  BookmarkPlus,
  Newspaper,
  HeartPulse,
  Activity,
  Apple,
  Brain,
  Sparkles,
  GraduationCap,
  ArrowLeft,
  Play,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import whoFluGuidelines from "@/assets/who-flu-guidelines.jpg";

export const Route = createFileRoute("/tips")({
  component: TipsPage,
  head: () => ({
    meta: [
      { title: "Health Library & Education · MyClinIQ" },
      { name: "description", content: "Full health articles, daily news, wellness routines, and an education space for staff & patients." },
    ],
  }),
});

type Tab = "tips" | "news" | "wellness" | "education";

interface Article {
  id: string;
  title: string;
  summary: string;
  readMins: number;
  icon: typeof HeartPulse;
  tag: string;
  cover: string; // unsplash url
  body: string[]; // paragraphs
}

const ARTICLES: Record<Exclude<Tab, "education">, Article[]> = {
  tips: [
    {
      id: "t1",
      title: "Managing Fever at Home — A Complete Guide",
      summary: "Hydrate, rest, and monitor temperature. When to call a doctor.",
      readMins: 4,
      icon: HeartPulse,
      tag: "Self-care",
      cover: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=800&auto=format&fit=crop",
      body: [
        "Fever is the body's natural defence mechanism — a controlled rise in core temperature that helps the immune system fight infection. In adults, anything above 38°C (100.4°F) is generally considered a fever, while in infants under 3 months even 38°C warrants immediate medical attention.",
        "**Step 1 — Hydrate aggressively.** Each 1°C above normal increases fluid loss by roughly 10%. Drink small sips of plain water, isotonic drinks, or barley water every 15–20 minutes. Avoid sugary sodas which can worsen dehydration.",
        "**Step 2 — Rest in a cool environment.** Wear light cotton clothing, keep the room around 24–26°C, and avoid layering thick blankets even when you feel chills. A lukewarm sponge on the forehead, neck, and armpits helps more than ice (which causes shivering and raises temperature).",
        "**Step 3 — Use paracetamol responsibly.** Adults: 500–1000mg every 4–6 hours, max 4g/day. Never combine with other paracetamol-containing flu medication. Avoid ibuprofen if you have stomach ulcers, kidney disease, or are pregnant in the third trimester.",
        "**Call a doctor immediately if:** fever exceeds 39.5°C and won't come down, lasts more than 3 days, or comes with stiff neck, severe headache, rash, breathing difficulty, confusion, or seizures. For infants under 3 months with any fever — go to A&E now.",
        "Most viral fevers resolve within 48–72 hours with supportive care. The goal is comfort, not eliminating the fever itself.",
      ],
    },
    {
      id: "t2",
      title: "Recognising Heart Attack Symptoms — Time = Muscle",
      summary: "Chest pain with breathlessness needs urgent attention. Know the signs.",
      readMins: 6,
      icon: Activity,
      tag: "Urgent",
      cover: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop",
      body: [
        "Every minute during a heart attack, roughly 10 million heart muscle cells die. Recognising symptoms early can save your life — or someone else's.",
        "**Classic symptoms:** crushing or squeezing chest pain in the centre or left side, often described as an elephant sitting on the chest. The pain may radiate to the left arm, jaw, neck, or back, and typically lasts more than a few minutes.",
        "**Atypical symptoms (more common in women, elderly, diabetics):** unusual fatigue, shortness of breath, nausea, cold sweats, light-headedness, or pain only in the upper back or jaw — without obvious chest discomfort.",
        "**What to do RIGHT NOW if you suspect a heart attack:**\n1. Call 999 immediately — do not drive yourself.\n2. Chew (don't swallow) one 300mg aspirin tablet if available and you're not allergic.\n3. Sit down and stay calm. Loosen tight clothing.\n4. If the person becomes unresponsive and isn't breathing, start CPR (100–120 chest compressions per minute).",
        "Risk factors you can change: smoking, high blood pressure, diabetes, high cholesterol, obesity, and physical inactivity. Get your numbers checked annually after age 35.",
      ],
    },
    {
      id: "t3",
      title: "Sleep & Recovery — The 7–9 Hour Rule",
      summary: "How proper sleep speeds healing and boosts immunity.",
      readMins: 5,
      icon: Brain,
      tag: "Lifestyle",
      cover: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop",
      body: [
        "Sleep is when your body does its most important repair work. During deep sleep, growth hormone surges, immune cells multiply, and the brain flushes out metabolic waste through the glymphatic system.",
        "**The science:** Adults who sleep less than 6 hours a night are 4× more likely to catch a cold than those getting 7+ hours. After just one night of 4-hour sleep, natural killer cell activity drops by 70%.",
        "**Build a sleep routine:** Same bedtime and wake time every day (yes, weekends too). Dim lights 90 minutes before bed. No screens 30 minutes before sleep — blue light suppresses melatonin by up to 50%.",
        "**Bedroom rules:** Cool (18–20°C), dark (blackout curtains), and quiet. If you wake at 3am with a racing mind, write the thought down on paper and return to bed — don't reach for your phone.",
        "If you snore heavily, gasp during sleep, or wake unrefreshed despite 8 hours — get screened for sleep apnoea. It's treatable and dramatically improves life expectancy.",
      ],
    },
  ],
  news: [
    {
      id: "n1",
      title: "WHO Updates 2025 Seasonal Flu Vaccination Guidelines",
      summary: "Refined recommendations for high-risk groups and pregnant women.",
      readMins: 3,
      icon: Newspaper,
      tag: "Update",
      cover: whoFluGuidelines,
      body: [
        "The World Health Organisation has issued updated influenza vaccination guidelines for the 2025 northern and southern hemisphere seasons. The quadrivalent vaccine now covers two influenza A strains (H1N1 and H3N2) and two B lineages.",
        "**Priority groups for vaccination:** pregnant women at any trimester, children aged 6–59 months, adults over 65, healthcare workers, and individuals with chronic conditions including diabetes, asthma, heart disease, and immunocompromised states.",
        "Malaysia's Ministry of Health has aligned with these recommendations and made the vaccine available at all government klinik kesihatan from January 2025. The cost remains free for at-risk groups.",
        "Studies show vaccinated pregnant women pass protective antibodies to their newborns, reducing infant flu hospitalisation by up to 72% in the first 6 months of life.",
      ],
    },
    {
      id: "n2",
      title: "Telehealth Adoption Surges 60% in Southeast Asian Clinics",
      summary: "Pre-arrival AI triage now standard in most urban Malaysian clinics.",
      readMins: 4,
      icon: Newspaper,
      tag: "Industry",
      cover: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop",
      body: [
        "A new ASEAN healthcare report shows that 60% of urban clinics in Malaysia, Singapore, and Thailand now offer some form of pre-arrival triage — a fundamental shift from the queue-and-wait model that dominated for decades.",
        "Apps like MyClinIQ allow patients to describe symptoms via AI chat or upload photos before arriving, helping clinics route critical cases to the front and giving low-acuity patients accurate wait estimates.",
        "Early data suggests these systems reduce average waiting room time by 35% and improve patient satisfaction scores by 28%. Critically, emergency cases are identified an average of 12 minutes earlier than walk-in triage alone.",
        "The next frontier is integrated electronic prescribing and direct hand-off to pharmacy — expected in most major Klang Valley clinics by mid-2025.",
      ],
    },
    {
      id: "n3",
      title: "New Guidance on Prenatal Nutrition for Malaysian Mothers",
      summary: "Folic acid timing and trimester-specific intake reviewed.",
      readMins: 5,
      icon: Newspaper,
      tag: "Maternal",
      cover: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop",
      body: [
        "The Malaysian Dietary Guidelines for Pregnant Women have been updated to reflect new evidence on micronutrient timing. Folic acid (400mcg) is now recommended starting 3 months BEFORE conception, not just after a positive pregnancy test.",
        "**Trimester 1 (weeks 1–12):** focus on folic acid, vitamin B12, and iodine. Avoid raw fish, unpasteurised dairy, and limit caffeine to 200mg/day (about 1 cup of coffee).",
        "**Trimester 2 (weeks 13–27):** iron requirements double. Include lean red meat, dark leafy greens, and legumes. Vitamin C with iron-rich meals improves absorption by 3×.",
        "**Trimester 3 (weeks 28–40):** calcium and DHA omega-3 become critical for fetal brain and bone development. Two servings of low-mercury fish per week (mackerel, sardines, anchovies) are encouraged.",
        "Avoid: liver (vitamin A toxicity), high-mercury fish (swordfish, marlin), alcohol, and unwashed produce throughout pregnancy.",
      ],
    },
  ],
  wellness: [
    {
      id: "w1",
      title: "10-Minute Desk Stretch Routine to Counter Back Pain",
      summary: "Counter back pain from prolonged sitting with these 6 movements.",
      readMins: 3,
      icon: Activity,
      tag: "Movement",
      cover: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
      body: [
        "Sitting for 8+ hours daily is now considered as harmful to long-term health as smoking. The good news: 10 minutes of targeted movement, done every 2 hours, can offset most of the damage.",
        "**1. Neck rolls (30s):** Slowly rotate your head clockwise 5 times, then anti-clockwise.",
        "**2. Shoulder shrugs (30s):** Lift shoulders to ears, hold 5s, release. Repeat 8×.",
        "**3. Seated spinal twist (1 min each side):** Place right hand on left knee, left hand behind you, twist gently. Hold 30s.",
        "**4. Cat-cow at desk (1 min):** Hands on knees, arch back inhaling, round spine exhaling.",
        "**5. Hip flexor stretch (1 min each side):** Stand, place one foot on chair behind you, gently push hips forward.",
        "**6. Forward fold (1 min):** Stand, hinge at hips, let arms hang. Bend knees if hamstrings are tight.",
        "Set a recurring 2-hour timer. Your back at 60 will thank you.",
      ],
    },
    {
      id: "w2",
      title: "The Anti-inflammatory Plate — Build Better Meals",
      summary: "Build meals with leafy greens, omega-3s, and antioxidant-rich berries.",
      readMins: 6,
      icon: Apple,
      tag: "Nutrition",
      cover: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop",
      body: [
        "Chronic low-grade inflammation underlies most modern diseases — heart disease, type 2 diabetes, Alzheimer's, and many cancers. Your daily plate is your most powerful medicine.",
        "**Half the plate — colourful vegetables.** Broccoli, kangkung, bayam, kale, capsicum, tomato, carrot. Aim for 3+ colours per meal. Cooking lightly preserves heat-sensitive vitamins.",
        "**A quarter — lean protein.** Salmon, sardines, mackerel (omega-3 rich). Skinless chicken, eggs, tempeh, tofu, lentils, dal. Limit red meat to 1–2 servings/week.",
        "**A quarter — slow carbs.** Brown rice, quinoa, oats, sweet potato, wholegrain roti. Skip white rice, white bread, sugary drinks.",
        "**Anti-inflammatory boosters:** turmeric (with black pepper for absorption), ginger, garlic, green tea, dark chocolate (70%+), and a daily handful of nuts.",
        "**Avoid:** ultra-processed foods, fried foods, sugary drinks, refined carbs, and trans fats. These actively promote inflammation.",
      ],
    },
    {
      id: "w3",
      title: "5-Minute Mindful Box Breathing for Stress",
      summary: "Lower cortisol with this Navy SEAL technique — works in 60 seconds.",
      readMins: 2,
      icon: Brain,
      tag: "Mind",
      cover: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop",
      body: [
        "Box breathing — used by Navy SEALs to stay calm under fire — activates the parasympathetic nervous system, lowering heart rate, blood pressure, and cortisol within minutes.",
        "**The technique (4 phases × 4 seconds each):**\n1. Inhale through nose for 4 seconds.\n2. Hold breath for 4 seconds.\n3. Exhale through mouth for 4 seconds.\n4. Hold empty for 4 seconds.\nRepeat for 5 minutes.",
        "**When to use it:** before a presentation, after a conflict, when you can't fall asleep, during a panic attack, or any time you feel overwhelmed.",
        "Studies show 4 weeks of daily practice reduces anxiety scores by 40% and improves sleep quality by 30%. It's free, requires no app, and works anywhere.",
      ],
    },
  ],
};

interface Module {
  title: string;
  mins: number;
  videoId?: string; // YouTube video ID
  body: string[]; // paragraphs of readable content
}

interface Course {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  level: "Patient" | "Caregiver" | "Staff";
  modules: Module[];
  cover: string;
}

const COURSES: Course[] = [
  {
    id: "c1",
    title: "Diabetes 101 — Living Well with Type 2",
    description: "A 6-module patient education course on managing blood sugar, diet, and complications.",
    durationMins: 45,
    level: "Patient",
    cover: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&auto=format&fit=crop",
    modules: [
      {
        title: "What is diabetes?",
        mins: 6,
        videoId: "PTAVuDwSQvE",
        body: [
          "Type 2 diabetes is a long-term condition where your body either cannot make enough insulin or cannot use it properly. Insulin is the hormone that allows sugar (glucose) from food to enter your cells for energy.",
          "When insulin doesn't work properly, glucose builds up in your blood. Over years, high blood sugar damages blood vessels, nerves, kidneys, eyes, and the heart.",
          "**Good news:** type 2 diabetes can be managed — and sometimes reversed — with a combination of diet, regular movement, weight management, and medication when needed.",
        ],
      },
      {
        title: "Reading your blood sugar",
        mins: 8,
        videoId: "rMMpeLLgdgY",
        body: [
          "**Fasting glucose (no food for 8h):** target 4.0–7.0 mmol/L.",
          "**2 hours after a meal:** target under 10.0 mmol/L.",
          "**HbA1c (3-month average):** target under 7.0% for most adults.",
          "Test at the same times daily and write your readings in a logbook or app — patterns matter more than single numbers.",
        ],
      },
      {
        title: "Carbohydrate counting basics",
        mins: 10,
        videoId: "am6ga3tSnpk",
        body: [
          "Carbohydrates raise blood sugar the most. One serving = about 15g of carbs (a slice of bread, half a cup of rice, one small fruit).",
          "Aim for 3–5 carb servings per main meal. Fill half your plate with non-starchy vegetables, a quarter with lean protein, and a quarter with slow carbs.",
          "**Avoid:** sugary drinks, white rice in large portions, kuih, and processed snacks.",
        ],
      },
      {
        title: "Foot care daily checklist",
        mins: 7,
        videoId: "17r-d_l-IEk",
        body: [
          "Diabetes can damage nerves in the feet — small wounds may go unnoticed and become serious infections.",
          "**Daily:** wash with warm (not hot) water, dry between toes, check for cuts/blisters with a mirror, and moisturise — but never between toes.",
          "**Never:** walk barefoot, use hot water bottles, or cut corns yourself. See a podiatrist every 6 months.",
        ],
      },
      {
        title: "When to call your doctor",
        mins: 6,
        videoId: "mMhBd25Kflo",
        body: [
          "**Call urgently if:** blood sugar above 16 mmol/L with vomiting or drowsiness; sugar below 4 mmol/L that does not respond to juice; foot wound that is not healing; chest pain or sudden vision changes.",
          "**Routine review:** every 3 months for HbA1c, yearly for eyes, kidneys, and feet.",
        ],
      },
      {
        title: "Exercise without hypoglycaemia",
        mins: 8,
        videoId: "ePylP2XmNRs",
        body: [
          "Aim for 150 minutes of moderate activity per week — brisk walking, swimming, cycling. Add 2 sessions of strength work.",
          "**Before exercise:** check blood sugar. If under 5.5 mmol/L, eat a small snack first.",
          "**Carry:** glucose tablets or sweets in case of low sugar. Wear medical ID.",
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Caring for an Elderly Parent at Home",
    description: "Practical caregiver training: medication, hygiene, fall prevention, and emotional support.",
    durationMins: 60,
    level: "Caregiver",
    cover: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&auto=format&fit=crop",
    modules: [
      {
        title: "Setting up a safe home",
        mins: 12,
        videoId: "twwQ6buOZ68",
        body: [
          "Falls are the #1 cause of injury for adults over 65. A safe home is the single best prevention.",
          "**Remove:** loose rugs, electrical cords across walkways, and clutter on stairs.",
          "**Install:** grab bars in the bathroom, non-slip mats, brighter lighting, and a night-light path to the toilet.",
          "**Bedroom:** bed at knee height, phone within reach, no obstacles between bed and bathroom.",
        ],
      },
      {
        title: "Medication management",
        mins: 10,
        videoId: "f7_m2zWX7Ys",
        body: [
          "Use a weekly pillbox with morning/afternoon/evening compartments. Refill every Sunday.",
          "Keep a single up-to-date medication list (name, dose, time, purpose) in the kitchen and a copy in the wallet.",
          "Set reminder alarms. Never crush extended-release tablets without asking the pharmacist.",
        ],
      },
      {
        title: "Bathing & hygiene with dignity",
        mins: 12,
        videoId: "hvdCfT-ob9M",
        body: [
          "Maintain dignity: explain each step before doing it, keep covered as much as possible, and ask preferences.",
          "Use a shower chair and hand-held shower head. Water temperature 37–40°C — test with your inner wrist.",
          "Check skin for redness or pressure sores during each bath, especially at the heels, hips, and tailbone.",
        ],
      },
      {
        title: "Recognising stroke & emergency signs",
        mins: 8,
        videoId: "knyTSTwGBxA",
        body: [
          "**FAST acronym for stroke:**\nF — Face drooping on one side?\nA — Arm weakness when raised?\nS — Speech slurred or strange?\nT — Time to call 999 immediately.",
          "Other emergencies: chest pain, sudden severe headache, confusion, breathing difficulty, blue lips, or unresponsiveness.",
        ],
      },
      {
        title: "Caregiver burnout — how to cope",
        mins: 10,
        videoId: "nyQqx22XKSk",
        body: [
          "Caregiving is rewarding but exhausting. Burnout shows as irritability, sleep problems, withdrawing from friends, or feeling hopeless.",
          "**Protect yourself:** schedule regular breaks, ask family to share duties, join a caregiver support group, and don't skip your own medical check-ups.",
          "It is not selfish to care for yourself — it is what allows you to keep caring for others.",
        ],
      },
      {
        title: "Difficult conversations about end-of-life",
        mins: 8,
        videoId: "2_5nCWiAz1s",
        body: [
          "Talk early, while your loved one can still express wishes — not in a crisis.",
          "Discuss: preferred place of care, resuscitation preferences, organ donation, and important relationships to repair.",
          "Document wishes in writing and share with all family members and the GP.",
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "Front Desk Triage Certification",
    description: "Staff-only training on AI-assisted triage, queue management, and patient communication.",
    durationMins: 90,
    level: "Staff",
    cover: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&auto=format&fit=crop",
    modules: [
      {
        title: "Welcoming & registering patients",
        mins: 10,
        videoId: "2bUqTisxJ8M",
        body: [
          "First impressions decide patient trust. Greet within 10 seconds, make eye contact, and use the patient's name.",
          "Verify IC, contact number, and allergies on every visit — even regulars. Confirm symptoms in their own words before entering them in the system.",
        ],
      },
      {
        title: "Reading AI severity scores",
        mins: 12,
        videoId: "gotDtw5rXIc",
        body: [
          "MyClinIQ AI returns four severity tiers: low, moderate, high, emergency.",
          "**Emergency** → bypass queue, alert clinician, prepare resus area.\n**High** → seat in priority area, recheck vitals every 10 min.\n**Moderate** → standard queue with reassessment after 30 min wait.\n**Low** → routine queue, offer self-care leaflet.",
        ],
      },
      {
        title: "Re-triaging walk-ins",
        mins: 15,
        videoId: "Ix7kP8-rIpA",
        body: [
          "Reassess any patient whose condition appears to change while waiting. Use the ABCDE rapid assessment: Airway, Breathing, Circulation, Disability, Exposure.",
          "Document every reassessment with timestamp and your initials.",
        ],
      },
      {
        title: "De-escalating frustrated patients",
        mins: 15,
        videoId: "lgq6zn8JIBo",
        body: [
          "Stay calm, lower your voice, sit at the same eye level if possible.",
          "Acknowledge feelings: \"I can see this wait is frustrating, and I'm sorry.\"",
          "Offer a concrete next step (estimated time, free water, escalation to manager) — never argue facts in the moment.",
        ],
      },
      {
        title: "Late penalty & no-show policy",
        mins: 10,
        videoId: "pitf63yBnoc",
        body: [
          "Patients more than 10 minutes late are automatically moved back 5 places in the queue. Two no-shows in 30 days triggers a small re-booking fee.",
          "Always explain the policy on first booking — never as a surprise at the desk.",
        ],
      },
      {
        title: "End-of-shift handover protocol",
        mins: 12,
        videoId: "ltloXhUvi1Y",
        body: [
          "Use SBAR: Situation, Background, Assessment, Recommendation.",
          "Hand over every patient still in the building, all pending lab results, and any complaints in progress.",
        ],
      },
      {
        title: "Privacy & PDPA compliance",
        mins: 16,
        videoId: "y751i4QqP0g",
        body: [
          "Malaysian Personal Data Protection Act (PDPA) requires consent before processing health data, and data minimisation — collect only what is needed.",
          "Never discuss patients within earshot of others. Lock screens when stepping away. Shred paper records.",
          "Report suspected breaches to the data protection officer within 24 hours.",
        ],
      },
    ],
  },
];

function TipsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("tips");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const [openCourse, setOpenCourse] = useState<Course | null>(null);

  const toggleSave = (id: string, title: string) => {
    setSaved((s) => ({ ...s, [id]: !s[id] }));
    if (!saved[id]) toast.success("Saved to your library", { description: title });
  };

  if (openArticle) {
    return (
      <AppShell>
        <ArticleView article={openArticle} onBack={() => setOpenArticle(null)} />
      </AppShell>
    );
  }
  if (openCourse) {
    return (
      <AppShell>
        <CourseView course={openCourse} onBack={() => setOpenCourse(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-5 pt-10" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary drop-shadow-[0_0_6px_oklch(0.62_0.22_255/0.6)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{t("library_education")}</p>
          </div>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-foreground">
            <span className="text-gradient-primary">{t("health_intelligence")}</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("optimised_for")}</p>
        </div>
        <div className="relative mt-4 grid w-full grid-cols-4 rounded-xl border border-border bg-card p-1">
          {(["tips", "news", "wellness", "education"] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider capitalize transition-all ${
                tab === tabKey ? "btn-glow text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(tabKey)}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-3 px-5 py-5">
        {tab === "education" ? (
          <>
            <div className="glass mb-3 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent shadow-[0_0_18px_oklch(0.7_0.13_190/0.5)]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Education Space</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Structured courses for patients, caregivers, and clinic staff. Earn completion badges.
                  </p>
                </div>
              </div>
            </div>
            {COURSES.map((c) => (
              <CourseCard key={c.id} course={c} onOpen={() => setOpenCourse(c)} />
            ))}
          </>
        ) : (
          ARTICLES[tab].map((a) => {
            const Icon = a.icon;
            return (
              <article
                key={a.id}
                className="glass animate-fade-in overflow-hidden rounded-2xl transition-transform active:scale-[0.99]"
              >
                <button
                  type="button"
                  onClick={() => setOpenArticle(a)}
                  className="block w-full text-left"
                >
                    <img
                    src={a.cover}
                    alt={a.title}
                      width={1024}
                      height={640}
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.62_0.22_255/0.4)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {a.tag}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {a.readMins} min read
                          </span>
                        </div>
                        <h2 className="mt-1.5 text-sm font-bold leading-snug text-foreground">{a.title}</h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{a.summary}</p>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="flex gap-2 border-t border-border/50 p-3">
                  <button
                    onClick={() => setOpenArticle(a)}
                    className="btn-glow flex-1 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground"
                  >
                    Read full article
                  </button>
                  <button
                    onClick={() => toggleSave(a.id, a.title)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      saved[a.id]
                        ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_14px_-4px_oklch(0.62_0.22_255/0.5)]"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" /> {saved[a.id] ? "Saved" : "Save"}
                  </button>
                </div>
              </article>
            );
          })
        )}

        <p className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 text-center text-[10px] leading-relaxed text-muted-foreground">
          Curated for general wellness. Not a substitute for medical advice.
        </p>
      </main>
    </AppShell>
  );
}

function ArticleView({ article, onBack }: { article: Article; onBack: () => void }) {
  const Icon = article.icon;
  return (
    <>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{article.tag}</p>
            <p className="text-sm font-bold">{article.readMins} min read</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </header>
      <article className="px-5 py-6">
        <img
          src={article.cover}
          alt={article.title}
          width={1024}
          height={640}
          className="h-48 w-full rounded-2xl object-cover shadow-[0_0_24px_-8px_oklch(0.55_0.22_265/0.4)]"
        />
        <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight">{article.title}</h1>
        <p className="mt-2 text-sm italic text-muted-foreground">{article.summary}</p>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/90">
          {article.body.map((para, i) => (
            <p key={i}>{renderInlineMd(para)}</p>
          ))}
        </div>
        <p className="mt-8 rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 text-center text-[10px] leading-relaxed text-muted-foreground">
          MyClinIQ Library · Reviewed by clinical team · Not a substitute for personal medical advice
        </p>
      </article>
    </>
  );
}

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const levelTone =
    course.level === "Staff"
      ? "border-destructive/40 text-destructive bg-destructive/10"
      : course.level === "Caregiver"
        ? "border-warning/40 text-warning bg-warning/10"
        : "border-success/40 text-success bg-success/10";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass animate-fade-in block w-full overflow-hidden rounded-2xl text-left transition-transform active:scale-[0.99]"
    >
      <img src={course.cover} alt={course.title} loading="lazy" className="h-28 w-full object-cover" />
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${levelTone}`}>
            {course.level}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {course.durationMins} min total · {course.modules.length} modules
          </span>
        </div>
        <h2 className="mt-1.5 text-sm font-bold leading-snug">{course.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{course.description}</p>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Play className="h-3 w-3" /> Start course
        </div>
      </div>
    </button>
  );
}

function CourseView({ course, onBack }: { course: Course; onBack: () => void }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const completed = Object.values(done).filter(Boolean).length;
  const pct = Math.round((completed / course.modules.length) * 100);
  return (
    <>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{course.level} · Course</p>
            <p className="text-sm font-bold leading-tight">{course.title}</p>
          </div>
        </div>
      </header>
      <div className="px-5 py-6">
        <img src={course.cover} alt={course.title} className="h-40 w-full rounded-2xl object-cover" />
        <p className="mt-4 text-sm text-muted-foreground">{course.description}</p>
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Progress</span>
            <span className="text-primary">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
            />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {course.modules.map((m, i) => {
            const isDone = done[i];
            const isOpen = open[i];
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-colors ${
                  isDone ? "border-success/40 bg-success/5" : "border-border/60 bg-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                      isDone ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      Module {i + 1} · {m.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.mins} min {m.videoId ? "· video + reading" : "· reading"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary">{isOpen ? "Hide" : "Open"}</span>
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-3">
                    {m.videoId && (
                      <div className="overflow-hidden rounded-xl border border-border bg-black">
                        <iframe
                          width="100%"
                          height="200"
                          src={`https://www.youtube.com/embed/${m.videoId}`}
                          title={m.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="block w-full"
                        />
                      </div>
                    )}
                    <div className="space-y-2.5 text-[13px] leading-relaxed text-foreground/90">
                      {m.body.map((para, pi) => (
                        <p key={pi}>{renderInlineMd(para)}</p>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                      className={`w-full rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        isDone
                          ? "border border-success/40 bg-success/10 text-success"
                          : "btn-glow text-primary-foreground"
                      }`}
                    >
                      {isDone ? "✓ Module completed" : "Mark as complete"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function renderInlineMd(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i} className="font-bold text-foreground">{p.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}
