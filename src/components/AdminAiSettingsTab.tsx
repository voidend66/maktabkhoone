import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LocalAiConfig, Book, AiHealthCheckResult, InstalledOllamaModel, AiInteractionLog } from '../types';
import { getSafeImageUrl, DEFAULT_BOOK_COVER } from '../utils/coverPresets';
import {
  Bot,
  Sparkles,
  Server,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
  Cpu,
  BookOpen,
  HelpCircle,
  Layers,
  Terminal,
  Activity,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Trash2,
  User,
  CornerDownLeft,
  History,
  FileText,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

const SYSTEM_PROMPT_PRESETS = [
  {
    id: 'friendly',
    title: 'کتابدار رفیق و انگیزشی (پیش‌فرض هوشمند)',
    desc: 'لحن صمیمی و پرانرژی متناسب با نوجوانان، با ایجاد قلاب ذهنی و دلایل وسوسه‌کننده برای مطالعه.',
    prompt: `تو «کتابدار هوشمند، خوش‌ذوق و رفیق کتاب‌خوان مکتب‌خانه» هستی. وظیفه تو مشاوره صمیمی، شوق‌انگیز و تخصصی به دانش‌آموزان مدرسه برای انتخاب بهترین کتاب از قفسه کتابخانه است.

قوانین و اصول کلیدی:
۱. لحن و هویت: بسیار باانرژی، صمیمی، مؤدب، روان و متناسب با روحیات نوجوانان و دانش‌آموزان ایرانی. از اصطلاحات خشک اداری یا جملات کلیشه‌ای مثل «این کتاب برای شما مفید است» کاملاً دوری کن.
۲. دلیل‌نویسی گیرا و برانگیزاننده (Hook): در بخش دلیل پیشنهاد هر کتاب، دقیقاً به گره داستانی، ماجرا، شخصیت محوری یا زاویه دید جذابی اشاره کن که مستقیم به حس‌وحال دانش‌آموز می‌خورد تا او را بی‌درنگ به مطالعه ترغیب کند.
۳. انطباق بدون توهم (Zero Hallucination): فقط و فقط کتاب‌هایی را معرفی کن که شناسه‌شان در لیست ارائه‌شده موجود باشد و هرگز کتابی خارج از این لیست ابداع نکن.
۴. فرمت خروجی: نتیجه را فقط و فقط در قالب شیء استاندارد JSON تولید کن.`
  },
  {
    id: 'literary',
    title: 'مشاور ادبی و داستانی عمیق',
    desc: 'تمرکز بر پیام‌های اخلاقی، درونمایه داستانی و تقویت اندیشه و ذوق ادبی دانش‌آموز.',
    prompt: `تو «مشاور ادبی و داستانی مکتب‌خانه» هستی. نگاهی عمیق به درونمایه، ارزش‌های تربیتی و گره‌های شخصیتی کتاب‌ها داری.

قوانین و اصول کلیدی:
۱. لحن: فاخر، صمیمی، دلسوزانه و الهام‌بخش.
۲. دلیل‌نویسی: در دلیل معرفی هر کتاب، به جهان‌بینی اثر، رشد شخصیتی قهرمان داستان و درسی که برای زندگی دارد تأکید کن.
۳. انطباق داده: تنها از کتاب‌های قفسه ارائه‌شده انتخاب کن و هرگز کتابی بیرون از لیست ابداع نکن.
۴. فرمت: خروجی را صرفاً در قالب شیء معتبر JSON تحویل بده.`
  },
  {
    id: 'minimal',
    title: 'سریع، کوتاه و گزیده (مینیمال)',
    desc: 'پاسخ‌های فشرده و ضربتی برای سریع‌ترین زمان استنتاج و خروجی کوتاه.',
    prompt: `تو مشاور سریع کتاب مکتب‌خانه هستی.
۱. برای هر کتاب، دلیلی کوتاه، ضربتی و در حد یک جمله بنویس که روی هیجان‌انگیزترین نکته کتاب دست بگذارد.
۲. لحن صمیمی و دوستانه باشد.
۳. فقط کتاب‌های موجود در لیست ارسالی را معرفی کن.
۴. خروجی را دقیقاً و الزاماً در قالب JSON معتبر ارائه بده.`
  }
];

export const AdminAiSettingsTab: React.FC = () => {
  const {
    systemConfig,
    updateSystemConfig,
    testAiConnection,
    testGeminiConnection,
    checkAiHealth,
    chatWithAi,
    getAiBookRecommendations,
    getAiLogs,
    clearAiLogs
  } = useApp();

  const currentAiConfig = systemConfig?.aiConfig || {
    enabled: true,
    geminiEndpointUrl: 'http://192.168.100.54:5000/v1beta/models/gemini-3.5-flash-lite:generateContent',
    geminiModelName: 'gemini-3.5-flash-lite',
    geminiTimeoutSeconds: 15,
    endpointUrl: 'http://192.168.100.54:11434/api/generate',
    modelName: 'qwen2.5:7b',
    systemPrompt: SYSTEM_PROMPT_PRESETS[0].prompt,
    numPredict: 400,
    temperature: 0.35,
    topP: 0.9,
    repeatPenalty: 1.15,
    maxCandidates: 14,
    timeoutSeconds: 15,
    fallbackEnabled: false
  };

  const [enabled, setEnabled] = useState<boolean>(currentAiConfig.enabled ?? true);
  const [fallbackEnabled, setFallbackEnabled] = useState<boolean>(currentAiConfig.fallbackEnabled ?? false);
  const [geminiEndpointUrl, setGeminiEndpointUrl] = useState<string>(
    currentAiConfig.geminiEndpointUrl || 'http://192.168.100.54:5000/v1beta/models/gemini-3.5-flash-lite:generateContent'
  );
  const [geminiModelName, setGeminiModelName] = useState<string>(
    currentAiConfig.geminiModelName || 'gemini-3.5-flash-lite'
  );
  const [geminiTimeoutSeconds, setGeminiTimeoutSeconds] = useState<number>(
    currentAiConfig.geminiTimeoutSeconds || 15
  );
  const [endpointUrl, setEndpointUrl] = useState<string>(currentAiConfig.endpointUrl || 'http://192.168.100.54:11434/api/generate');
  const [modelName, setModelName] = useState<string>(currentAiConfig.modelName || 'qwen2.5:7b');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    currentAiConfig.systemPrompt || SYSTEM_PROMPT_PRESETS[0].prompt
  );
  const [numPredict, setNumPredict] = useState<number>(currentAiConfig.numPredict || 400);
  const [temperature, setTemperature] = useState<number>(currentAiConfig.temperature ?? 0.35);
  const [topP, setTopP] = useState<number>(currentAiConfig.topP ?? 0.9);
  const [repeatPenalty, setRepeatPenalty] = useState<number>(currentAiConfig.repeatPenalty ?? 1.15);
  const [maxCandidates, setMaxCandidates] = useState<number>(currentAiConfig.maxCandidates || 14);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(currentAiConfig.timeoutSeconds || 15);
  const [useReadingHistory, setUseReadingHistory] = useState<boolean>(currentAiConfig.useReadingHistory ?? true);
  const [excludeAlreadyRead, setExcludeAlreadyRead] = useState<boolean>(currentAiConfig.excludeAlreadyRead ?? true);
  const [useCollaborativeFiltering, setUseCollaborativeFiltering] = useState<boolean>(currentAiConfig.useCollaborativeFiltering ?? true);
  const [usePostReadFeedback, setUsePostReadFeedback] = useState<boolean>(currentAiConfig.usePostReadFeedback ?? true);
  const [diversityFactor, setDiversityFactor] = useState<number>(currentAiConfig.diversityFactor ?? 25);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Gemini Test State
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    success: boolean;
    latencyMs?: number | null;
    message: string;
    responseSample?: string;
  } | null>(null);

  // Ping Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number | null;
    message: string;
    responseSample?: string;
  } | null>(null);

  // Health Check State
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<AiHealthCheckResult | null>(null);
  const [showModelsList, setShowModelsList] = useState(true);
  const [copiedText, setCopiedText] = useState<string>('');

  // Playground / Simulator State
  const [testMood, setTestMood] = useState<string>('laugh');
  const [testPrompt, setTestPrompt] = useState<string>('یک رمان ماجراجویی و طنز مدرسه‌ای');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simElapsedSeconds, setSimElapsedSeconds] = useState<number>(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simSubTab, setSimSubTab] = useState<'recommendations' | 'candidates' | 'prompt' | 'raw_response' | 'diagnostics'>('candidates');
  const [playgroundEngine, setPlaygroundEngine] = useState<'gemini' | 'ollama'>('gemini');

  // Live Chatbot State
  const [chatEngine, setChatEngine] = useState<'gemini' | 'ollama'>('gemini');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    latencyMs?: number;
  }>>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'سلام جناب مدیر مکتب‌خانه! من مدل هوش مصنوعی Gemini 3.5 Flash Lite هستم که مستقیماً به سرور متصل می‌باشم. هر سوال، متن یا درخواستی دارید بفرمایید تا توانایی گفتگو، استدلال و سرعت مرا بسنجید!',
      timestamp: 'هم‌اکنون'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatElapsedSec, setChatElapsedSec] = useState(0);
  const [chatError, setChatError] = useState('');

  // AI Interaction Logs State
  const [aiLogs, setAiLogs] = useState<AiInteractionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AiInteractionLog | null>(null);
  const [logFilterFeature, setLogFilterFeature] = useState<string>('all');
  const [logFilterStatus, setLogFilterStatus] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  const loadAiLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await getAiLogs(150);
      if (res && res.success && Array.isArray(res.logs)) {
        setAiLogs(res.logs);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadAiLogs();
  }, []);

  const handleClearAiLogs = async () => {
    if (!window.confirm('آیا از پاکسازی تمام تاریخچه و لاگ‌های تعاملات هوش مصنوعی اطمینان دارید؟')) return;
    const res = await clearAiLogs();
    if (res && res.success) {
      setAiLogs([]);
      setSelectedLog(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend !== undefined ? textToSend : chatInput).trim();
    if (!message || isChatLoading) return;

    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(now);
    const userMsgId = 'msg-' + Date.now();

    const updatedHistory = [
      ...chatMessages,
      {
        id: userMsgId,
        role: 'user' as const,
        content: message,
        timestamp: timeStr
      }
    ];

    setChatMessages(updatedHistory);
    setChatInput('');
    setIsChatLoading(true);
    setChatError('');
    setChatElapsedSec(0);

    const timer = setInterval(() => {
      setChatElapsedSec((prev) => prev + 1);
    }, 1000);

    try {
      const messagesForApi = updatedHistory
        .filter((m) => m.id !== 'init-1')
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content
        }));

      const res = await chatWithAi({
        message,
        messages: messagesForApi,
        targetEngine: chatEngine,
        geminiEndpointUrl: geminiEndpointUrl.trim(),
        geminiModelName: geminiModelName.trim(),
        modelName: chatEngine === 'gemini' ? geminiModelName.trim() : modelName.trim(),
        endpointUrl: chatEngine === 'gemini' ? geminiEndpointUrl.trim() : endpointUrl.trim(),
        systemPrompt: 'تو کتابدار دانا، باادب، صمیمی، دلسوز و باهوش مکتب‌خانه هستی که بر پایه مدل هوش مصنوعی Gemini 3.5 Flash Lite فعالیت می‌کنی. پاسخ‌هایت را به زبان فارسی سلیس، شیوا، جذاب و مناسب دانش‌آموزان و معلمان بنویس.',
        temperature: 0.6,
        numPredict: 500
      });

      clearInterval(timer);

      if (res.success && res.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'reply-' + Date.now(),
            role: 'assistant',
            content: res.reply!,
            timestamp: new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
            latencyMs: res.latencyMs
          }
        ]);
      } else {
        setChatError(res.message || 'پاسخی از مدل دریافت نشد.');
      }
    } catch (err: any) {
      clearInterval(timer);
      setChatError(err.message || 'خطا در برقراری ارتباط با چت‌بات');
    } finally {
      clearInterval(timer);
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: 'init-' + Date.now(),
        role: 'assistant',
        content: 'تاریخچه گفتگو پاکسازی شد. چطور می‌توانم کمکتان کنم؟',
        timestamp: 'هم‌اکنون'
      }
    ]);
    setChatError('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');

    const newAiConfig: LocalAiConfig = {
      enabled,
      geminiEndpointUrl: geminiEndpointUrl.trim(),
      geminiModelName: geminiModelName.trim(),
      geminiTimeoutSeconds: Math.max(3, Number(geminiTimeoutSeconds)),
      endpointUrl: endpointUrl.trim(),
      modelName: modelName.trim(),
      systemPrompt: systemPrompt.trim(),
      numPredict: Math.max(100, Math.min(1000, numPredict)),
      temperature: Number(temperature),
      topP: Number(topP),
      repeatPenalty: Number(repeatPenalty),
      maxCandidates: Math.max(4, Math.min(60, maxCandidates)),
      timeoutSeconds: Math.max(0, Math.min(300, timeoutSeconds)),
      fallbackEnabled: Boolean(fallbackEnabled),
      useReadingHistory,
      excludeAlreadyRead,
      useCollaborativeFiltering,
      usePostReadFeedback,
      diversityFactor: Number(diversityFactor)
    };

    try {
      const res = await updateSystemConfig({ aiConfig: newAiConfig });
      if (res && res.success) {
        setSaveSuccessMsg('تنظیمات هوش مصنوعی (Gemini ابری و پشتیبان محلی) با موفقیت ذخیره شد.');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await testGeminiConnection({
        geminiEndpointUrl: geminiEndpointUrl.trim(),
        geminiModelName: geminiModelName.trim(),
        geminiTimeoutSeconds: Number(geminiTimeoutSeconds)
      });
      setGeminiTestResult(res);
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        message: err.message || 'خطا در ارتباط با سرور ابری Gemini'
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handlePingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection({
        endpointUrl: endpointUrl.trim(),
        modelName: modelName.trim(),
        timeoutSeconds: Number(timeoutSeconds)
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'خطا در تست اتصال'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setIsHealthChecking(true);
    try {
      const res = await checkAiHealth({
        endpointUrl: endpointUrl.trim(),
        modelName: modelName.trim()
      });
      setHealthResult(res);
    } catch (err: any) {
      console.error('Health check client error:', err);
    } finally {
      setIsHealthChecking(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    setSimElapsedSeconds(0);
    const startTimestamp = Date.now();
    const interval = setInterval(() => {
      setSimElapsedSeconds(Math.floor((Date.now() - startTimestamp) / 1000));
    }, 500);

    try {
      const res = await getAiBookRecommendations({
        mood: testMood,
        readingTime: 'medium',
        visualPreference: 'any',
        customPrompt: testPrompt.trim(),
        isTest: true,
        noTimeout: true,
        targetEngine: playgroundEngine,
        geminiEndpointUrl: geminiEndpointUrl.trim(),
        geminiModelName: geminiModelName.trim(),
        modelName: playgroundEngine === 'gemini' ? geminiModelName.trim() : (modelName.trim() || 'qwen2.5:3b'),
        endpointUrl: playgroundEngine === 'gemini' ? geminiEndpointUrl.trim() : endpointUrl.trim()
      });
      setSimulationResult(res);
    } catch (err: any) {
      setSimulationResult({
        success: false,
        message: err.message || 'خطا در شبیه‌سازی'
      });
    } finally {
      clearInterval(interval);
      setSimElapsedSeconds(Math.round((Date.now() - startTimestamp) / 1000));
      setIsSimulating(false);
    }
  };

  const handleResetDefaultPrompt = () => {
    setSystemPrompt(SYSTEM_PROMPT_PRESETS[0].prompt);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-500 rounded-2xl text-white shadow-md">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                تنظیمات هوش مصنوعی و الگوریتم‌های پیشنهاد کتاب (Gemini 3.5 & Hybrid Engine)
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {enabled ? 'فعال در سامانه' : 'غیرفعال'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              مدیریت موتور اصلی ابری (Gemini 3.5 Flash Lite)، الگوریتم‌های تاریخچه و هم‌کلاسی‌ها، ضریب تنوع و پشتیبان محلی
            </p>
          </div>
        </div>

        {/* Live Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Diagnostic Health Check Button */}
          <button
            type="button"
            onClick={handleRunHealthCheck}
            disabled={isHealthChecking}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isHealthChecking ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال سلامت‌سنجی ۴ گانه...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>سلامت‌سنجی جامع سرور</span>
              </>
            )}
          </button>

          {/* Quick Ping Button */}
          <button
            type="button"
            onClick={handlePingTest}
            disabled={isTesting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isTesting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span>پینگ سریع</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Health Check Suite Banner (if tested) */}
      {healthResult && (
        <div className={`p-5 rounded-3xl border text-xs leading-relaxed space-y-4 animate-in fade-in duration-300 ${
          healthResult.overallStatus === 'healthy'
            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            : healthResult.overallStatus === 'degraded'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        }`}>
          {/* Main Health Status Summary Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-black/10">
            <div className="flex items-center gap-2.5">
              <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                healthResult.overallStatus === 'healthy'
                  ? 'bg-emerald-600 animate-ping'
                  : healthResult.overallStatus === 'degraded'
                  ? 'bg-amber-600 animate-ping'
                  : 'bg-rose-600 animate-ping'
              }`} />
              <div>
                <div className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                  <span>
                    {healthResult.overallStatus === 'healthy' && '✅ وضعیت سرور: کاملاً سالم، آنلاین و متصل (Healthy)'}
                    {healthResult.overallStatus === 'degraded' && '⚠️ وضعیت سرور: آنلاین با هشدار بررسی مدل (Degraded)'}
                    {healthResult.overallStatus === 'offline' && '❌ وضعیت سرور: خاموش یا خارج از دسترس شبکه (Offline)'}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    ({healthResult.timestampFa || 'هم‌اکنون'})
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5">{healthResult.summary}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunHealthCheck}
              disabled={isHealthChecking}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-bold border border-black/10 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isHealthChecking ? 'animate-spin' : ''}`} />
              <span>تست مجدد</span>
            </button>
          </div>

          {/* 4 Pillars Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* 1. HTTP Web Server Ping */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>۱. اتصال وب‌سرور و پورت ۱۱۴۳۴</span>
                </div>
                {healthResult.steps.ping.success ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>پاسخ داد ({healthResult.steps.ping.latencyMs}ms)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>عدم پاسخ</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.ping.message}
              </p>
            </div>

            {/* 2. Models Check */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span>۲. مخزن مدل‌ها ({healthResult.targetModel})</span>
                </div>
                {healthResult.steps.models.targetModelFound ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>مدل موجود است</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>نیاز به بررسی</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.models.message}
              </p>

              {/* Installed Models Tags Pill List */}
              {healthResult.steps.models.installedModels?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500">مدل‌های شناسایی‌شده روی سرور شما:</span>
                    <button
                      type="button"
                      onClick={() => setShowModelsList(!showModelsList)}
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showModelsList ? 'بستن لیست' : 'مشاهده لیست'}</span>
                      {showModelsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showModelsList && (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {healthResult.steps.models.installedModels.map((m, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModelName(m.name)}
                          title={`کلیک برای انتخاب این مدل (حجم: ${m.sizeFormatted})`}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-1.5 border cursor-pointer ${
                            modelName === m.name
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Cpu className="w-3 h-3" />
                          <span>{m.name}</span>
                          <span className="text-[9px] opacity-75">({m.sizeFormatted})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Live Inference Check */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  <span>۳. استنتاج و تولید پاسخ زنده</span>
                </div>
                {healthResult.steps.inference.success ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>موفق ({healthResult.steps.inference.latencyMs}ms)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                    غیرفعال
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.inference.message}
              </p>
              {healthResult.steps.inference.sampleResponse && (
                <div className="text-[10px] font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-700 truncate">
                  نمونه تست: {healthResult.steps.inference.sampleResponse}
                </div>
              )}
            </div>

            {/* 4. Resilient Fallback Engine */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>۴. موتور پشتیبان اضطراری مکتب‌خانه</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>آماده به خدمت</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.fallback.message}
              </p>
              <div className="text-[10px] text-slate-400">
                در صورت هرگونه خاموشی یا بروز تاخیر، بدون معطلی دانش‌آموز کتاب‌های مرتبط ارائه می‌شود.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ping Test Result Banner (Quick Ping) */}
      {testResult && !healthResult && (
        <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 flex items-start gap-3 ${
          testResult.success
            ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
            : 'bg-rose-50 text-rose-950 border-rose-200'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <strong className="font-black text-xs sm:text-sm">
                {testResult.success ? '✅ پینگ با موفقیت برقرار شد!' : '⚠️ خطا در برقراری پینگ با سرور محلی:'}
              </strong>
              {testResult.latencyMs && (
                <span className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded-md border border-emerald-300">
                  زمان پاسخ: {testResult.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs">{testResult.message}</p>
            {testResult.responseSample && (
              <p className="text-[10px] text-slate-500 font-mono bg-white/60 p-1.5 rounded-lg border border-slate-200/60 truncate">
                نمونه پاسخ مدل: {testResult.responseSample}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Gemini Test Result Banner */}
      {geminiTestResult && (
        <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 flex items-start gap-3 ${
          geminiTestResult.success
            ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
            : 'bg-rose-50 text-rose-950 border-rose-200'
        }`}>
          {geminiTestResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <strong className="font-black text-xs sm:text-sm">
                {geminiTestResult.success ? '✅ اتصال به سرور Gemini ابری با موفقیت برقرار شد!' : '⚠️ خطا در اتصال به سرور ابری Gemini:'}
              </strong>
              {geminiTestResult.latencyMs && (
                <span className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded-md border border-emerald-300">
                  زمان پاسخ: {geminiTestResult.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs">{geminiTestResult.message}</p>
            {geminiTestResult.responseSample && (
              <p className="text-[10px] text-slate-500 font-mono bg-white/60 p-1.5 rounded-lg border border-slate-200/60 truncate">
                نمونه پاسخ مدل: {geminiTestResult.responseSample}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ۱. تنظیمات موتور اصلی: Gemini 3.5 Flash Lite ابری */}
        <div className="p-5 bg-gradient-to-br from-indigo-50/90 via-sky-50/70 to-emerald-50/60 rounded-3xl border border-indigo-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">موتور اصلی هوش مصنوعی (Gemini Cloud Engine)</h3>
                <span className="text-[10px] text-slate-500 font-medium">سرویس هوشمند تحلیل داده، استدلال و پیشنهاد کتاب</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                اولویت اول سیستم (Primary)
              </span>
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={isTestingGemini}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isTestingGemini ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال پینگ سرور...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>تست آنلاین سرور Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                <span>اندپوینت سرور ابری (آدرس کامل بدون نیاز به کلید و پروکسی)</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={geminiEndpointUrl}
                onChange={(e) => setGeminiEndpointUrl(e.target.value)}
                placeholder="http://192.168.100.54:5000/v1beta/models/gemini-3.5-flash-lite:generateContent"
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition outline-none"
              />
              <span className="text-[10px] text-slate-500 block">
                درخواست‌ها به صورت مستقیم به این سرور ارسال شده و پاسخ با سرعت و دقت مدل تحلیل می‌شود.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>مدل هوش مصنوعی ابری</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={geminiModelName}
                onChange={(e) => setGeminiModelName(e.target.value)}
                placeholder="gemini-3.5-flash-lite"
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition outline-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>تایم‌اوت پاسخ:</span>
                <span className="font-mono font-bold text-indigo-700">{geminiTimeoutSeconds} ثانیه</span>
              </div>
            </div>
          </div>
        </div>
        {/* Toggle Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Main AI Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <label htmlFor="ai_enabled" className="text-xs sm:text-sm font-black text-slate-900 block cursor-pointer">
                فعال‌سازی دستیار هوشمند در سایت
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                نمایش بنر و دکمهٔ «کتابدار هوشمند» به دانش‌آموزان در صفحه کتابخانه.
              </p>
            </div>
            <input
              id="ai_enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Algorithmic Fallback Toggle */}
          <div className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
            fallbackEnabled
              ? 'bg-amber-50/60 border-amber-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="fallback_enabled" className="text-xs sm:text-sm font-black text-slate-900 block cursor-pointer">
                  الگوریتم پشتیبان خودکار (Fallback)
                </label>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                  fallbackEnabled
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {fallbackEnabled ? 'فعال (جایگزینی خودکار)' : 'خاموش (جهت تست خالص مدل)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {fallbackEnabled
                  ? 'در صورت خاموش بودن Ollama، سیستم بر اساس تطابق موضوعی کتاب پیشنهاد می‌دهد.'
                  : 'در صورت قطعی یا خطای مدل، خطا مستقیماً نشان داده می‌شود تا عیب‌یابی شود.'}
              </p>
            </div>
            <input
              id="fallback_enabled"
              type="checkbox"
              checked={fallbackEnabled}
              onChange={(e) => setFallbackEnabled(e.target.checked)}
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* ۲. تنظیمات موتور پشتیبان محلی (Local Ollama Fallback) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-black text-slate-800">موتور پشتیبان محلی (Local Ollama Fallback)</h4>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            فقط در صورت عدم دسترسی به سرور ابری فراخوانی می‌شود
          </span>
        </div>

        {/* Server & Model Configuration Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* endpointUrl */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-500" />
              <span>آدرس اندپوینت Ollama (شبکه محلی یا اینترنت)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="http://192.168.100.54:11434/api/generate"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            />
            <span className="text-[11px] text-slate-400 block">
              آدرس پیش‌فرض سرور پروکسموکس: <code className="text-slate-600">http://192.168.100.54:11434/api/generate</code>
            </span>
          </div>

          {/* modelName */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>نام مدل (Model Name)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="qwen2.5:3b"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-bold">انتخاب سریع:</span>
              <button
                type="button"
                onClick={() => {
                  setModelName('qwen2.5:3b');
                  setNumPredict(280);
                  setMaxCandidates(4);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold border transition cursor-pointer ${
                  modelName === 'qwen2.5:3b'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                qwen2.5:3b (پیشنهادی ⚡️)
              </button>
              <button
                type="button"
                onClick={() => setModelName('qwen2.5:7b')}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold border transition cursor-pointer ${
                  modelName === 'qwen2.5:7b'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                qwen2.5:7b (۴.۴GB)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModelName('qwen2.5:1.5b');
                  setNumPredict(100);
                  setMaxCandidates(3);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold border transition cursor-pointer ${
                  modelName === 'qwen2.5:1.5b'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                qwen2.5:1.5b (خیلی سریع)
              </button>
            </div>
          </div>
        </div>

        {/* System Prompt Customizer with Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>شخصیت و پرامپت سیستمی مدل (System Prompt & Persona)</span>
            </label>
            <button
              type="button"
              onClick={handleResetDefaultPrompt}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>بازنشانی به الگوی پیش‌فرض</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SYSTEM_PROMPT_PRESETS.map((preset) => {
              const isActive = systemPrompt === preset.prompt;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSystemPrompt(preset.prompt)}
                  className={`p-2.5 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-black">{preset.title}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <textarea
            rows={7}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-mono focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            placeholder="دستورات سطح بالا به مدل..."
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>این متن شخصیت، لحن فارسی، تکنیک قلاب ذهنی (Hook) و ممنوعیت خروج از لیست کتاب‌ها را به مدل دیکته می‌کند.</span>
            <span className="font-mono">{systemPrompt.length} کاراکتر</span>
          </div>
        </div>

        {/* Advanced Hyperparameters Accordion / Section */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>تنظیمات پیشرفته هایپرپارامترها (Hyperparameters)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* temperature */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Temperature (خلاقیت):</span>
                <span className="font-mono text-indigo-600 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                مقدار کمتر = دقت و التزام بالاتر به فرمت JSON (پیشنهاد: 0.3)
              </span>
            </div>

            {/* topP */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Top-P (تنوع کلمات):</span>
                <span className="font-mono text-indigo-600 font-bold">{topP}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                کنترل تنوع توکن‌ها (پیشنهاد: 0.9)
              </span>
            </div>

            {/* repeatPenalty */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Repeat Penalty:</span>
                <span className="font-mono text-indigo-600 font-bold">{repeatPenalty}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={repeatPenalty}
                onChange={(e) => setRepeatPenalty(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                جلوگیری از تکرار کلمات تکراری (پیشنهاد: 1.1)
              </span>
            </div>

            {/* numPredict */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">حداکثر طول خروجی (Tokens):</span>
                <span className="font-mono text-indigo-600 font-bold">{numPredict}</span>
              </div>
              <input
                type="range"
                min="150"
                max="800"
                step="50"
                value={numPredict}
                onChange={(e) => setNumPredict(parseInt(e.target.value) || 350)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                سقف طول متن تولیدی (پیشنهاد: ۳۵۰ برای پیشنهاد سریع ۳ کتاب)
              </span>
            </div>

            {/* maxCandidates */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">کاندیداهای ارسالی به مدل:</span>
                <span className="font-mono text-indigo-600 font-bold">{maxCandidates} کتاب</span>
              </div>
              <input
                type="range"
                min="6"
                max="60"
                step="2"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(parseInt(e.target.value) || 20)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                تعداد کتاب‌های برتر قفسه (با توجه به پنجره پردازش وسیع Gemini 3.5، پیشنهاد: ۳۰ الی ۵۰ کتاب).
              </span>
            </div>

            {/* timeoutSeconds */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">تایم‌اوت پاسخ (Timeout):</span>
                <span className="font-mono text-indigo-600 font-bold">
                  {timeoutSeconds === 0 ? 'بدون محدودیت (نامحدود)' : `${timeoutSeconds} ثانیه`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 0)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                {timeoutSeconds === 0
                  ? 'بدون محدودیت زمانی (مناسب برای سرورهای بدون GPU یا مدل‌های سنگین).'
                  : 'سقف انتظار پاسخ مدل محلی در سایت (پیشنهاد: ۱۲۰ تا ۱۸۰ ثانیه یا صفر).'}
              </span>
            </div>
          </div>

          {/* الگوریتم‌های هوشمند ترکیبی و شخصی‌سازی */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800">تنظیمات موتور الگوریتم ترکیبی و شخصی‌سازی (Hybrid Engine)</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              تنظیم هوشمندی براساس رفتار واقعی کاربر، الگوی هم‌کلاسی‌ها، بازخورد نظرات پس از مطالعه و ضریب تنوع‌بخشی (کشف ژانرهای تازه):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* useReadingHistory */}
              <label className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-200 transition">
                <input
                  type="checkbox"
                  checked={useReadingHistory}
                  onChange={(e) => setUseReadingHistory(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">تحلیل تاریخچه امانت دانش‌آموز</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    ارزیابی ژانرهای قبلی امانت گرفته شده برای ارتقای وزن کتاب‌های هم‌سبک.
                  </span>
                </div>
              </label>

              {/* excludeAlreadyRead */}
              <label className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-200 transition">
                <input
                  type="checkbox"
                  checked={excludeAlreadyRead}
                  onChange={(e) => setExcludeAlreadyRead(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">عدم پیشنهاد تکراری کتاب‌های خوانده‌شده</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    حذف خودکار کتاب‌هایی که کاربر قبلاً امانت گرفته است از لیست کاندیداها.
                  </span>
                </div>
              </label>

              {/* useCollaborativeFiltering */}
              <label className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-200 transition">
                <input
                  type="checkbox"
                  checked={useCollaborativeFiltering}
                  onChange={(e) => setUseCollaborativeFiltering(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">الگوی هم‌کلاسی‌ها (Collaborative Filtering)</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    اولویت‌دهی به کتاب‌های پرطرفدار و موردپسند هم‌کلاسی‌های هم‌کلاس/هم‌پایه.
                  </span>
                </div>
              </label>

              {/* usePostReadFeedback */}
              <label className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-200 transition">
                <input
                  type="checkbox"
                  checked={usePostReadFeedback}
                  onChange={(e) => setUsePostReadFeedback(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">اصلاح سلیقه بر اساس نظرات پس از مطالعه (Post-Read Loop)</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    اعمال خودکار امتیازها و نظرات ثبت‌شده دانش‌آموز بر روی سلیقه آینده.
                  </span>
                </div>
              </label>
            </div>

            {/* diversityFactor slider */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>ضریب تنوع‌بخشی و کشف ژانرهای جدید (Serendipity Factor):</span>
                </span>
                <span className="font-mono text-indigo-600 font-bold">{diversityFactor}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={diversityFactor}
                onChange={(e) => setDiversityFactor(parseInt(e.target.value) || 0)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>۰٪ (کاملاً کانالیزه و متمرکز)</span>
                <span>۲۵٪ (متعادل و جذاب)</span>
                <span>۵۰٪ (تنوع حداکثری و غیرمنتظره)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال ذخیره‌سازی...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ذخیره تنظیمات هوش مصنوعی</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Linux / Proxmox Terminal Cheatsheet Helper */}
      <div className="p-4 bg-slate-900 rounded-3xl text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black">جعبه‌ابزار دستورات ترمینال سرور (Proxmox / Armbian)</h4>
          </div>
          <span className="text-[10px] text-slate-400">جهت بررسی مستقیم روی سرور لینوکس</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { label: 'تست پینگ به Ollama از سرور سایت', cmd: 'curl -I http://192.168.100.54:11434' },
            { label: 'مشاهده لیست مدل‌های نصب‌شده در Ollama', cmd: 'curl -s http://192.168.100.54:11434/api/tags' },
            { label: 'بررسی وضعیت سرویس Ollama', cmd: 'sudo systemctl status ollama' },
            { label: 'پایش اشغال پورت 11434 در شبکه', cmd: 'ss -tulpn | grep 11434' }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-300 block truncate font-medium">{item.label}</span>
                <code className="text-[11px] text-emerald-400 font-mono block truncate" dir="ltr">{item.cmd}</code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.cmd)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer shrink-0"
                title="کپی دستور"
              >
                {copiedText === item.cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Admin AI Chatbot Console */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-sky-500 text-white rounded-2xl shadow-sm">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-900">
                  چت‌بات و کنسول گفتگوی زنده با {chatEngine === 'gemini' ? 'Gemini 3.5 Flash Lite (ابری)' : `مدل محلی (${modelName})`}
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>آماده گفتگو</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                گفتگوی آنلاین با هوش مصنوعی برای سنجش سرعت، کیفیت پاسخ‌ها و مهارت مشاوره کتابدار مکتب‌خانه.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Engine Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChatEngine('gemini')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  chatEngine === 'gemini'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Gemini 3.5 Flash ⚡️</span>
              </button>
              <button
                type="button"
                onClick={() => setChatEngine('ollama')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  chatEngine === 'ollama'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Ollama محلی</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="پاکسازی تاریخچه گفتگو"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک کردن چت</span>
            </button>
          </div>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400">پیشنهاد سریع:</span>
          {[
            'سلام! خودت رو معرفی کن و توانایی‌هات رو بگو.',
            '۳ کتاب جذاب برای دانش‌آموز نوجوان معرفی کن با دلیل.',
            'یک خلاصه کوتاه و دلنشین از کتاب شازده کوچولو بنویس.',
            'چرا مطالعه کتاب کاغذی بهتر از فضای مجازیه؟'
          ].map((promptText, pIdx) => (
            <button
              key={pIdx}
              type="button"
              disabled={isChatLoading}
              onClick={() => handleSendMessage(promptText)}
              className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Messages Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-inner">
          <div className="p-4 sm:p-5 space-y-4 max-h-[420px] min-h-[220px] overflow-y-auto">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles className="w-4 h-4 text-yellow-200" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl space-y-1.5 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 pb-1 border-b border-black/5">
                    <span className="font-bold">
                      {msg.role === 'user' ? 'شما (مدیر)' : `دستیار مکتب‌خانه (${chatEngine === 'gemini' ? 'Gemini 3.5 Flash' : modelName})`}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      {msg.latencyMs && (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {(msg.latencyMs / 1000).toFixed(1)} ثانیه
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </p>

                  {msg.role === 'assistant' && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content)}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
                        title="کپی پاسخ"
                      >
                        {copiedText === msg.content ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>کپی متن</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 text-xs justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-indigo-200 space-y-1.5 shadow-xs max-w-[80%]">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-[11px]">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>در حال تفکر و پردازش پاسخ در سرور محلی ({chatElapsedSec} ثانیه)...</span>
                  </div>
                  <div className="flex gap-1 py-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">خطا در دریافت پاسخ:</strong>
                  <span>{chatError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isChatLoading}
              placeholder="پیام یا سوال خود را اینجا بنویسید (مثلاً: یک خلاصه جذاب از کتاب شازده کوچولو بگو)..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none disabled:opacity-60"
            />

            <button
              type="button"
              disabled={isChatLoading || !chatInput.trim()}
              onClick={() => handleSendMessage()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
            >
              <Send className="w-4 h-4 -scale-x-100" />
              <span>ارسال</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Playground (Live Student Testing & Deep Inspection) */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                محیط تست زنده و شبیه‌ساز پیشنهاد کتاب ({playgroundEngine === 'gemini' ? 'Gemini 3.5 Flash Lite' : `مدل محلی ${modelName}`})
              </h4>
              <p className="text-[11px] text-slate-500">
                بررسی دقیق کتاب‌های ارسالی از قفسه، پرامپت ساختاریافته، پاسخ زنده سرور هوش مصنوعی و تحلیل کتاب‌های استخراج‌شده
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Engine Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPlaygroundEngine('gemini')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  playgroundEngine === 'gemini'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>موتور Gemini 3.5 Flash ⚡️</span>
              </button>
              <button
                type="button"
                onClick={() => setPlaygroundEngine('ollama')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  playgroundEngine === 'ollama'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>موتور Ollama محلی</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFallbackEnabled(!fallbackEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                fallbackEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>الگوریتم پشتیبان: {fallbackEnabled ? 'فعال' : 'خاموش (تست خالص)'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mood selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">حس و حال انتخابی دانش‌آموز:</label>
              <select
                value={testMood}
                onChange={(e) => setTestMood(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="laugh">می‌خواهم از ته دل بخندم (طنز)</option>
                <option value="mystery">کنجکاوم و می‌خواهم معما حل کنم (معمایی و جنایی)</option>
                <option value="adventure">دنبال ماجراجویی و هیجان بالام (ماجراجویی و فانتزی)</option>
                <option value="thoughtful">به دنبال فکر کردن و درس عبرت هستم (انگیزشی و رشد فردی)</option>
                <option value="scientific">دانستنی‌ها و شگفتی‌های علم (علمی و اطلاعات عمومی)</option>
                <option value="thriller">دلهره‌آور و پرحادثه (هیجان بالا)</option>
              </select>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">درخواست یا علاقه اختصاصی دانش‌آموز:</label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="مثلاً: من عاشق کتاب‌های ماجراجویی با چاشنی طنزم"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال استنتاج {playgroundEngine === 'gemini' ? 'Gemini 3.5 Flash' : 'مدل محلی'} ({simElapsedSeconds} ثانیه)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>ارسال به {playgroundEngine === 'gemini' ? 'Gemini 3.5 Flash Lite' : 'مدل محلی'} و اجرای آزمون</span>
                  </>
                )}
              </button>

              {/* Real-time Stopwatch Badge */}
              {isSimulating && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-mono font-black animate-pulse">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>زمان‌سنج زنده: {simElapsedSeconds} ثانیه</span>
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              ⚡️ تایم‌اوت در بخش تست <strong>نامحدود</strong> است تا عملکرد واقعی و سرعت پردازش مدل دقیقاً سنجیده شود.
            </span>
          </div>

          {/* Simulation Output and Deep Diagnostic Tabs */}
          {simulationResult && (
            <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`font-black flex items-center gap-1.5 ${
                    simulationResult.success && simulationResult.isAiGenerated
                      ? 'text-emerald-700'
                      : simulationResult.success
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}>
                    {simulationResult.success ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {simulationResult.isAiGenerated
                        ? '✅ تولید شده توسط هوش مصنوعی (Qwen)'
                        : simulationResult.success
                        ? '⚠️ تطابق الگوریتم داخلی (پشتیبان)'
                        : '❌ خطا در دریافت پاسخ از مدل'}
                    </span>
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    simulationResult.debugInfo?.parseSuccess
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {simulationResult.debugInfo?.parseSuccess ? 'JSON معتبر' : 'پارس JSON ناموفق / خاموش'}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700">
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      مدت زمان پردازش: {simulationResult.latencyMs ? (simulationResult.latencyMs / 1000).toFixed(1) : simElapsedSeconds} ثانیه ({simulationResult.latencyMs || simElapsedSeconds * 1000}ms)
                    </span>
                  </span>
                  {simulationResult.candidatesCount !== undefined && (
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      کاندیداها: {simulationResult.candidatesCount} جلد
                    </span>
                  )}
                </div>
              </div>

              {/* Error Alert if any */}
              {!simulationResult.success && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>پیام خطا: {simulationResult.message}</span>
                  </div>
                  {simulationResult.debugInfo?.fetchError && (
                    <p className="font-mono text-[11px] text-rose-700 mt-1">
                      علت جزئی: {simulationResult.debugInfo.fetchError}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation Subtabs for Deep Inspection */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setSimSubTab('candidates')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    simSubTab === 'candidates'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>کتاب‌های ارسالی به مدل ({simulationResult.debugInfo?.candidatesSent?.length || simulationResult.candidatesCount || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimSubTab('prompt')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    simSubTab === 'prompt'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>پرامپت کامل ارسالی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimSubTab('raw_response')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    simSubTab === 'raw_response'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>پاسخ خام مدل هوش مصنوعی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimSubTab('recommendations')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    simSubTab === 'recommendations'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>پیشنهادهای استخراج‌شده ({simulationResult.recommendedBooks?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimSubTab('diagnostics')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    simSubTab === 'diagnostics'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>اطلاعات شبکه و دیباگ</span>
                </button>
              </div>

              {/* Tab 1: Candidates Sent */}
              {simSubTab === 'candidates' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold">
                      لیست {simulationResult.debugInfo?.candidatesSent?.length || 0} کتابی که از قفسه مکتب‌خانه فیلتر شده و در پرامپت به هوش مصنوعی ارسال گردید:
                    </span>
                  </div>

                  {simulationResult.debugInfo?.candidatesSent && simulationResult.debugInfo.candidatesSent.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                      {simulationResult.debugInfo.candidatesSent.map((c: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-slate-900 truncate">
                              {idx + 1}. {c.title}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 shrink-0">
                              {c.id}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-1">
                            <span>نویسنده: <strong>{c.author}</strong></span>
                            <span>دسته‌بندی: <strong className="text-indigo-700">{c.category}</strong></span>
                            {c.pageCount ? <span>صفحات: {c.pageCount}</span> : null}
                          </div>

                          {c.tags && c.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {c.tags.map((t: string, tidx: number) => (
                                <span key={tidx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          {c.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed bg-white/70 p-1.5 rounded border border-slate-100">
                              {c.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">لیست کاندیداها ثبت نشده است.</p>
                  )}
                </div>
              )}

              {/* Tab 2: Full Prompt Sent */}
              {simSubTab === 'prompt' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">متن کامل پرامپت ارسال‌شده به مدل Qwen در Ollama:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const fullText = `=== SYSTEM PROMPT ===\n${simulationResult.debugInfo?.systemPrompt || ''}\n\n=== USER PROMPT ===\n${simulationResult.debugInfo?.userPrompt || ''}`;
                        navigator.clipboard.writeText(fullText);
                        setCopiedText('prompt');
                        setTimeout(() => setCopiedText(''), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'prompt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'prompt' ? 'کپی شد' : 'کپی کل پرامپت'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-indigo-900 block">دستور سیستمی (System Prompt):</span>
                    <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40">
                      {simulationResult.debugInfo?.systemPrompt || 'پیش‌فرض'}
                    </pre>

                    <span className="text-[11px] font-black text-indigo-900 block pt-2">پرامپت کاربر و لیست کتاب‌ها (User Prompt):</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                      {simulationResult.debugInfo?.userPrompt || 'پرامپتی ثبت نشده است'}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 3: Raw AI Response */}
              {simSubTab === 'raw_response' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">پاسخ خام بازگردانده شده از سرور هوش مصنوعی (Raw Response Body):</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(simulationResult.debugInfo?.rawAiResponse || '');
                        setCopiedText('raw');
                        setTimeout(() => setCopiedText(''), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'raw' ? 'کپی شد' : 'کپی پاسخ خام'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 bg-slate-950 text-sky-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 border border-slate-800">
                    {simulationResult.debugInfo?.rawAiResponse || 'هیچ پاسخی از سرور دریافت نشد (خالی)'}
                  </pre>
                </div>
              )}

              {/* Tab 4: Final Extracted Recommendations */}
              {simSubTab === 'recommendations' && (
                <div className="space-y-3">
                  {simulationResult.greeting && (
                    <p className="text-xs text-indigo-900 font-bold bg-indigo-50 p-3 rounded-xl border border-indigo-100 leading-relaxed">
                      💬 <strong>پیام کتابدار هوشمند:</strong> {simulationResult.greeting}
                    </p>
                  )}

                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-slate-700 block">کتاب‌های برگزیده مدل:</span>
                    {simulationResult.recommendedBooks && simulationResult.recommendedBooks.length > 0 ? (
                      simulationResult.recommendedBooks.map(({ book, reason }: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-slate-900 text-xs">
                                {book.title} <span className="text-slate-500 font-normal">({book.author})</span>
                              </span>
                              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                                {book.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-700 mt-1 bg-white p-2 rounded-lg border border-slate-100 leading-relaxed">
                              💡 <strong>دلیل معرفی مدل:</strong> {reason}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        کتابی استخراج نشد.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Diagnostics & Network Details */}
              {simSubTab === 'diagnostics' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-sans">آدرس اندپوینت: </span>
                      <strong className="text-slate-900">{simulationResult.debugInfo?.endpointUsed || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">مدل درخواستی: </span>
                      <strong className="text-slate-900">{simulationResult.debugInfo?.modelUsed || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">کد وضعیت HTTP: </span>
                      <strong className={simulationResult.debugInfo?.httpStatus === 200 ? 'text-emerald-700' : 'text-rose-700'}>
                        {simulationResult.debugInfo?.httpStatus ?? 'نامشخص'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">مدت زمان اجرا: </span>
                      <strong className="text-slate-900">{simulationResult.debugInfo?.executionTimeMs ?? simulationResult.latencyMs ?? 0} میلی‌ثانیه</strong>
                    </div>
                  </div>

                  {simulationResult.debugInfo?.fetchError && (
                    <div className="p-2 bg-rose-100/70 text-rose-900 rounded-lg text-[11px] font-sans">
                      ⚠️ <strong>خطای شبکه / اتصال:</strong> {simulationResult.debugInfo.fetchError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ۵. تاریخچه و لاگ کامل تعاملات هوش مصنوعی (AI Interaction Logs) */}
      {/* ======================================================== */}
      <div className="pt-8 border-t-2 border-slate-200/80 space-y-4">
        {/* Header & Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 text-white rounded-2xl shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-900">
                  تاریخچه و لاگ تعاملات هوش مصنوعی (AI Interaction Logs)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {aiLogs.length} تعامل ثبت‌شده
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                مشاهده تمام درخواست‌های ارسالی دانش‌آموزان به هوش مصنوعی، پرامپت ارسالی، پاسخ خام دریافتی، کتاب‌های پیشنهادی و سرعت پاسخگویی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadAiLogs}
              disabled={isLoadingLogs}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="بارگذاری مجدد لاگ‌ها"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>بروزرسانی لاگ‌ها</span>
            </button>

            {aiLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAiLogs}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="پاکسازی تاریخچه لاگ‌ها"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی تاریخچه</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">کل درخواست‌ها</span>
            <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{aiLogs.length}</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">پردازش‌شده توسط Gemini ابری</span>
            <span className="text-lg font-black text-indigo-600 font-mono mt-0.5 block">
              {aiLogs.filter((l) => l.engine === 'gemini' || l.modelName.includes('gemini')).length}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">موفقیت‌آمیز</span>
            <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
              {aiLogs.filter((l) => l.success).length}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block">میانگین سرعت پاسخ</span>
            <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
              {aiLogs.length > 0
                ? `${Math.round(aiLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / aiLogs.length)}ms`
                : '-'}
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام دانش‌آموز، عنوان کتاب یا کلمات پرامپت..."
              className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Filter by Feature */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-bold">بخش:</span>
              <select
                value={logFilterFeature}
                onChange={(e) => setLogFilterFeature(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
              >
                <option value="all">همه بخش‌ها</option>
                <option value="recommendation">پیشنهاد کتابدار هوشمند</option>
                <option value="chat">چت‌بات زنده</option>
                <option value="playground">شبیه‌ساز / آزمون</option>
                <option value="similar_books">کتاب‌های مشابه</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-bold">وضعیت:</span>
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="success">فقط موفق</option>
                <option value="error">فقط دارای خطا</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        {isLoadingLogs ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">در حال فراخوانی تاریخچه تعاملات...</p>
          </div>
        ) : aiLogs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">هنوز تعاملی در دیتابیس هوش مصنوعی ثبت نشده است.</p>
            <p className="text-[11px] text-slate-400">
              به محض استفاده دانش‌آموزان از کتابدار هوشمند یا اجرای آزمون در شبیه‌ساز و چت‌بات، تمام جزئیات در اینجا لاگ می‌شود.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {aiLogs
              .filter((log) => {
                if (logFilterFeature !== 'all' && log.feature !== logFilterFeature) return false;
                if (logFilterStatus === 'success' && !log.success) return false;
                if (logFilterStatus === 'error' && log.success) return false;
                if (logSearchQuery.trim()) {
                  const q = logSearchQuery.trim().toLowerCase();
                  const matchUser = (log.userName || '').toLowerCase().includes(q);
                  const matchClass = (log.userClass || '').toLowerCase().includes(q);
                  const matchPrompt = (log.prompt || '').toLowerCase().includes(q);
                  const matchResponse = (log.rawResponse || '').toLowerCase().includes(q);
                  const matchBooks = (log.recommendedBooks || []).some(
                    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
                  );
                  if (!matchUser && !matchClass && !matchPrompt && !matchResponse && !matchBooks) {
                    return false;
                  }
                }
                return true;
              })
              .map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isGemini = log.engine === 'gemini' || (log.modelName && log.modelName.includes('gemini'));

                return (
                  <div
                    key={log.id}
                    className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Log Row Header */}
                    <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            log.success ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500 ring-4 ring-rose-100'
                          }`}
                          title={log.success ? 'موفق' : 'دارای خطا'}
                        />

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900">
                              {log.userName || 'کاربر مهمان'}
                            </span>
                            {log.userClass && (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                                {log.userClass}
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                isGemini
                                  ? 'bg-linear-to-r from-indigo-100 to-sky-100 text-indigo-900 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>{isGemini ? 'Gemini 3.5 Flash' : log.modelName}</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-bold border border-amber-200">
                              {log.featureTitle || log.feature}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                            <span>{log.timestampFa}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold">{log.latencyMs}ms</span>
                            {log.candidatesCount !== undefined && log.candidatesCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{log.candidatesCount} کتاب در قفسه</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Expand/Collapse */}
                      <button
                        type="button"
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>بستن جزئیات</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده پرامپت و پاسخ</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Book recommendations badge list preview */}
                    {log.recommendedBooks && log.recommendedBooks.length > 0 && (
                      <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-bold">کتاب‌های پیشنهادی:</span>
                        {log.recommendedBooks.map((b, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-50 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 font-bold flex items-center gap-1"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-indigo-600" />
                            <span>«{b.title}» ({b.author})</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Deep Diagnostic Inspection Drawer */}
                    {isSelected && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-4 animate-in fade-in duration-150">
                        {/* 1. Prompt Sent to Model */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>متن کامل ارسالی به هوش مصنوعی (پرامپت و قفسه کاندیداها):</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleCopy(log.prompt);
                                setCopiedText(`prompt-${log.id}`);
                                setTimeout(() => setCopiedText(''), 2000);
                              }}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === `prompt-${log.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">کپی شد</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>کپی پرامپت</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto select-all">
                            {log.prompt || 'پرامپتی ثبت نشده است.'}
                          </pre>
                        </div>

                        {/* 2. Raw AI Response */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                              <span>پاسخ خام دریافتی از هوش مصنوعی:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleCopy(log.rawResponse || '');
                                setCopiedText(`resp-${log.id}`);
                                setTimeout(() => setCopiedText(''), 2000);
                              }}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === `resp-${log.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">کپی شد</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>کپی پاسخ</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 bg-white text-slate-800 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto select-all">
                            {log.rawResponse || 'پاسخ خامی ثبت نشده است.'}
                          </pre>
                        </div>

                        {/* 3. Reasons for recommended books */}
                        {log.recommendedBooks && log.recommendedBooks.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <span className="text-xs font-bold text-slate-800 block">
                              دلایل معرفی کتاب‌ها به دانش‌آموز:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {log.recommendedBooks.map((rb, idx) => (
                                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                                  <strong className="text-indigo-950 font-bold block">
                                    {idx + 1}. «{rb.title}» اثر {rb.author}
                                  </strong>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {rb.reason || 'بدون توضیح اضافی.'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Endpoint info */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>اندپوینت فعال: {log.endpointUrl}</span>
                          {log.errorMessage && (
                            <span className="text-rose-600 font-sans font-bold">خطا: {log.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
