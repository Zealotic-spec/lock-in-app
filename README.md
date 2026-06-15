<div align="center">

# 🔒 LOCK IN

**The focus tracker that keeps you honest.**

Pomodoro timer · Task management · AI coach · Notion-style diary

[Download for Windows](https://github.com/Zealotic-spec/lock-in-app/releases/latest) · [Download for macOS](https://github.com/Zealotic-spec/lock-in-app/releases/latest) · [Open in Browser](https://lock-in-app-gray.vercel.app)

</div>

---

## What is Lock In?

Lock In is a desktop productivity app built for people who are serious about deep work. No distractions, no clutter — just a timer, your tasks, and your thoughts.

## Features

- **Pomodoro Timer** — Warm-up, Focus, Deep Work, and Ultramarathon modes
- **Task Management** — Add tasks, tag them by mode, track daily completion
- **Weekly Analytics** — Visualize your focus time across the week
- **Notion-style Diary** — Capture insights mid-session with slash commands
- **Idea Storage** — Permanent idea bank that survives sessions
- **AI Coach** — Powered by Gemini, gives personalized productivity insights
- **5 Themes** — Cosmic (dark), Apple (light), Neon (cyber), Zen (emerald), Arctic (nord)
- **Custom Avatar** — Upload your own photo or pick an emoji
- **Session History** — Every session logged with depth score and notes

## Download

| Platform | Link |
|----------|------|
| Windows | [Lock In Setup.exe](https://github.com/Zealotic-spec/lock-in-app/releases/latest) |
| macOS | [Lock In.dmg](https://github.com/Zealotic-spec/lock-in-app/releases/latest) |
| Browser | [lock-in-app-gray.vercel.app](https://lock-in-app-gray.vercel.app) |

> **macOS note:** If you see a security warning, go to System Settings → Privacy & Security → Open Anyway. This is standard for unsigned apps. Alternatively, use the web version.

## Run Locally

```bash
git clone https://github.com/Zealotic-spec/lock-in-app.git
cd lock-in-app
npm install
npm run dev
```

## Build

```bash
# Web build
npm run build

# Desktop (Windows .exe / macOS .dmg)
npm run dist
```

## Tech Stack

- **React 19** + TypeScript
- **Vite** + Tailwind CSS v4
- **Electron** for desktop
- **Framer Motion** for animations
- **Gemini AI** for coaching
- **GitHub Actions** for macOS builds
- **Vercel** for web hosting

---

<div align="center">

Built with too many pomodoros · by [Zealotic](https://github.com/Zealotic-spec)

</div>