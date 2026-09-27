import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocalAiConfig, Book, AiHealthCheckResult, InstalledOllamaModel } from '../types';
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
  CornerDownLeft
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
  const { systemConfig, updateSystemConfig, testAiConnection, checkAiHealth, chatWithAi, getAiBookRecommendations } = useApp();

  const currentAiConfig = systemConfig?.aiConfig || {
    enabled: true,
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

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

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

  // Live Chatbot State
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
      content: 'سلام جناب مدیر مکتب‌خانه! من مدل هوش مصنوعی محلی Qwen 2.5 (نسخه ۷ میلیارد پارامتر) هستم که مستقیماً روی سرور شما در حال اجرا می‌باشم. هر سوال یا متنی دارید بفرمایید تا توانایی گفتگو و سرعت مرا بسنجید!',
      timestamp: 'هم‌اکنون'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatElapsedSec, setChatElapsedSec] = useState(0);
  const [chatError, setChatError] = useState('');

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
        modelName: modelName.trim(),
        endpointUrl: endpointUrl.trim(),
        systemPrompt: 'تو کتابدار دانا، باادب، صمیمی، دلسوز و باهوش مکتب‌خانه هستی. پاسخ‌هایت را به زبان فارسی سلیس، شیوا و دلنشین بنویس.',
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
      endpointUrl: endpointUrl.trim(),
      modelName: modelName.trim(),
      systemPrompt: systemPrompt.trim(),
      numPredict: Math.max(100, Math.min(1000, numPredict)),
      temperature: Number(temperature),
      topP: Number(topP),
      repeatPenalty: Number(repeatPenalty),
      maxCandidates: Math.max(4, Math.min(30, maxCandidates)),
      timeoutSeconds: Math.max(5, Math.min(60, timeoutSeconds)),
      fallbackEnabled: Boolean(fallbackEnabled)
    };

    try {
      const res = await updateSystemConfig({ aiConfig: newAiConfig });
      if (res && res.success) {
        setSaveSuccessMsg('تنظیمات هوش مصنوعی محلی با موفقیت ذخیره شد.');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } finally {
      setIsSaving(false);
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
        noTimeout: true
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
          <div className="p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl text-white shadow-md">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                تنظیمات و سلامت‌سنجی هوش مصنوعی محلی (Ollama & Qwen 7B)
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
              مدیریت اتصال به سرور پروکسموکس داخلی، تست سلامت‌سنجی ۴ گانه، پارامترهای مدل Qwen و پشتیبان اضطراری
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

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
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
              placeholder="qwen2.5:7b"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            />
            <span className="text-[11px] text-slate-400 block">
              نام مدل بارگذاری‌شده در Ollama (مثلاً <code className="text-slate-600">qwen2.5:7b</code> یا <code className="text-slate-600">qwen2.5:3b</code>).
            </span>
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
                max="25"
                step="1"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(parseInt(e.target.value) || 14)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                تعداد کتاب‌های برتر قفسه که در قالب پرامپت به هوش مصنوعی داده می‌شود.
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
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-900">چت‌بات و کنسول گفتگوی زنده با مدل محلی ({modelName})</h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>آماده گفتگو</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                با ارسال پیام‌های دلخواه، دقت، لحن فارسی و سرعت پاسخ‌دهی پردازنده و کارت گرافیک سرور خود را بسنجید.
              </p>
            </div>
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
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
                      {msg.role === 'user' ? 'شما (مدیر)' : `دستیار مکتب‌خانه (${modelName})`}
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
              <h4 className="text-sm font-black text-slate-900">محیط تست زنده و عیب‌یابی عمیق مدل (AI Diagnostic Playground)</h4>
              <p className="text-[11px] text-slate-500">
                بررسی دقیق کتاب‌های ارسالی به مدل، پرامپت کامل، پاسخ خام سرور Ollama و خروجی استخراج‌شده
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                    <span>در حال استنتاج مدل ({simElapsedSeconds} ثانیه)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>ارسال به هوش مصنوعی و اجرای آزمون</span>
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
    </div>
  );
};
