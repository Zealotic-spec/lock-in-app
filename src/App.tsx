import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Timer, 
  LayoutDashboard, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Play, 
  Square, 
  Trash2, 
  Plus, 
  Upload, 
  BookOpen, 
  Lightbulb, 
  Check, 
  Award, 
  Flame, 
  Maximize2, 
  Minimize2, 
  ChevronUp, 
  ChevronDown, 
  Share2, 
  X, 
  ChevronRight,
  BookMarked,
  BarChart3
} from "lucide-react";
// Стили уже импортированы глобально через index.css в main.tsx

// Импорт типов
import {
  Task,
  DiaryBlockType,
  IdeaItem,
  HistoryItem,
  Stats
} from "./types";

// Модуль "Tracking" — полностью аддитивный, не меняет логику существующих фич
import TrackingPage from "./tracking/TrackingPage";

const AVAILABLE_TAGS = [
  { name: "DEEP WORK", color: "#ff6a00" },
  { name: "PLANNING", color: "#ffcc00" },
  { name: "ADMIN", color: "#8e8e93" },
  { name: "LEARNING", color: "#007aff" },
  { name: "CREATIVE", color: "#af52de" },
];

const DAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const INTENSITY_PRESETS = {
  "Warm-up":       { seconds: 15 * 60 },
  "Focus":         { seconds: 25 * 60 },
  "Deep Work":     { seconds: 50 * 60 },
  "Ultramarathon": { seconds: 90 * 60 },
};

const SLASH_COMMANDS = [
  { type: "h1",       label: "Заголовок 1",        icon: "H1" },
  { type: "h2",       label: "Заголовок 2",        icon: "H2" },
  { type: "h3",       label: "Заголовок 3",        icon: "H3" },
  { type: "text",     label: "Текст",              icon: "¶"  },
  { type: "divider",  label: "Разделитель",        icon: "—"  },
  { type: "checklist",label: "Контрольный список", icon: "☑"  },
  { type: "ul",       label: "Маркированный список",icon: "•" },
  { type: "ol",       label: "Нумерованный список", icon: "1." },
];

const AVATARS = ["👤","🐉","🦊","🐺","🦁","🐸","🤖","👽","🧠","🔥","⚡","🎯"];

function getISOWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

function getTodayGraphIndex() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function playSound(type: string) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (type === "click") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 440;
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.08);
    } else if (type === "start") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = 220;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } else if (type === "celebrate") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.09);
        o.stop(ctx.currentTime + i * 0.09 + 0.5);
      });
    } else if (type === "add") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 600;
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.12);
    }
  } catch (_) {}
}

function ls<T>(key: string, fallback: T): T {
  try { 
    const v = localStorage.getItem(key); 
    return v !== null ? JSON.parse(v) : fallback; 
  } catch (_) { 
    return fallback; 
  }
}
function lsSet(key: string, val: any) { 
  try { 
    localStorage.setItem(key, JSON.stringify(val)); 
  } catch (_) {} 
}

// ─── NOTION-LIKE DIARY BLOCK (С НОВЫМ БЕЗ-ПЛЮСОВЫМ СТРОЧНЫМ ВВОДОМ) ───────────────
interface DiaryBlockProps {
  key?: any;
  block: DiaryBlockType;
  onChange: (updated: Partial<DiaryBlockType>) => void;
  onDelete: () => void;
  onEnterPress: () => void;
  onBackspaceEmpty: () => void;
  isLight: boolean;
}

