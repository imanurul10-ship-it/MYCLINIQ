import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Sparkles,
  Volume2,
  Loader2,
  Stethoscope,
  History,
  Plus,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/ai-chat")({
  component: AiChat,
  head: () => ({
    meta: [
      { title: "AI Doctor Chat · MyClinIQ" },
      { name: "description", content: "Chat with Dr. ClinIQ — voice, photo, and text medical assistant with memory." },
    ],
  }),
});

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

type APIPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type APIMsg = { role: "user" | "assistant"; content: string | APIPart[] };

const WELCOME: ChatMsg = {
  id: "welcome",
  role: "assistant",
  text:
    "Hi, I'm **Dr. ClinIQ** 👋 — your AI medical assistant. I'll remember our past conversations so we can pick up where we left off. Tell me what you're feeling, send a photo, or tap the mic to speak.",
};

function AiChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation list + most recent conversation on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: convs } = await supabase
        .from("chat_conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (convs) setConversations(convs);
      if (convs && convs.length > 0) {
        await loadConversation(convs[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadConversation = async (id: string) => {
    setActiveConvId(id);
    setShowHistory(false);
    const { data } = await supabase
      .from("chat_messages")
      .select("id,role,content,image_url,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          text: m.content,
          imagePreview: m.image_url ?? undefined,
        })),
      );
    } else {
      setMessages([WELCOME]);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([WELCOME]);
    setShowHistory(false);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeConvId === id) startNewChat();
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const speakBack = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const cleaned = text.replace(/\*\*/g, "").replace(/[#_`>]/g, "");
    const u = new SpeechSynthesisUtterance(cleaned);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported. Try Chrome on Android or desktop.");
      return;
    }
    if (listening && recogRef.current) {
      recogRef.current.stop();
      return;
    }
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-US";
    let finalText = input;
    recog.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += (finalText ? " " : "") + tr.trim();
        else interim += tr;
      }
      setInput(finalText + (interim ? " " + interim : ""));
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recog.start();
    recogRef.current = recog;
    setListening(true);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large (max 4MB)");
      return;
    }
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < buf.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + CHUNK)));
      }
      const b64 = btoa(binary);
      setImageBase64(b64);
      setImageMime(file.type);
      setImagePreview(URL.createObjectURL(file));
      toast.success("Photo attached");
    } catch (err) {
      console.error(err);
      toast.error("Could not read photo. Try a smaller image.");
    } finally {
      e.target.value = "";
    }
  };

  const ensureConversation = async (firstUserText: string): Promise<string | null> => {
    if (activeConvId) return activeConvId;
    if (!user) return null;
    const title = firstUserText.slice(0, 60) || "New chat";
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title })
      .select("id,title,updated_at")
      .single();
    if (error || !data) {
      console.error(error);
      return null;
    }
    setActiveConvId(data.id);
    setConversations((c) => [data, ...c]);
    return data.id;
  };

  const send = async () => {
    if (sending) return;
    if (!input.trim() && !imageBase64) {
      toast.error("Type a message or attach a photo");
      return;
    }
    if (!user) {
      toast.error("Please sign in to chat with Dr. ClinIQ");
      return;
    }

    const userText = input.trim() || "(photo attached)";
    const dataUrl = imageBase64
      ? `data:${imageMime || "image/jpeg"};base64,${imageBase64}`
      : null;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: userText,
      imagePreview: imagePreview ?? undefined,
    };

    // Build API history from current loaded messages (text only for old turns)
    const history: APIMsg[] = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.text }));

    let newTurnContent: string | APIPart[];
    if (dataUrl) {
      const parts: APIPart[] = [];
      if (input.trim()) parts.push({ type: "text", text: input.trim() });
      else parts.push({ type: "text", text: "Please look at this photo and tell me what you see." });
      parts.push({ type: "image_url", image_url: { url: dataUrl } });
      newTurnContent = parts;
    } else {
      newTurnContent = input.trim();
    }

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
    setImageMime(null);
    setSending(true);

    // Persist the user message (create conversation if needed)
    const convId = await ensureConversation(userText);
    if (convId) {
      await supabase.from("chat_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: userText,
        image_url: dataUrl,
      });
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    }

    try {
      const { data, error } = await supabase.functions.invoke("medical-chat", {
        body: { messages: [...history, { role: "user", content: newTurnContent }] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply = (data?.reply as string) || "Sorry, I didn't catch that.";
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ]);
      if (convId) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: reply,
        });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Chat failed");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Sorry, I'm having trouble right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.55_0.22_265/0.5)]">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="mr-1 inline h-2.5 w-2.5" /> AI · Memory On
              </p>
              <p className="truncate text-sm font-bold">Dr. ClinIQ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-primary/50"
            aria-label="Chat history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-primary/50"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {showHistory && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-border/60 bg-card/70 p-2">
            {conversations.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No past conversations yet
              </p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-primary/10 ${
                    c.id === activeConvId ? "bg-primary/15" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => loadConversation(c.id)}
                    className="flex-1 truncate text-left text-sm"
                  >
                    {c.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteConversation(c.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-destructive opacity-0 hover:bg-destructive/10 group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </header>

      <main
        ref={scrollRef}
        className="space-y-4 overflow-y-auto px-4 py-5"
        style={{ minHeight: "calc(100vh - 280px)" }}
      >
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} onSpeak={() => speakBack(m.text)} />
        ))}
        {sending && (
          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Dr. ClinIQ is typing…
          </div>
        )}
        <p className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 text-center text-[10px] leading-relaxed text-muted-foreground">
          AI guidance only · For emergencies call 999 · Not a substitute for a doctor
        </p>
      </main>

      {/* Composer */}
      <div className="fixed bottom-[88px] left-1/2 z-30 w-full max-w-[440px] -translate-x-1/2 px-3">
        <div className="glass-strong rounded-2xl p-2.5">
          {imagePreview && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-2">
              <img src={imagePreview} alt="attached" className="h-12 w-12 rounded-lg object-cover" />
              <span className="flex-1 text-xs text-muted-foreground">Photo ready to send</span>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageBase64(null);
                  setImageMime(null);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15 text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
              <ImageIcon className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPickImage}
              />
            </label>
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                listening
                  ? "animate-pulse-emergency bg-destructive text-destructive-foreground"
                  : "bg-accent/15 text-accent hover:bg-accent/25"
              }`}
              aria-label={listening ? "Stop recording" : "Voice input"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={listening ? "Listening…" : "Describe your symptoms…"}
              className="max-h-24 flex-1 resize-none rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="btn-glow flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground disabled:opacity-50"
              aria-label="Send"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Bubble({ msg, onSpeak }: { msg: ChatMsg; onSpeak: () => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {msg.imagePreview && (
          <img
            src={msg.imagePreview}
            alt="user upload"
            className="max-h-40 rounded-2xl border border-border/60 object-cover"
          />
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground shadow-[0_0_18px_-4px_oklch(0.55_0.22_265/0.7)]"
              : "glass text-foreground"
          }`}
        >
          {renderMarkdown(msg.text)}
        </div>
        {!isUser && (
          <button
            type="button"
            onClick={onSpeak}
            className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary"
          >
            <Volume2 className="h-3 w-3" /> Read aloud
          </button>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return (
          <strong key={i} className="font-bold">
            {p.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{p}</span>;
    });
    return (
      <p key={li} className={li > 0 ? "mt-1.5" : ""}>
        {parts}
      </p>
    );
  });
}