function DiaryBlock({ block, onChange, onDelete, onEnterPress, onBackspaceEmpty, isLight }: DiaryBlockProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");

  const filtered = SLASH_COMMANDS.filter(c =>
    c.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "/" && (block.content === "" || block.content === undefined)) {
      setShowSlash(true);
      setSlashFilter("");
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") { 
      setShowSlash(false); 
      return; 
    }
    if (e.key === "Enter") {
      // Исключаем Enter при открытом слэш-меню, чтобы выбрать команду
      if (showSlash) return;
      e.preventDefault();
      onEnterPress();
      return;
    }
    if (e.key === "Backspace" && (block.content === "" || block.content === undefined)) {
      e.preventDefault();
      onBackspaceEmpty();
      return;
    }
  }

  function applyCommand(cmdType: string) {
    onChange({ type: cmdType as any, content: "" });
    setShowSlash(false);
    setTimeout(() => {
      ref.current?.focus();
    }, 20);
  }

  function renderInput() {
    if (block.type === "divider") {
      return (
        <div className="diary-divider-block w-full">
          <hr className="diary-hr" />
          <button className="diary-del-btn" onClick={onDelete}>✕</button>
        </div>
      );
    }
    if (block.type === "checklist") {
      return (
        <div className="diary-check-row">
          <input 
            type="checkbox" 
            checked={block.checked || false}
            onChange={(e) => onChange({ checked: e.target.checked })}
            className="diary-checkbox animate-pop" 
          />
          <input 
            ref={ref} 
            id={`diary-input-${block.id}`}
            className={`diary-input diary-text ${block.checked ? "diary-checked" : ""}`}
            placeholder="Пункт списка... (нажмите Enter)"
            value={block.content || ""}
            onChange={e => onChange({ content: e.target.value })}
            onKeyDown={handleKeyDown} 
          />
          <button className="diary-del-btn" onClick={onDelete}>✕</button>
        </div>
      );
    }
    if (block.type === "ul") {
      return (
        <div className="diary-li-row">
          <span className="diary-bullet">•</span>
          <input 
            ref={ref} 
            id={`diary-input-${block.id}`}
            className="diary-input diary-text"
            placeholder="Элемент списка... (нажмите Enter)"
            value={block.content || ""}
            onChange={e => onChange({ content: e.target.value })}
            onKeyDown={handleKeyDown} 
          />
          <button className="diary-del-btn" onClick={onDelete}>✕</button>
        </div>
      );
    }
    if (block.type === "ol") {
      return (
        <div className="diary-li-row">
          <span className="diary-bullet diary-num">{block.num || 1}.</span>
          <input 
            ref={ref} 
            id={`diary-input-${block.id}`}
            className="diary-input diary-text"
            placeholder="Элемент списка... (нажмите Enter)"
            value={block.content || ""}
            onChange={e => onChange({ content: e.target.value })}
            onKeyDown={handleKeyDown} 
          />
          <button className="diary-del-btn" onClick={onDelete}>✕</button>
        </div>
      );
    }
    const cls = block.type === "h1" ? "diary-h1"
              : block.type === "h2" ? "diary-h2"
              : block.type === "h3" ? "diary-h3"
              : "diary-text";
    return (
      <div className="diary-row">
        <input 
          ref={ref} 
          id={`diary-input-${block.id}`}
          className={`diary-input ${cls}`}
          placeholder={
            block.type === "h1" ? "Заголовок 1 (Enter для новой строки)" 
            : block.type === "h2" ? "Заголовок 2" 
            : block.type === "h3" ? "Заголовок 3" 
            : "Начните писать... (введите '/' для команд или нажмите Enter)"
          }
          value={block.content || ""}
          onChange={e => onChange({ content: e.target.value })}
          onKeyDown={handleKeyDown} 
        />
        <button className="diary-del-btn" onClick={onDelete}>✕</button>
      </div>
    );
  }

  return (
    <div className="diary-block-wrap relative">
      {renderInput()}
      {showSlash && (
        <div className={`slash-menu ${isLight ? "slash-menu-light" : ""}`} onClick={e => e.stopPropagation()}>
          <input 
            autoFocus 
            className="slash-search" 
            placeholder="Поиск команды..."
            value={slashFilter} 
            onChange={e => setSlashFilter(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Escape") setShowSlash(false);
            }} 
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(cmd => (
              <button 
                key={cmd.type} 
                className="slash-item" 
                onClick={() => applyCommand(cmd.type)}
              >
                <span className="slash-icon">{cmd.icon}</span>
                <span>{cmd.label}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-xs text-center py-2 text-gray-500">Команды не найдены</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ОСНОВНОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ───────────────────────────────────────────────
export default function App() {
  // ── ONBOARDING ──
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(() => !localStorage.getItem("lockin_initialized"));
  const [obStep, setObStep] = useState(1);
  const [obTaskText, setObTaskText] = useState("");

  // ── CORE STATE ──
  const [userName, setUserName] = useState<string>(() => ls("lockin_username", ""));
  const [mission,  setMission]  = useState<string>(() => ls("lockin_mission",  ""));
  const [tasks,    setTasks]    = useState<Task[]>(() => ls("lockin_tasks",    []));
  const [stats,    setStats]    = useState<Stats>(() => ls("lockin_stats",    { todayMinutes: 0, weekMinutes: 0, streak: 0 }));
  const [history,  setHistory]  = useState<HistoryItem[]>(() => ls("lockin_history",  []));

  // ── SIDEBAR DIARY (left book) ──
  const [diaryBlocks, setDiaryBlocks] = useState<DiaryBlockType[]>(() =>
    ls("lockin_diary", [{ id: Date.now(), type: "text", content: "" }])
  );
  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);

  // ── SIDEBAR IDEAS (right book) ──
  const [ideaItems, setIdeaItems] = useState<IdeaItem[]>(() => ls("lockin_ideas", []));
  const [newIdea, setNewIdea] = useState("");
  const [flyingId, setFlyingId] = useState<number | null>(null);

  // ── TIMER ──
  const [intensity, setIntensity] = useState<string>("Focus");
  const [isActive,  setIsActive]  = useState<boolean>(false);
  const [timeLeft,  setTimeLeft]  = useState<number>(25 * 60);
  const elapsedRef = useRef<number>(0);

  // ── UI / NAVIGATION ──
  const [tab,            setTab]           = useState<string>("focus");
  const [editMission,    setEditMission]   = useState<boolean>(false);
  const [missionDraft,   setMissionDraft]  = useState(mission);
  const [newTask,        setNewTask]       = useState("");
  const [tagDropId,      setTagDropId]     = useState<number | null>(null);
  const [modalOpen,      setModalOpen]     = useState<boolean>(false);
  const [confirmStopOpen,setConfirmStopOpen] = useState<boolean>(false);
  const [tempH, setTempH] = useState(0);
  const [tempM, setTempM] = useState(25);
  const [tempS, setTempS] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // ── FLOATING NAVBAR STATS ──
  const [navCollapsed, setNavCollapsed] = useState<boolean>(false);

  // ── PROFILE & AVATAR ──
  const [colorTheme,   setColorTheme]   = useState<string>(() => ls("lockin_theme", "dark"));
  const [userAvatar,   setUserAvatar]   = useState<string>(() => ls("lockin_avatar", "🐉"));
  const [customAvatar, setCustomAvatar] = useState<string>(() => ls("lockin_custom_avatar", ""));
  const [editingName,  setEditingName]  = useState<boolean>(false);
  const [nameDraft,    setNameDraft]    = useState(userName);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // ── CELEBRATION ──
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [celebData, setCelebData] = useState<{
    earned: number;
    depth: number;
    streak: number;
    compCount: number;
    total: number;
  } | null>(null);
  const [journalNote,     setJournalNote]     = useState("");
  const [clearDone,       setClearDone]       = useState<boolean>(true);
  const [copied,          setCopied]          = useState<boolean>(false);

  // ── HISTORY DELETE ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isLight = colorTheme === "light";

  // ── SYNC TO LOCAL STORAGE ──
  useEffect(() => { lsSet("lockin_username", userName); }, [userName]);
  useEffect(() => { lsSet("lockin_mission",  mission);  }, [mission]);
  useEffect(() => { lsSet("lockin_tasks",    tasks);    }, [tasks]);
  useEffect(() => { lsSet("lockin_stats",    stats);    }, [stats]);
  useEffect(() => { lsSet("lockin_history",  history);  }, [history]);
  useEffect(() => { lsSet("lockin_diary",    diaryBlocks); }, [diaryBlocks]);
  useEffect(() => { lsSet("lockin_ideas",    ideaItems);   }, [ideaItems]);
  useEffect(() => { lsSet("lockin_theme",    colorTheme);  }, [colorTheme]);
  useEffect(() => { lsSet("lockin_avatar",   userAvatar);  }, [userAvatar]);
  useEffect(() => { lsSet("lockin_custom_avatar", customAvatar); }, [customAvatar]);

  // ── SYNC THEME TO HTML ROOT (чтобы темы работали и в вебе и в Electron) ──
  useEffect(() => {
    // Убираем все старые классы тем с html элемента
    const html = document.documentElement;
    html.classList.remove("theme-dark", "theme-light", "theme-cyber", "theme-emerald", "theme-nord");
    html.classList.add(`theme-${colorTheme}`);
    // Также применяем CSS переменные напрямую на body для надёжности
    const themes: Record<string, Record<string, string>> = {
      dark:    { "--bg": "#05050b", "--bg-card": "rgba(17,17,27,0.72)", "--bg-el": "rgba(30,30,46,0.55)", "--border": "rgba(255,255,255,0.07)", "--text": "#f8fafc", "--muted": "#71717a", "--accent": "#6366f1", "--accent-glow": "rgba(99,102,241,0.28)", "--accent-secondary": "#a855f7", "--shadow-color": "rgba(0,0,0,0.85)" },
      light:   { "--bg": "#f4f4f7", "--bg-card": "rgba(255,255,255,0.75)", "--bg-el": "rgba(228,228,231,0.7)", "--border": "rgba(0,0,0,0.06)", "--text": "#09090b", "--muted": "#71717a", "--accent": "#007aff", "--accent-glow": "rgba(0,122,255,0.15)", "--accent-secondary": "#30d158", "--shadow-color": "rgba(0,0,0,0.06)" },
      cyber:   { "--bg": "#000000", "--bg-card": "rgba(10,0,20,0.8)", "--bg-el": "rgba(30,0,50,0.5)", "--border": "rgba(255,0,127,0.15)", "--text": "#f8fafc", "--muted": "#8c7ea8", "--accent": "#ff007f", "--accent-glow": "rgba(255,0,127,0.3)", "--accent-secondary": "#00f0ff", "--shadow-color": "rgba(0,0,0,0.9)" },
      emerald: { "--bg": "#000000", "--bg-card": "rgba(5,15,10,0.8)", "--bg-el": "rgba(15,35,22,0.5)", "--border": "rgba(16,185,129,0.12)", "--text": "#f0fdf4", "--muted": "#627d6f", "--accent": "#10b981", "--accent-glow": "rgba(16,185,129,0.3)", "--accent-secondary": "#fbbf24", "--shadow-color": "rgba(0,0,0,0.9)" },
      nord:    { "--bg": "#1c212c", "--bg-card": "rgba(46,52,64,0.55)", "--bg-el": "rgba(67,76,94,0.45)", "--border": "rgba(136,192,208,0.15)", "--text": "#eceff4", "--muted": "#9ba4b5", "--accent": "#88c0d0", "--accent-glow": "rgba(136,192,208,0.25)", "--accent-secondary": "#81a1c1", "--shadow-color": "rgba(15,18,25,0.7)" },
    };
    const vars = themes[colorTheme] || themes.dark;
    Object.entries(vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
      document.body.style.setProperty(k, v);
    });
    document.body.style.background = vars["--bg"];
    document.body.style.color = vars["--text"];
  }, [colorTheme]);

  // Закрытие меню выбора тегов кликом вне меню
  useEffect(() => {
    const h = () => setTagDropId(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  // Синхронизация фокуса Notion-style блокнота
  useEffect(() => {
    if (focusedBlockId !== null) {
      const inputEl = document.getElementById(`diary-input-${focusedBlockId}`);
      if (inputEl) {
        inputEl.focus();
      }
    }
  }, [focusedBlockId, diaryBlocks]);

  // ── DIARY (NOTION-LIKE ACTIONS) ──
  function addDiaryBlock(afterId: number) {
    const idx = diaryBlocks.findIndex(b => b.id === afterId);
    const newId = Date.now() + Math.random();
    const newBlock: DiaryBlockType = { id: newId, type: "text", content: "" };
    
    // Рассчитываем номер строки для нумерованного списка
    if (diaryBlocks[idx]?.type === "ol") {
      newBlock.type = "ol";
      newBlock.num = (diaryBlocks[idx].num || 1) + 1;
    } else if (diaryBlocks[idx]?.type === "ul") {
      newBlock.type = "ul";
    } else if (diaryBlocks[idx]?.type === "checklist") {
      newBlock.type = "checklist";
    }

    const next = [...diaryBlocks];
    next.splice(idx + 1, 0, newBlock);
    setDiaryBlocks(next);
    setFocusedBlockId(newId);
  }

  function handleBackspaceEmpty(id: number) {
    const idx = diaryBlocks.findIndex(b => b.id === id);
    if (idx === 0 && diaryBlocks.length === 1) return; // Единственный первый элемент не удаляем
    
    const prevBlock = diaryBlocks[idx - 1];
    setDiaryBlocks(prev => prev.filter(b => b.id !== id));
    
    if (prevBlock) {
      setFocusedBlockId(prevBlock.id);
    }
  }

  function updateDiaryBlock(id: number, updated: Partial<DiaryBlockType>) {
    setDiaryBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  }

  function deleteDiaryBlock(id: number) {
    setDiaryBlocks(prev => {
      const filtered = prev.filter(b => b.id !== id);
      return filtered.length === 0
        ? [{ id: Date.now(), type: "text", content: "" }]
        : filtered;
    });
  }

  // ── IDEAS (Оригинальные идеи больше НЕ удаляются при нажатии плюсика) ──
  function addIdea() {
    if (!newIdea.trim()) return;
    setIdeaItems(prev => [...prev, { id: Date.now(), text: newIdea.trim() }]);
    setNewIdea("");
  }

  function deleteIdea(id: number) {
    setIdeaItems(prev => prev.filter(i => i.id !== id));
  }

  function addIdeaToFocus(idea: IdeaItem) {
    playSound("add");
    setFlyingId(idea.id);
    setTimeout(() => {
      setTasks(prev => [...prev, { id: Date.now(), text: idea.text, tag: "DEEP WORK", completed: false }]);
      // БАГ ИСПРАВЛЕН: Идея БОЛЬШЕ не удаляется из оригинального списка идей!
      setFlyingId(null);
    }, 500);
  }

  // ── TIMER ──
  const displayH = Math.floor(timeLeft / 3600);
  const displayM = Math.floor((timeLeft % 3600) / 60);
  const displayS = timeLeft % 60;

  function handleIntensity(mode: string) {
    if (isActive) return;
    setIntensity(mode);
    setTimeLeft((INTENSITY_PRESETS as any)[mode].seconds);
  }

  function peekStreak() {
    try {
      const todayStr = new Date().toDateString();
      const lastStr  = localStorage.getItem("lockin_last_burn");
      if (!lastStr) return stats.streak || 1;
      if (lastStr === todayStr) return stats.streak;
      const diff = Math.round((new Date(todayStr).getTime() - new Date(lastStr).getTime()) / 86400000);
      return diff === 1 ? stats.streak + 1 : 1;
    } catch (_) { return stats.streak; }
  }

  function toggleTimer() {
    if (isActive) { 
      setConfirmStopOpen(true); 
    } else { 
      playSound("start"); 
      elapsedRef.current = 0; 
      setIsActive(true); 
    }
  }

  function forceStopTimer() {
    setIsActive(false); 
    setConfirmStopOpen(false);
    elapsedRef.current = 0;
    setTimeLeft((INTENSITY_PRESETS as any)[intensity]?.seconds || 25 * 60);
  }

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id); 
          setIsActive(false);
          setTimeout(() => handleSessionEnd(), 10);
          return 0;
        }
        elapsedRef.current += 1;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, intensity]);

  useEffect(() => {
    if (isActive && tasks.length > 0 && tasks.every(t => t.completed)) {
      setIsActive(false);
      setTimeout(() => handleSessionEnd(), 50);
    }
  }, [tasks, isActive]);

  function handleSessionEnd() {
    const earned    = Math.max(1, Math.round(elapsedRef.current / 60));
    const compCount = tasks.filter(t => t.completed).length;
    const rate      = tasks.length > 0 ? compCount / tasks.length : 1;
    const bonus     = earned >= 50 ? 1.5 : 1;
    const depth     = Math.round(earned * rate * bonus);
    const streak    = peekStreak() === 0 ? 1 : peekStreak();
    playSound("celebrate");
    setCelebData({ earned, depth, streak, compCount, total: tasks.length });
    setJournalNote(""); 
    setCopied(false); 
    setShowCelebration(true);
  }

  function saveSession() {
    if (!celebData) return;
    const now     = new Date();
    const weekKey = getISOWeekKey(now);
    const dayIdx  = getTodayGraphIndex();
    const daysRu  = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
    const item: HistoryItem = {
      id:             Date.now(),
      dayName:        daysRu[now.getDay()],
      time:           now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      mission:        mission || "Глубокий фокус",
      minutes:        celebData.earned,
      depthScore:     celebData.depth,
      completedTasks: celebData.compCount,
      totalTasks:     celebData.total,
      taskNames:      tasks.filter(t => t.completed).map(t => t.text),
      graphDayIndex:  dayIdx,
      weekKey,
      note:           journalNote.trim() || "Без заметок",
    };
    setHistory(prev => [item, ...prev]);
    localStorage.setItem("lockin_last_burn", now.toDateString());
    setStats(prev => ({
      todayMinutes: prev.todayMinutes + celebData.earned,
      weekMinutes:  prev.weekMinutes  + celebData.earned,
      streak:       celebData.streak,
    }));
    if (clearDone) setTasks(prev => prev.filter(t => !t.completed));
    elapsedRef.current = 0;
    setTimeLeft((INTENSITY_PRESETS as any)[intensity]?.seconds || 25 * 60);
    setShowCelebration(false); 
    setCelebData(null);
  }

  function addTask(text: string) {
    if (!text.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: text.trim(), tag: "DEEP WORK", completed: false }]);
  }

  function toggleTask(id: number) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (!t.completed) playSound("click");
      return { ...t, completed: !t.completed };
    }));
  }

  // ── CUSTOM AVATAR UPLOAD (READ FILE AS BASE64 FOR PERSISTENCE) ──
  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка размера файла (ограничим 1.5MB для localState)
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Пожалуйста, загрузите изображение меньше 1.5 МБ для сохранения в памяти браузера.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCustomAvatar(base64String);
      setUserAvatar("custom");
    };
    reader.readAsDataURL(file);
  }

  // ── WEEKLY METRICS ──
  const weekKey = getISOWeekKey(new Date());
  const heatmap = (() => {
    const arr = [0,0,0,0,0,0,0];
    history.forEach(item => {
      if (item.weekKey === weekKey && item.graphDayIndex !== undefined)
        arr[item.graphDayIndex] += item.minutes || 0;
    });
    return arr;
  })();

  const barDetails = (() => {
    return DAYS.map((_, idx) => {
      const sessions = history.filter(h => h.graphDayIndex === idx && h.weekKey === weekKey);
      return sessions;
    });
  })();

  const todayIdx = getTodayGraphIndex();
  const maxHeat  = Math.max(...heatmap, 30);

  const dashMetrics = (() => {
    if (!history.length) return { bestDay: "—", avgMin: 0, topTag: "—" };
    const byDay: Record<string, number> = {};
    history.forEach(it => { byDay[it.dayName] = (byDay[it.dayName] || 0) + it.minutes; });
    const bestDay = Object.keys(byDay).reduce((a,b) => byDay[a] > byDay[b] ? a : b);
    const avgMin  = Math.round(history.reduce((s,i) => s + i.minutes, 0) / history.length);
    const byTag: Record<string, number> = {};
    tasks.forEach(t => { byTag[t.tag] = (byTag[t.tag] || 0) + 1; });
    const topTag  = Object.keys(byTag).length ? Object.keys(byTag).reduce((a,b) => byTag[a] > byTag[b] ? a : b) : "DEEP WORK";
    return { bestDay, avgMin, topTag };
  })();

  const doneTasks = tasks.filter(t => t.completed).length;
  const progress  = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;

  function share() {
    if (!celebData) return;
    const text = `Залочился в LOCK IN на ${celebData.earned} мин · Depth Score: ${celebData.depth} · 🔥 ${celebData.streak} дней стрик! 🚀`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
  }

  function finishOnboarding() {
    localStorage.setItem("lockin_initialized", "1");
    setIsFirstLaunch(false);
  }

  function resetAllData() {
    localStorage.clear();
    window.location.reload();
  }

  function deleteHistoryItem(id: number) {
    setHistory(prev => prev.filter(h => h.id !== id));
    setConfirmDeleteId(null);
  }

  // Рендеринг активного аватара
  const activeAvatarRender = (sizeClass = "w-7 h-7 text-sm") => {
    if (userAvatar === "custom" && customAvatar) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden border border-[var(--border)]`}>
          <img src={customAvatar} className="w-full h-full object-cover" alt="Profile" />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-full flex items-center justify-center bg-[var(--bg-el)] border border-[var(--border)]`}>
        {userAvatar === "custom" ? "👤" : userAvatar}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // СЦЕНАРИЙ ПЕРВОГО ЗАПУСКА (ONBOARDING)
  // ════════════════════════════════════════════════════════════
  if (isFirstLaunch) return (
    <div className={`ob-overlay theme-dark ${isLight ? "light-mode" : ""}`}>
      <div className="ob-card animate-pop theme-transition">
        <div className="text-2xl font-black text-[var(--accent)] tracking-tight mb-4">🔒 LOCK IN</div>
        {obStep === 1 && (
          <div className="flex flex-col gap-4 text-left">
            <h2 className="text-xl font-black text-center text-[var(--text)]">Добро пожаловать в ультра-фокус</h2>
            <div>
              <p className="text-xs font-bold text-[var(--muted)] mb-2 uppercase tracking-wide">Как тебя зовут?</p>
              <input 
                className="ob-input" 
                placeholder="Твоё имя..." 
                autoFocus
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--muted)] mb-2 uppercase tracking-wide">Какой твой главный фокус сегодня?</p>
              <input 
                className="ob-input" 
                placeholder="Например: Собрать MVP продукта"
                value={mission} 
                onChange={e => setMission(e.target.value)} 
              />
            </div>
            <button 
              className="ob-btn font-bold cursor-pointer hover:opacity-90" 
              disabled={!userName.trim() || !mission.trim()}
              onClick={() => setObStep(2)}
            >
              Далее →
            </button>
          </div>
        )}
        {obStep === 2 && (
          <div className="flex flex-col gap-4 text-left">
            <h2 className="text-xl font-black text-center text-[var(--text)]">Разбей фокус на задачи</h2>
            <p className="text-xs text-[var(--muted)] text-center">Добавь хотя бы один шаг, чтобы начать первую сессию</p>
            <div className="ob-row">
              <input 
                className="ob-input" 
                placeholder="Название задачи... (нажмите Enter)" 
                autoFocus
                value={obTaskText} 
                onChange={e => setObTaskText(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === "Enter") { 
                    addTask(obTaskText); 
                    setObTaskText(""); 
                  }
                }} 
              />
              <button 
                className="ob-add-btn hover:bg-[var(--accent)] hover:text-black" 
                onClick={() => { 
                  addTask(obTaskText); 
                  setObTaskText(""); 
                }}
              >
                +
              </button>
            </div>
            {tasks.length > 0 && (
              <div className="ob-tasks-preview flex flex-col gap-1">
                {tasks.map((t, i) => (
                  <div key={t.id} className="ob-task-item text-[var(--text)]">
                    ⚡ {i + 1}. {t.text}
                  </div>
                ))}
              </div>
            )}
            <button 
              className="ob-btn font-black cursor-pointer hover:brightness-110" 
              disabled={tasks.length === 0} 
              onClick={finishOnboarding}
            >
              🚀 ЗАЙТИ В ПОТОК (LOCK IN)
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // ГЛАВНЫЙ ЭКРАН ПРИЛОЖЕНИЯ С НОВЫМИ ТЕМАМИ И ПЛАВНЫМИ ТРАНЗИШЕНАМИ
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`app-root theme-${colorTheme} theme-transition w-full relative overflow-hidden ${navCollapsed ? "nav-collapsed" : ""}`}>
      
      {/* Immersive UI Deep Glass Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px]"></div>
      </div>
      
      {/* ─── ЛЕВЫЙ САЙДБАР (СВОРАЧИВАЕМЫЙ, СТЕКЛЯННЫЙ) ─── */}
      <nav className={`app-sidebar theme-transition ${navCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            🔒 {!navCollapsed && <>LOCK<span>IN</span></>}
          </div>
          <button
            className="sidebar-toggle-btn hover:text-[var(--accent)]"
            title={navCollapsed ? "Развернуть меню" : "Свернуть меню"}
            onClick={() => setNavCollapsed(!navCollapsed)}
          >
            {navCollapsed ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-link ${tab === "focus" ? "active" : ""}`}
            title="Focus"
            onClick={() => { setTab("focus"); playSound("click"); }}
          >
            <Timer size={16} /> {!navCollapsed && "Focus"}
          </button>
          <button
            className={`sidebar-link ${tab === "progress" ? "active" : ""}`}
            title="Analytics"
            onClick={() => { setTab("progress"); playSound("click"); }}
          >
            <LayoutDashboard size={16} /> {!navCollapsed && "Analytics"}
          </button>
          <button
            className={`sidebar-link ${tab === "history" ? "active" : ""}`}
            title="Logs"
            onClick={() => { setTab("history"); playSound("click"); }}
          >
            <HistoryIcon size={16} /> {!navCollapsed && "Logs"}
          </button>
          <button
            className={`sidebar-link ${tab === "tracking" ? "active" : ""}`}
            title="Tracking"
            onClick={() => { setTab("tracking"); playSound("click"); }}
          >
            <BarChart3 size={16} /> {!navCollapsed && "Tracking"}
          </button>
          <button
            className={`sidebar-link ${tab === "settings" ? "active" : ""}`}
            title="Settings"
            onClick={() => { setTab("settings"); playSound("click"); }}
          >
            <SettingsIcon size={16} /> {!navCollapsed && "Settings"}
          </button>
        </div>

        <div
          className="sidebar-user"
          onClick={() => { setTab("settings"); playSound("click"); }}
        >
          {activeAvatarRender("w-7 h-7 text-sm")}
          {!navCollapsed && (
            <span className="sidebar-user-name theme-transition">{userName || "Без имени"}</span>
          )}
        </div>
      </nav>

      {/* ─── ОСНОВНОЙ КОНТЕНТ С АНИМАЦИЕЙ ПЕРЕХОДОВ ─── */}
      <main className="main-content">
        <div className="center-wrapper w-full">
          <AnimatePresence mode="wait">
            
            {/* 🎯 TAB: FOCUS */}
            {tab === "focus" && (
              <motion.div 
                key="focus"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="focus-layout w-full"
              >
                
                {/* ЛЕВАЯ КОЛОНКА: ДНЕВНИК (Notion-style с созданием строк по Enter) */}
                <div className="side-panel theme-transition">
                  <div className="side-panel-header">
                    <span className="side-panel-title">
                      <BookOpen size={15} className="text-[var(--accent)]" /> 
                      Дневник инсайтов
                    </span>
                    <span className="text-[10px] bg-[var(--bg-el)] px-2 py-1 rounded font-bold text-[var(--muted)]">NOTION-LIKE</span>
                  </div>
                  
                  <div className="diary-content">
                    {diaryBlocks.map((block) => (
                      <DiaryBlock
                        key={block.id}
                        block={block}
                        isLight={isLight}
                        onChange={updated => updateDiaryBlock(block.id, updated)}
                        onDelete={() => deleteDiaryBlock(block.id)}
                        onEnterPress={() => addDiaryBlock(block.id)}
                        onBackspaceEmpty={() => handleBackspaceEmpty(block.id)}
                      />
                    ))}
                    <button 
                      className="diary-add-btn animate-pop"
                      onClick={() => addDiaryBlock(diaryBlocks[diaryBlocks.length - 1]?.id)}
                    >
                      <Plus size={14} /> С новой строки...
                    </button>
                  </div>
                </div>

                {/* ЦЕНТР: ПУЛЬСИРУЮЩИЙ ТАЙМЕР И ФОКУС-СПИСОК */}
                <div className="center-container">
                  
                  <div className="mission-block">
                    <span className="mission-label">ТЕКУЩАЯ ЦЕЛЬ СЕССИИ</span>
                    {editMission ? (
                      <input 
                        className="mission-input" 
                        value={missionDraft} 
                        autoFocus 
                        maxLength={50}
                        onChange={e => setMissionDraft(e.target.value)}
                        onBlur={() => { 
                          setEditMission(false); 
                          if (missionDraft.trim()) setMission(missionDraft.trim()); 
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") setEditMission(false);
                        }} 
                      />
                    ) : (
                      <h2 
                        className={`mission-title ${!isActive ? "editable" : ""} theme-transition`}
                        onClick={() => { 
                          if (!isActive) { 
                            setMissionDraft(mission); 
                            setEditMission(true); 
                          }
                        }}
                      >
                        {mission || "Кликом задай фокус процесса..."}
                      </h2>
                    )}
                  </div>

                  {/* Теги режима — всегда видны, при активном таймере заблокированы */}
                  <div className="intensity-row">
                    {Object.keys(INTENSITY_PRESETS).map(mode => (
                      <button 
                        key={mode} 
                        className={`intensity-pill ${intensity === mode ? "active" : ""} ${isActive ? "locked" : ""} theme-transition`}
                        onClick={() => handleIntensity(mode)}
                        disabled={isActive}
                        title={isActive ? "Остановите таймер чтобы сменить режим" : ""}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="timer-section">
                    <div className="timer-wrap">
                      <div 
                        className={`timer-display ${isActive ? "running-neon" : "clickable"} theme-transition`}
                        onClick={() => { 
                          if (!isActive) { 
                            setTempH(displayH); 
                            setTempM(displayM); 
                            setTempS(displayS); 
                            setModalOpen(true); 
                          }
                        }}
                      >
                        {pad(displayH)}:{pad(displayM)}:{pad(displayS)}
                      </div>
                    </div>

                    <div className="stats-row">
                      <div className="stat-cell theme-transition">
                        <span className="stat-val">{stats.todayMinutes}м</span>
                        <span className="stat-lbl">СЕГОДНЯ</span>
                      </div>
                      
                      <div className="heatmap-card theme-transition">
                        <span className="heatmap-title">АКТИВНОСТЬ НА ЭТОЙ НЕДЕЛЕ</span>
                        <div className="heatmap-row">
                          {DAYS.map((day, idx) => {
                            const mins = heatmap[idx];
                            const lvl = mins === 0 ? 0 : mins <= 15 ? 1 : mins <= 45 ? 2 : 3;
                            return (
                              <div key={day} className="heatmap-col">
                                <div className={`heatmap-cell lv${lvl} ${idx === todayIdx ? "today" : ""} theme-transition`} />
                                <span className="heatmap-lbl">{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="stat-cell streak theme-transition">
                        <span className="stat-val">🔥 {stats.streak}</span>
                        <span className="stat-lbl">ДНЕЙ</span>
                      </div>
                    </div>

                    <button 
                      className={`main-btn ${isActive ? "stop" : ""} font-extrabold`} 
                      onClick={toggleTimer}
                    >
                      {isActive ? "ПРЕРВАТЬ СТРИМ" : "СТАРТ LOCK IN"}
                    </button>
                  </div>

                  <section className="tasks-card theme-transition">
                    <div className="prog-bar-wrap">
                      <div className="prog-labels">
                        <span className="prog-title">ВЫПОЛНЕНИЕ НА СЕГОДНЯ</span>
                        <span className="prog-pct font-bold">{progress}%</span>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    
                    <div className="tasks-header">
                      <span className="tasks-label">ГЛАВНЫЕ ЗАДАЧИ</span>
                      <span className="tasks-remaining font-bold">{tasks.filter(t=>!t.completed).length} ОСТАЛОСЬ</span>
                    </div>

                    <input 
                      className="add-task-input theme-transition" 
                      placeholder="+ Добавить цель на сегодня..."
                      value={newTask} 
                      disabled={isActive} 
                      onChange={e => setNewTask(e.target.value)}
                      onKeyDown={e => { 
                        if (e.key === "Enter") { 
                          addTask(newTask); 
                          setNewTask(""); 
                        }
                      }} 
                    />

                    <div className="tasks-scroll">
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[var(--muted)] leading-relaxed">
                          Интерфейс «Today's Focus» пуст.<br />Добавьте шаги или кликните <b className="text-[var(--accent)]">+</b> в «Идеях» справа
                        </div>
                      ) : (
                        tasks.map(task => {
                          const tagColor = AVAILABLE_TAGS.find(t => t.name === task.tag)?.color || "#8e8e93";
                          const locked   = isActive || task.completed;
                          return (
                            <div key={task.id} className={`task-row ${task.completed ? "done" : ""} theme-transition`}>
                              <input 
                                type="checkbox" 
                                checked={task.completed} 
                                onChange={() => toggleTask(task.id)} 
                              />
                              <input 
                                className="task-text theme-transition" 
                                value={task.text} 
                                disabled={locked}
                                onChange={e => setTasks(p => p.map(t => t.id === task.id ? { ...t, text: e.target.value } : t))} 
                              />
                              <div className="tag-wrap" onClick={e => e.stopPropagation()}>
                                <span 
                                  className={`tag-badge ${locked ? "disabled" : ""} theme-transition`}
                                  style={{ borderColor: tagColor, color: tagColor }}
                                  onClick={() => { 
                                    if (!locked) setTagDropId(id => id === task.id ? null : task.id); 
                                  }}
                                >
                                  {task.tag}
                                </span>
                                {tagDropId === task.id && !locked && (
                                  <div className="tag-menu animate-pop">
                                    {AVAILABLE_TAGS.map(t => (
                                      <button 
                                        key={t.name} 
                                        className="tag-option text-left hover:text-[var(--text)]"
                                        onClick={() => { 
                                          setTasks(p => p.map(tk => tk.id === task.id ? { ...tk, tag: t.name } : tk)); 
                                          setTagDropId(null); 
                                        }}
                                      >
                                        <span className="tag-dot" style={{ background: t.color }} />
                                        {t.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="del-btn hover:text-[#ff3b30]" 
                                disabled={isActive}
                                onClick={() => setTasks(p => p.filter(t => t.id !== task.id))}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </div>

                {/* ПРАВАЯ КОЛОНКА: ИДЕИ И ЗАДАЧИ (НЕ удаляются при нажатии плюсика!) */}
                <div className="side-panel theme-transition">
                  <div className="side-panel-header">
                    <span className="side-panel-title">
                      <Lightbulb size={15} className="text-[var(--accent-secondary)]" /> 
                      Идеи & Хранилище задач
                    </span>
                    <span className="text-[10px] bg-[var(--bg-el)] px-2 py-1 rounded font-bold text-[var(--muted)]">ПЕРМАНЕНТНО</span>
                  </div>
                  
                  <div className="ideas-add-row">
                    <input 
                      className="ideas-input theme-transition" 
                      placeholder="Запиши идею..."
                      value={newIdea} 
                      onChange={e => setNewIdea(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") addIdea();
                      }} 
                    />
                    <button className="ideas-add-btn" onClick={addIdea}>+</button>
                  </div>
                  
                  <div className="ideas-list">
                    {ideaItems.length === 0 ? (
                      <div className="text-center py-10 text-xs text-[var(--muted)] leading-relaxed">
                        Хранилище пусто.<br />Сюда можно писать интуитивные идеи, а затем переносить их в план на день без потери оригинала!
                      </div>
                    ) : (
                      ideaItems.map(idea => (
                        <div key={idea.id} className={`idea-row ${flyingId === idea.id ? "idea-fly" : ""} theme-transition`}>
                          <span className="idea-text text-[var(--text)]">{idea.text}</span>
                          <div className="idea-actions">
                            <button 
                              className="idea-add-btn" 
                              title="Дублировать в Today's Focus"
                              onClick={() => addIdeaToFocus(idea)}
                            >
                              ＋
                            </button>
                            <button 
                              className="idea-del-btn" 
                              title="Удалить навсегда"
                              onClick={() => deleteIdea(idea.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* 📈 TAB: ANALYTICS */}
            {tab === "progress" && (
              <motion.div 
                key="progress"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="dash-layout w-full text-center"
              >
                <div className="w-full min-h-screen flex flex-col items-center justify-start mx-auto px-4 self-center justify-self-center">
                  <h2 className="text-2xl font-black text-[var(--text)] tracking-tight mb-1">АНАЛИТИКА ПРОДУКТИВНОСТИ</h2>
                  <p className="text-xs text-[var(--muted)] mb-6 tracking-wider uppercase">Индикаторы работы вашего мозга за текущую неделю</p>

                  <div className="chart-card-wide theme-transition text-left w-full">
                    <p className="text-xs font-bold text-[var(--muted)] mb-4 tracking-wider uppercase">РАСПРЕДЕЛЕНИЕ ФОКУСА ПО ДНЯМ НЕДЕЛИ (МИН)</p>
                    
                    <div className="bar-chart-wide">
                      {DAYS.map((day, idx) => {
                        const val  = heatmap[idx];
                        const pct  = (val / maxHeat) * 100;
                        const isToday = idx === todayIdx;
                        const details = barDetails[idx];
                        return (
                          <div 
                            key={day} 
                            className="bar-col-wide"
                            onMouseEnter={() => setHoveredBar(idx)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="bar-track-wide">
                              <div 
                                className={`bar-fill-wide ${isToday ? "today" : ""} theme-transition`}
                                style={{ height: `${Math.max(pct, val > 0 ? 6 : 2)}%` }}
                              />
                            </div>
                            <span className={`bar-lbl-wide ${isToday ? "today-lbl" : ""}`}>{day}</span>

                            {/* Всплывающий информационная подсказка */}
                            {hoveredBar === idx && (
                              <div className="bar-tooltip-box animate-pop text-left">
                                <div className="btt-day text-xs font-black uppercase tracking-wide border-b border-[var(--border)] pb-2 mb-2">
                                  {day} {isToday ? "(сегодня)" : ""}
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-[var(--muted)]">Фокус-тайм:</span>
                                  <span className="font-extrabold text-[var(--accent)]">{val} минут</span>
                                </div>
                                <div className="flex justify-between text-xs mb-2">
                                  <span className="text-[var(--muted)]">Сессий:</span>
                                  <span className="font-extrabold text-[var(--text)]">{details.length}</span>
                                </div>
                                {details.length > 0 ? (
                                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--border)] max-h-32 overflow-y-auto">
                                    {details.map((s, si) => (
                                      <div key={si} className="bg-[var(--bg-el)] p-2 rounded text-[11px] leading-relaxed">
                                        <div className="font-bold text-[var(--text)] truncate">«{s.mission}»</div>
                                        <div className="text-[var(--muted)] mb-1">{s.time} · {s.minutes}м · 🧠 Depth: {s.depthScore}</div>
                                        {s.taskNames && s.taskNames.length > 0 && (
                                          <div className="text-[var(--accent)] font-medium truncate">
                                            ✓ {s.taskNames.join(", ")}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-[var(--muted)] italic mt-2 text-center">Записей нет</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Убираем старый класс dash-grid и создаём изолированную сетку.
        grid-cols-1 — на мелких экранах блоки идут в 1 колонку.
        md:grid-cols-3 — на нормальных экранах ЖЁСТКО строим сетку 3х2 (по 3 блока в ряд).
      */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="dash-card theme-transition">
          <span className="dash-lbl">МИНУТ ЗА НЕДЕЛЮ</span>
          <span className="dash-val highlight">{stats.weekMinutes}м</span>
        </div>
        <div className="dash-card theme-transition">
          <span className="dash-lbl">МИНУТ СЕГОДНЯ</span>
          <span className="dash-val highlight">{stats.todayMinutes}м</span>
        </div>
        <div className="dash-card theme-transition">
          <span className="dash-lbl">ФОКУС-СТРИК</span>
          <span className="dash-val orange">🔥 {stats.streak} дн</span>
        </div>
        <div className="dash-card theme-transition">
          <span className="dash-lbl">ПИКОВАЯ АКТИВНОСТЬ</span>
          <span className="dash-val text-[var(--text)]">{dashMetrics.bestDay}</span>
        </div>
        <div className="dash-card theme-transition">
          <span className="dash-lbl">СРЕДНЯЯ СЕССИЯ</span>
          <span className="dash-val text-[var(--text)]">{dashMetrics.avgMin}м</span>
        </div>
        <div className="dash-card theme-transition">
          <span className="dash-lbl">ПРЕДПОЧТИТЕЛЬНЫЙ ТЕГ</span>
          <span className="dash-val text-[var(--text)]">{dashMetrics.topTag}</span>
        </div>
      </div>
                </div>
              </motion.div>
            )}

            {/* 📜 TAB: HISTORY */}
            {tab === "history" && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="hist-layout w-full text-center"
              >
                <div className="w-full min-h-screen flex flex-col items-center justify-start mx-auto pt-10 px-4 self-center justify-self-center">
                  <h2 className="text-2xl font-black text-[var(--text)] tracking-tight mb-1">ЖУРНАЛ СЕССИЙ</h2>
                  <p className="text-xs text-[var(--muted)] mb-6 uppercase tracking-wide">Ранее зафиксированная история вашей концентрации</p>
                  
                  {history.length === 0 ? (
                    <div className="text-center py-16 px-8 max-w-md mx-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                      <Award size={36} className="mx-auto mb-4 text-[var(--muted)] opacity-50" />
                      <p className="text-sm font-bold text-[var(--text)]">Журнал сессий пуст</p>
                      <p className="text-xs text-[var(--muted)] mt-1">Запустите таймер, завершите фокус и сохраните данные здесь.</p>
                    </div>
                  ) : (
                    <div className="hist-list">
                      {history.map(item => (
                        <div key={item.id} className="hist-card text-left theme-transition">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">
                              {item.dayName}, {item.time}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="depth-badge">🧠 Depth: {item.depthScore}</span>
                              <button 
                                className="text-[var(--muted)] hover:text-[#ff3b30] p-1 rounded hover:bg-[var(--bg-el)] transition-all cursor-pointer"
                                title="Удалить запись из истории"
                                onClick={() => setConfirmDeleteId(item.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-base font-black text-[var(--text)] mb-3">
                            “{item.mission}”
                          </p>

                          {item.taskNames && item.taskNames.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {item.taskNames.map((tn, ti) => (
                                <span key={ti} className="hist-task-chip text-[var(--text)]">
                                  ✓ {tn}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="bg-[var(--bg-el)] text-xs text-[var(--muted)] p-3 rounded-lg border-l-2 border-[var(--accent)] italic mb-3">
                            <b>Инсайт:</b> {item.note}
                          </div>

                          <div className="flex justify-between items-center text-xs font-extrabold border-t border-[var(--border)] pt-3">
                            <span className="text-[var(--muted)]">Решено {item.completedTasks} из {item.totalTasks} целей</span>
                            <span className="text-[var(--accent)] uppercase font-black">+{item.minutes} МИН ФОКУСА</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ⚙️ TAB: SETTINGS */}
            {tab === "settings" && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="settings-layout w-full text-center"
              >
                <div className="w-full max-w-2xl mx-auto px-4 text-left">
                  <h2 className="text-2xl font-black text-center text-[var(--text)] tracking-tight mb-1">НАСТРОЙКИ</h2>
                  <p className="text-xs text-center text-[var(--muted)] mb-6 uppercase tracking-wide">Конфигурация профайла и кастомизация палитр</p>

                  {/* PROFILE CARD */}
                  <div className="settings-section theme-transition">
                    <div className="settings-section-title">Карточка резидента</div>
                    
                    <div className="settings-avatar-row">
                      <div className="avatar-upload-box">
                        <div className="settings-big-avatar">
                          {userAvatar === "custom" && customAvatar ? (
                            <img src={customAvatar} alt="Avatar" />
                          ) : (
                            <span>{userAvatar === "custom" ? "👤" : userAvatar}</span>
                          )}
                        </div>
                        <label className="upload-btn">
                          <Upload size={12} className="inline mr-1" />
                          Загрузить фото
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAvatarFileChange} 
                          />
                        </label>
                      </div>

                      <div className="avatar-grid">
                        {AVATARS.map(av => (
                          <button 
                            key={av} 
                            className={`avatar-opt ${userAvatar === av ? "selected" : ""} theme-transition`}
                            onClick={() => {
                              setUserAvatar(av);
                            }}
                          >
                            {av}
                          </button>
                        ))}
                        {customAvatar && (
                          <button 
                            className={`avatar-opt text-xs font-bold ${userAvatar === "custom" ? "selected" : ""} theme-transition`}
                            onClick={() => setUserAvatar("custom")}
                          >
                            Своё
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                      <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Никнейм пользователя</label>
                      {editingName ? (
                        <div className="flex gap-2">
                          <input 
                            className="settings-input flex-1 bg-[var(--bg-el)] text-[var(--text)] font-extrabold px-4 py-2.5 rounded-xl border border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] min-w-0 w-full" 
                            value={nameDraft} 
                            autoFocus
                            onChange={e => setNameDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && nameDraft.trim()) {
                                setUserName(nameDraft.trim());
                                setEditingName(false);
                              }
                            }} 
                          />
                          <button 
                            className="settings-save-btn bg-[var(--accent)] text-black px-4 py-2 rounded-lg font-black"
                            onClick={() => {
                              if (nameDraft.trim()) {
                                setUserName(nameDraft.trim());
                                setEditingName(false);
                              }
                            }}
                          >
                            Сохранить
                          </button>
                          <button 
                            className="settings-cancel-btn text-[var(--muted)] px-3 py-2"
                            onClick={() => setEditingName(false)}
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-[var(--bg-el)] p-3 rounded-xl border border-[var(--border)]">
                          <span className="font-extrabold text-[var(--text)]">{userName || "[Никнейм не задан]"}</span>
                          <button 
                            className="text-xs text-[var(--accent)] font-bold hover:underline cursor-pointer"
                            onClick={() => {
                              setNameDraft(userName);
                              setEditingName(true);
                            }}
                          >
                            Изменить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* APPEARANCE (С КРУТЫМИ 3D ТЕМАМИ И ПЛАВНЫМИ ТРАНЗИШЕНАМИ) */}
                  <div className="settings-section theme-transition">
                    <div className="settings-section-title">Цветовой код интерфейса</div>
                    
                    <div className="theme-toggle-grid">
                      {[
                        { id: "dark",     name: "Cosmic",   bg: "#05050b", accent: "#6366f1" },
                        { id: "light",    name: "Apple",    bg: "#f5f5f7", accent: "#007aff" },
                        { id: "cyber",    name: "Neon",     bg: "#0d0a1a", accent: "#ff007f" },
                        { id: "emerald",  name: "Zen",      bg: "#0a110d", accent: "#10b981" },
                        { id: "nord",     name: "Arctic",   bg: "#2e3440", accent: "#88c0d0" },
                      ].map(t => (
                        <button 
                          key={t.id} 
                          className={`theme-btn-rect ${colorTheme === t.id ? "active hover:scale-100" : ""} theme-transition`}
                          onClick={() => {
                            setColorTheme(t.id);
                            playSound("click");
                          }}
                        >
                          <div className="theme-preview-dot shadow-inner" style={{ background: t.accent }} />
                          <span className="text-xs font-bold">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DANGER ZONE */}
                  <div className="settings-section theme-transition border border-[#ff3b30]/15 bg-[#ff3b30]/5">
                    <div className="settings-section-title text-[#ff3b30] font-black">Красная кнопка</div>
                    <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
                      Удаление всей накопленной за историю сессий, тегов, личных целей, заметок в левом блокноте и кастомных аватарок в данном браузере без возможности восстановления.
                    </p>
                    <button 
                      className="w-full py-3 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#ff3b30] text-xs font-extrabold cursor-pointer hover:bg-[#ff3b30]/20 transition-all"
                      onClick={() => setConfirmReset(true)}
                    >
                      Сбросить к заводским настройкам
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 📊 TAB: TRACKING (новый модуль — task-менеджер + аналитика + AI Coach) */}
            {tab === "tracking" && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full"
              >
                <TrackingPage colorTheme={colorTheme} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ════ CONFIRM OVERLAYS (ВСПЛЫВАЮЩИЕ ОКНА / ДИАЛОГИ) ════ */}
      <AnimatePresence>
        
        {/* TIMER SETTINGS */}
        {modalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay" 
            onClick={() => setModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-box w-full max-w-sm theme-transition" 
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-black mb-4">Настройка времени</h3>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <button className="text-[var(--muted)] hover:text-[var(--accent)] p-1 text-xs" onClick={() => setTempH(p => p === 23 ? 0 : p + 1)}>▲</button>
                  <span className="text-3xl font-black font-mono">{pad(tempH)}</span>
                  <button className="text-[var(--muted)] hover:text-[var(--accent)] p-1 text-xs" onClick={() => setTempH(p => p === 0 ? 23 : p - 1)}>▼</button>
                  <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wide mt-1">часов</span>
                </div>
                <span className="text-2xl font-black text-[var(--muted)] mb-5">:</span>
                <div className="flex flex-col items-center">
                  <button className="text-[var(--muted)] hover:text-[var(--accent)] p-1 text-xs" onClick={() => setTempM(p => p === 59 ? 0 : p + 1)}>▲</button>
                  <span className="text-3xl font-black font-mono">{pad(tempM)}</span>
                  <button className="text-[var(--muted)] hover:text-[var(--accent)] p-1 text-xs" onClick={() => setTempM(p => p === 0 ? 59 : p - 1)}>▼</button>
                  <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wide mt-1">минут</span>
                </div>
                <span className="text-2xl font-black text-[var(--muted)] mb-5">:</span>
                <div className="flex flex-col items-center">
                  <button className="text-[var(--muted)] hover:text-[var(--accent)] p-1 text-xs" onClick={() => setTempS(p => p === 59 ? 0 : p + 1)}>▲</button>
                  <span className="text-3xl font-black font-mono">{pad(tempS)}</span>
                  <button className="text-[var(--muted)] hover:text-[var(--accent)] p-1 text-xs" onClick={() => setTempS(p => p === 0 ? 59 : p - 1)}>▼</button>
                  <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wide mt-1">секунд</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  className="py-3 rounded-xl bg-[var(--text)] text-[var(--bg)] font-black text-xs cursor-pointer hover:opacity-90"
                  onClick={() => {
                    setIntensity("Custom");
                    setTimeLeft((tempH * 3600) + (tempM * 60) + tempS);
                    setModalOpen(false);
                  }}
                >
                  ЗАФИКСИРОВАТЬ ТАЙМЕР
                </button>
                <button 
                  className="py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
                  onClick={() => setModalOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* STOP TIMER CONFIRMATION */}
        {confirmStopOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <div className="modal-box border border-red-500/20 shadow-lg text-center theme-transition">
              <div className="text-3xl mb-1 text-red-500">⚠️</div>
              <h3 className="text-lg font-black mb-1">Выход из сессии</h3>
              <p className="text-xs text-[var(--muted)] mb-5 leading-relaxed">
                Вы точно хотите прервать текущий поток? Весь накопленный неподтвержденный прогресс сгорит.
              </p>
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-3 bg-[var(--bg-el)] rounded-xl text-xs font-bold text-[var(--text)]"
                  onClick={() => setConfirmStopOpen(false)}
                >
                  Остаться в потоке
                </button>
                <button 
                  className="flex-1 py-3 bg-red-600 rounded-xl text-xs font-black text-white hover:bg-red-700"
                  onClick={forceStopTimer}
                >
                  Прервать
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* DELETE HISTORY OVERLAY */}
        {confirmDeleteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <div className="modal-box border border-red-500/20 shadow-lg theme-transition">
              <div className="text-3xl mb-1">🗑</div>
              <h3 className="text-lg font-black mb-1">Очистить запись?</h3>
              <p className="text-xs text-[var(--muted)] mb-5 leading-relaxed">
                Текущая сессия будет удалена из глобального архива резидента безповоротно.
              </p>
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-3 bg-[var(--bg-el)] rounded-xl text-xs font-bold text-[var(--text)]"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Отмена
                </button>
                <button 
                  className="flex-1 py-3 bg-red-600 rounded-xl text-xs font-black text-white hover:bg-red-700"
                  onClick={() => confirmDeleteId && deleteHistoryItem(confirmDeleteId)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* NUCLEAR RESET OVERLAY */}
        {confirmReset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <div className="modal-box border border-red-600/30 text-center theme-transition">
              <div className="text-3xl mb-1">☢️</div>
              <h3 className="text-lg font-black mb-1 text-red-500">Сбросить абсолютно всё?</h3>
              <p className="text-xs text-[var(--muted)] mb-5 leading-relaxed">
                Вы перепишете лог, сотрете все записи дневника, стрик и сбросите профиль до базового состояния. Действие необратимо.
              </p>
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-3 bg-[var(--bg-el)] rounded-xl text-xs font-bold text-[var(--text)]"
                  onClick={() => setConfirmReset(false)}
                >
                  Передумать
                </button>
                <button 
                  className="flex-1 py-3 bg-red-600 rounded-xl text-xs font-black text-white hover:bg-red-700"
                  onClick={resetAllData}
                >
                  Да, сбросить
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONGRATULATIONS & SESSION WRITING */}
        {showCelebration && celebData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="celeb-overlay"
          >
            <motion.div 
              initial={{ scale: 0.93, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20 }}
              className="celeb-box theme-transition flex flex-col gap-5 text-center"
            >
              <div className="text-5xl">🏆</div>
              <h1 className="text-2xl font-black text-[var(--text)] truncate">{userName}, СЕССИЯ УСПЕШНО ЗАКРЫТА!</h1>
              
              <div className="flex justify-center gap-6 py-2">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-[var(--accent)]">+{celebData.earned}м</span>
                  <span className="text-[9px] font-bold text-[var(--muted)] tracking-wider">ФОКУС-ВРЕМЯ</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-blue-500">🧠 {celebData.depth}</span>
                  <span className="text-[9px] font-bold text-[var(--muted)] tracking-wider">DEPTH SCORE</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-orange-500">🔥 {celebData.streak}</span>
                  <span className="text-[9px] font-bold text-[var(--muted)] tracking-wider">ФОКУС-СТРИК</span>
                </div>
              </div>

              <div className="bg-[var(--bg-el)] p-4 rounded-xl text-left">
                <p className="text-xs font-black text-[var(--text)] uppercase tracking-wide mb-1">Session Journal</p>
                <p className="text-[11px] text-[var(--muted)] mb-3">Зафиксируйте инсайт, пока голова в состоянии кипения:</p>
                <input 
                  className="journal-input" 
                  placeholder="Запишите выводы дня... (нажмите Enter для сохранения)"
                  value={journalNote} 
                  autoFocus
                  onChange={e => setJournalNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveSession();
                  }} 
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between text-xs px-2 mb-2">
                  <label className="flex items-center gap-2 text-[var(--muted)] font-semibold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={clearDone} 
                      onChange={e => setClearDone(e.target.checked)} 
                      className="accent-[var(--accent)]"
                    />
                    Очистить выполненные цели
                  </label>
                  <span>{celebData.compCount} из {celebData.total} завершены</span>
                </div>

                <button 
                  className="py-3.5 bg-[var(--bg-el)] rounded-xl border border-[var(--border)] text-xs font-extrabold hover:bg-[var(--bg-card)] flex items-center justify-center gap-2 cursor-pointer"
                  onClick={share}
                >
                  <Share2 size={13} />
                  {copied ? "Успешно скопировано!" : "Поделиться триумфом"}
                </button>

                <button 
                  className="py-4 bg-[var(--text)] text-[var(--bg)] rounded-xl text-xs font-black cursor-pointer hover:opacity-90"
                  onClick={saveSession}
                >
                  СОХРАНИТЬ И ПРОДОЛЖИТЬ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
