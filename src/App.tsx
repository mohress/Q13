import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Printer, 
  Sparkles, 
  Clock, 
  Bluetooth, 
  Settings, 
  Check, 
  Plus, 
  Trash2, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Share2, 
  Timer, 
  Calendar, 
  Layers, 
  Power, 
  Info,
  Sliders,
  Bell,
  SlidersHorizontal,
  FileText,
  Play,
  Shield,
  Activity,
  Zap,
  Moon,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, PrinterSettings, SimulatedReceipt } from "./types";
import { 
  reverseArabicForPrinting, 
  buildEscPosReceipt, 
  shapeArabicText,
  convertToWindows1256
} from "./utils/arabicShaper";

export default function App() {
  // --- 1. Core States ---
  const [planInput, setPlanInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Background Persistence & Wake Lock States ---
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [isSilentLoopActive, setIsSilentLoopActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);
  const silentIntervalRef = useRef<any>(null);

  // --- PWA Standalone Installation & WebView Bypass Guides ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [showPwaGuide, setShowPwaGuide] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      console.log("PWA install prompt detected and deferred.");
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerPwaInstallation = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      setSuccessMsg("تم تثبيت التطبيق بنجاح على شاشتك الرئيسية! ✓ يمكنك تشغيله الآن كأيقونة مستقلة وتوصيل البلوتوث.");
    }
  };

  // --- Screen Wake Lock implementation ---
  const handleToggleWakeLock = async () => {
    try {
      if (isWakeLockActive) {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setIsWakeLockActive(false);
        setSuccessMsg("تم إلغاء قفل اليقظة. الشاشة قد تنطفئ الآن تلقائياً لتوفير طاقة البطارية.");
      } else {
        const nav = navigator as any;
        if (!('wakeLock' in nav)) {
          throw new Error("متصفحك أو النظام الحالي لا يدعم خاصية Web Wake Lock لمنع خمول الشاشة تلقائياً.");
        }
        const lock = await nav.wakeLock.request('screen');
        wakeLockRef.current = lock;
        setIsWakeLockActive(true);
        setSuccessMsg("تم تفعيل قفل اليقظة الفاخر! الشاشة ستظل نشطة باستمرار والبطارية في وضع يقظ ✓");
        appendSystemSimulatorLog("تم تفعيل خاصية Web Wake Lock لمنع انطفاء الشاشة أو تجميد المعالج.");
        
        lock.addEventListener('release', () => {
          setIsWakeLockActive(false);
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "فشل في تفعيل قفل اليقظة للشاشة.");
    }
  };

  // --- Silent Audio Loop Keep-Alive (OS Background Exclusion) ---
  const startSilentAudioLoop = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Stop existing loop if any
      if (silentIntervalRef.current) {
        clearInterval(silentIntervalRef.current);
        silentIntervalRef.current = null;
      }

      // Create a 2-second buffer of absolute silence with ultra-subtle signal to keep the audio hardware hot
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = (Math.random() * 2 - 1) * 0.000005; // Humanly inaudible, but keeps audio stream active
      }

      const playLoop = () => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.005, ctx.currentTime);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
      };

      playLoop();
      silentIntervalRef.current = setInterval(playLoop, 1950);
      setIsSilentLoopActive(true);
      setSuccessMsg("تم تشغيل رادار اليقظة بالخلفية لمنع تجميد المجدول بنجاح ✓");
      appendSystemSimulatorLog("تم تنشيط Background Audio Loop للتأكد من عدم تجميد العمليات عند قفل الشاشة.");
    } catch (e: any) {
      console.error(e);
      setError("فشل تفعيل رادار اليقظة الصوتية: " + e.message);
    }
  };

  const stopSilentAudioLoop = () => {
    if (silentIntervalRef.current) {
      clearInterval(silentIntervalRef.current);
      silentIntervalRef.current = null;
    }
    setIsSilentLoopActive(false);
    setSuccessMsg("تم إيقاف رادار اليقظة الصوتية بنجاح.");
    appendSystemSimulatorLog("تم إيقاف رادار اليقظة الصوتية (Background Audio Loop). قد يتجمد التطبيق إذا انطفأت الشاشة.");
  };

  // Re-acquire Wake Lock when visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const nav = navigator as any;
      if (isWakeLockActive && document.visibilityState === 'visible' && ('wakeLock' in nav)) {
        try {
          wakeLockRef.current = await nav.wakeLock.request('screen');
        } catch (err) {
          console.error("Re-acquiring wake lock failed:", err);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isWakeLockActive]);

  useEffect(() => {
    return () => {
      if (silentIntervalRef.current) {
        clearInterval(silentIntervalRef.current);
      }
    };
  }, []);

  // --- 2. Clock & Time Machine States ---
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSimulatingTime, setIsSimulatingTime] = useState<boolean>(false);
  const [simulatedHour, setSimulatedHour] = useState<number>(new Date().getHours());
  const [simulatedMinute, setSimulatedMinute] = useState<number>(new Date().getMinutes());

  // --- 3. Printer State ---
  const [printerConnecting, setPrinterConnecting] = useState<boolean>(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [printedTaskIds, setPrintedTaskIds] = useState<string[]>([]);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    connected: false,
    deviceName: null,
    lineWidth: 32, // 58mm
    density: 3,
    headerText: "مهامي اليومية ✦",
    footerText: "عش يومك بشغف وإنجاز!",
    autoPrintOnlyHigh: false,
    paperFeedLines: 4
  });

  // GATT Write characteristic reference
  const [bleCharacteristic, setBleCharacteristic] = useState<any | null>(null);
  const [bleDevice, setBleDevice] = useState<any | null>(null);

  // --- 4. Interactive Simulator Receipts & UI Tabs ---
  const [simulatorReceipts, setSimulatorReceipts] = useState<SimulatedReceipt[]>([]);
  const [activeTab, setActiveTab] = useState<"ai-planner" | "timeline" | "printer-hub">("ai-planner");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Manual Add Task Form
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualTime, setManualTime] = useState("08:00");
  const [manualEndTime, setManualEndTime] = useState("09:00");
  const [manualDesc, setManualDesc] = useState("");
  const [manualPriority, setManualPriority] = useState<"high" | "medium" | "low">("medium");

  // Audio Context Ref for simulated paper printing sound & notifications
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Premium Templates for Fast Generation
  const luxuryTemplates = [
    {
      label: "💼 روتين رائد أعمال متكامل",
      text: "الاستيقاظ الساعة 06:30 صباحاً لبدء روتين الرياضة والتأمل لـ 30 دقيقة، يليه فطور صحي خفيف. في الساعة 08:00 مراجعة وتحليل تقارير الأداء ومؤشرات الشركة. الساعة 10:00 تصفح البريد وعقد اجتماع الفريق الأسبوعي. الساعة 11:30 استراحة قهوة قصيرة لشحن الطاقة. من الساعة 12:00 ظهراً إلى 03:00 عصراً العمل الإبداعي المركز على تصميم المنتج الجديد وتطوير الميزات. من 04:00 عصراً إلى 06:00 م مراجعة مالية وتنسيق العقود والمستندات. مساءً من 07:30 تناول وجبة عائلية وقراءة كتاب في الإدارة قبل النوم."
    },
    {
      label: "🎨 يوم حافل لصناع المحتوى",
      text: "الاستيقاظ الساعة 08:00 صباحاً. إعداد قهوة الصباح وقراءة آخر الترندات والأخبار التقنية حتى 09:30 ص. من 10:00 ص إلى 01:00 م كتابة نص الحلقة الجديدة وتصميم المخطط الأساسي للفيديو. استراحة غداء وصلاة حتى 02:30 م. من 03:00 م إلى 06:00 م تصوير المشاهد والمراجعة الصوتية وتجربة الإضاءة. الساعة 07:00 م فرز اللقطات وبدء المونتاج الأولي وتصدير المسودة."
    },
    {
      label: "📚 خطة دراسة وبرمجة مركزة",
      text: "البدء الساعة 09:00 صباحاً بجلسة مراجعة خوارزميات وهياكل البيانات لـ ساعتين. في الساعة 11:30 البدء بتطبيق مشروع عملي بـ React و Tailwind ومحاكاة واجهات فاخرة حتى 02:30 م. استراحة غداء وقيلولة خفيفة لشحن التركيز. من 04:30 م إلى 07:00 م استكمال البرمجة واكتشاف الأخطاء ورفع الكود على GitHub. قراءة مقال تقني مفيد الساعة 08:30 م."
    }
  ];

  // --- Load Initial LocalStorage Data ---
  useEffect(() => {
    const savedTasks = localStorage.getItem("ai_p_tasks");
    const savedPrinted = localStorage.getItem("ai_p_printed");
    const savedCompleted = localStorage.getItem("ai_p_completed");
    const savedSettings = localStorage.getItem("ai_p_settings");
    const savedReceipts = localStorage.getItem("ai_p_receipts");

    if (savedTasks) {
      try { setTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); }
    }
    if (savedPrinted) {
      try { setPrintedTaskIds(JSON.parse(savedPrinted)); } catch (e) { console.error(e); }
    }
    if (savedCompleted) {
      try { setCompletedTaskIds(JSON.parse(savedCompleted)); } catch (e) { console.error(e); }
    }
    if (savedReceipts) {
      try { setSimulatorReceipts(JSON.parse(savedReceipts)); } catch (e) { console.error(e); }
    }
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPrinterSettings(prev => ({
          ...prev,
          lineWidth: parsed.lineWidth ?? 32,
          density: parsed.density ?? 3,
          headerText: parsed.headerText ?? "مهامي اليومية ✦",
          footerText: parsed.footerText ?? "عش يومك بشغف وإنجاز!",
          autoPrintOnlyHigh: parsed.autoPrintOnlyHigh ?? false,
          paperFeedLines: parsed.paperFeedLines ?? 4
        }));
      } catch (e) { console.error(e); }
    }
  }, []);

  // --- Save Changes to LocalStorage ---
  useEffect(() => {
    localStorage.setItem("ai_p_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("ai_p_printed", JSON.stringify(printedTaskIds));
  }, [printedTaskIds]);

  useEffect(() => {
    localStorage.setItem("ai_p_completed", JSON.stringify(completedTaskIds));
  }, [completedTaskIds]);

  useEffect(() => {
    localStorage.setItem("ai_p_receipts", JSON.stringify(simulatorReceipts));
  }, [simulatorReceipts]);

  // --- Time Tick Engine ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSimulatingTime) {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulatingTime]);

  // Handle Simulated time adjustments
  useEffect(() => {
    if (isSimulatingTime) {
      const simDate = new Date();
      simDate.setHours(simulatedHour);
      simDate.setMinutes(simulatedMinute);
      simDate.setSeconds(0);
      setCurrentTime(simDate);
    }
  }, [isSimulatingTime, simulatedHour, simulatedMinute]);

  const currentFormattedTime = useMemo(() => {
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [currentTime]);

  // --- Chronological Indicators ---
  const activeTask = useMemo(() => {
    if (tasks.length === 0) return null;
    return tasks.find(t => {
      return currentFormattedTime >= t.time && currentFormattedTime < t.endTime;
    }) || null;
  }, [tasks, currentFormattedTime]);

  const nextTask = useMemo(() => {
    if (tasks.length === 0) return null;
    const sorted = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
    return sorted.find(t => t.time.localeCompare(currentFormattedTime) > 0) || null;
  }, [tasks, currentFormattedTime]);

  // --- Automatic Printing Trigger Engine ---
  useEffect(() => {
    if (tasks.length === 0) return;

    // Check if any task is scheduled EXACTLY at this minute
    const matchingTask = tasks.find(t => t.time === currentFormattedTime);

    if (matchingTask) {
      const alreadyPrinted = printedTaskIds.includes(matchingTask.id);
      if (!alreadyPrinted) {
        // Run safety checks for auto print
        const meetsHighPriorityRule = !printerSettings.autoPrintOnlyHigh || matchingTask.priority === "high";
        const isAutoEnabledForThisTask = matchingTask.isAutoPrintEnabled !== false;

        if (autoPrintEnabled && isAutoEnabledForThisTask && meetsHighPriorityRule) {
          triggerPrintProcess(matchingTask, true);
        }
      }
    }
  }, [currentFormattedTime, tasks, autoPrintEnabled, printedTaskIds, printerSettings.autoPrintOnlyHigh]);

  // --- Premium Haptic & Mechanical Synthesizer ---
  const playSkeuomorphicPrintSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      // Let's create a realistic mechanical thermal paper feeding sound!
      // This is done by scheduling several short noise packets with a slight buzzing frequency.
      const bufferSize = ctx.sampleRate * 1.8; // 1.8 seconds sound duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // High pass white noise filtered to mimic needle/thermal pin burning paper
        const random = Math.random() * 2 - 1;
        // Introduce a cyclic motor hum at 120Hz
        const hum = Math.sin(2 * Math.PI * 120 * (i / ctx.sampleRate));
        // Add random dust crackles
        const motorPulsing = Math.floor(i / 1500) % 2 === 0 ? 0.4 : 0.05;
        data[i] = (random * 0.12 + hum * 0.03) * motorPulsing;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass Filter to make it sound "thin" and "mechanical" like a small pocket device
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800;
      filter.Q.value = 1.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
    } catch (e) {
      console.error("Synthesizer error:", e);
    }
  };

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12); // E6

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Real BLE Bluetooth Web Bluetooth Connection Hub ---
  const handlePairBLEDevice = async () => {
    setPrinterConnecting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        setShowPwaGuide(true);
        throw new Error("متصفحك الحالي أو بيئة الـ WebView داخل الـ APK لا تدعم البلوتوث بسبب قيود الحماية لنظام أندرويد. تم فتح دليل التثبيت الذكي (PWA) بالأسفل لتشغيل البرنامج كتطبيق مستقل متكامل وبلوتوث يعمل 100%!");
      }

      // Request device with typical printer characteristics
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS
          "0000ff00-0000-1000-8000-00805f9b34fb", // Goojprt / Paperang
          "e7e1a000-012c-11e2-892e-0800200c9a66"  // Portable print service
        ]
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("فشل الاتصال بجهاز GATT. تأكد من تشغيل الطابعة وقربها من الهاتف.");

      const services = await server.getPrimaryServices();
      let foundChar: any = null;

      // Scan characteristics to find writing permissions
      for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            foundChar = char;
            break;
          }
        }
        if (foundChar) break;
      }

      if (!foundChar) {
        throw new Error("تم الاقتران بنجاح، ولكن لم نعثر على قناة كتابة ESC/POS متوافقة مع الطابعة.");
      }

      setBleDevice(device);
      setBleCharacteristic(foundChar);
      setPrinterSettings(prev => ({
        ...prev,
        connected: true,
        deviceName: device.name || "طابعة BLE الحرارية"
      }));

      playSuccessChime();
      setSuccessMsg(`تم بنجاح ربط واقتران الطابعة الحرارية: ${device.name || "BLE Printer"}`);
      appendSystemSimulatorLog(`تم توصيل الطابعة الحرارية الحقيقية ✓\nالاسم المكتشف: ${device.name || "طابعة لاسلكية"}\nبروتوكول الاتصال: GATT Serial Write`);

      // Add listener for unexpected disconnection
      device.addEventListener("gattserverdisconnected", () => {
        setBleDevice(null);
        setBleCharacteristic(null);
        setPrinterSettings(prev => ({
          ...prev,
          connected: false,
          deviceName: null
        }));
        setError("انقطع الاتصال بالطابعة الحرارية اللاسلكية.");
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء الاتصال بالبلوتوث.");
    } finally {
      setPrinterConnecting(false);
    }
  };

  const handleDisconnectBLE = () => {
    if (bleDevice && bleDevice.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleDevice(null);
    setBleCharacteristic(null);
    setPrinterSettings(prev => ({
      ...prev,
      connected: false,
      deviceName: null
    }));
    setSuccessMsg("تم فصل الطابعة الحرارية بنجاح.");
    appendSystemSimulatorLog("تم إلغاء اقتران الطابعة الحرارية وتعمل الآن في وضع المحاكاة الافتراضي.");
  };

  // Write commands in safe 20-byte chunks
  const transmitBluetoothData = async (data: Uint8Array) => {
    if (!bleCharacteristic) return;
    const size = 20;
    for (let i = 0; i < data.length; i += size) {
      const chunk = data.slice(i, i + size);
      await bleCharacteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 35));
    }
  };

  // --- Real-time Generation from Gemini via Local server ---
  const handleGenerateAISchedule = async () => {
    if (!planInput.trim()) {
      setError("من فضلك اكتب أفكارك اليومية أو جدولك البسيط لنقوم بتصنيفه بدقة.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planInput,
          localTime: currentFormattedTime
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "فشل الخادم في الاتصال بمحرك الذكاء الاصطناعي.");
      }

      const data = await response.json();
      if (data && Array.isArray(data.tasks)) {
        const withAuto = data.tasks.map((t: any) => ({
          ...t,
          isAutoPrintEnabled: true
        }));
        setTasks(withAuto);
        setPrintedTaskIds([]);
        setSuccessMsg(`تم إنتاج ${withAuto.length} مهمة فائقة الدقة بتنسيق متناسق وجاهزة للطباعة!`);
        appendSystemSimulatorLog(`تم استلام خطة عمل ذكية جديدة بـ ${withAuto.length} مهمة يومية.`);
        playSuccessChime();
        setActiveTab("timeline"); // Automatic visual switch to timeline
      } else {
        throw new Error("صيغة الاستجابة الواردة من الذكاء الاصطناعي لم تكن متوافقة.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "فشل في معالجة طلب الجدولة الذكية.");
    } finally {
      setLoading(false);
    }
  };

  // --- Printing Sequence Trigger (Simulated + Real) ---
  const triggerPrintProcess = async (task: Task, isAuto: boolean = false) => {
    try {
      // 1. Buzz motor sound effect
      playSkeuomorphicPrintSound();

      // 2. Generate text layout simulation
      const w = printerSettings.lineWidth;
      const divider = "-".repeat(w);
      const head = printerSettings.headerText || "مهامي اليومية ✦";
      const foot = printerSettings.footerText || "عش يومك بشغف وإنجاز!";

      const textLines: string[] = [];
      textLines.push(centerAlign(head, w));
      textLines.push(divider);
      textLines.push(`البدء: ${task.time}`);
      textLines.push(`النهاية: ${task.endTime}`);
      textLines.push(`المدة: ${task.duration} دقيقة`);
      textLines.push(divider);
      
      // Shaped title in brackets
      textLines.push(centerAlign(`[ ${task.title} ]`, w));
      
      const pAr = task.priority === "high" ? "أهمية قصوى !!!" : task.priority === "medium" ? "أهمية متوسطة" : "أهمية عادية";
      textLines.push(`الأولوية: ${pAr}`);
      textLines.push(divider);

      // Description lines wrapping
      const wrappedDesc = wrapArabicLines(task.description, w);
      wrappedDesc.forEach(line => textLines.push(line));

      textLines.push(divider);
      textLines.push(centerAlign(foot, w));

      // Timestamp
      const stamp = new Date();
      const timeStampStr = `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, "0")}-${String(stamp.getDate()).padStart(2, "0")} ${String(stamp.getHours()).padStart(2, "0")}:${String(stamp.getMinutes()).padStart(2, "0")}`;
      textLines.push(centerAlign(timeStampStr, w));

      const newReceipt: SimulatedReceipt = {
        id: `${task.id}-${Date.now()}`,
        title: task.title,
        timeStr: task.time,
        endTimeStr: task.endTime,
        priority: task.priority,
        description: task.description,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        textLines: textLines
      };

      setSimulatorReceipts(prev => [newReceipt, ...prev]);

      // 3. Physical printing command via Web Bluetooth
      if (printerSettings.connected && bleCharacteristic) {
        const binaryCommands = buildEscPosReceipt(
          task.title,
          task.time,
          task.endTime,
          task.priority,
          task.description,
          printerSettings.lineWidth,
          printerSettings.density,
          printerSettings.headerText,
          printerSettings.footerText
        );
        await transmitBluetoothData(binaryCommands);
      }

      // 4. Update Printed registry to avoid loops
      if (!printedTaskIds.includes(task.id)) {
        setPrintedTaskIds(prev => [...prev, task.id]);
      }

      setSuccessMsg(isAuto ? `طباعة تلقائية جارية الآن: ${task.title}` : `تم إرسال المهمة للطابعة: ${task.title}`);
    } catch (err: any) {
      console.error(err);
      setError(`تعذرت الطباعة للمهمة "${task.title}": ${err.message}`);
    }
  };

  // Helper text layout
  function centerAlign(text: string, width: number): string {
    if (text.length >= width) return text;
    const padding = Math.floor((width - text.length) / 2);
    return " ".repeat(padding) + text + " ".repeat(width - text.length - padding);
  }

  function wrapArabicLines(text: string, limit: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      if (current === "") {
        current = word;
      } else if ((current + " " + word).length <= limit) {
        current += " " + word;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current !== "") {
      lines.push(current);
    }
    return lines;
  }

  const appendSystemSimulatorLog = (message: string) => {
    const w = printerSettings.lineWidth;
    const divider = "*".repeat(w);
    const textLines = [
      divider,
      centerAlign("إشعار النظام", w),
      divider,
      ...wrapArabicLines(message, w),
      divider,
      centerAlign(new Date().toLocaleTimeString("ar-EG"), w)
    ];

    const sysReceipt: SimulatedReceipt = {
      id: `sys-${Date.now()}`,
      title: "إشعار نظام",
      timeStr: "--:--",
      endTimeStr: "--:--",
      priority: "low",
      description: message,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      textLines: textLines
    };

    setSimulatorReceipts(prev => [sysReceipt, ...prev]);
  };

  // Delete simulated printed slip
  const handleDeleteReceiptSlip = (id: string) => {
    setSimulatorReceipts(prev => prev.filter(r => r.id !== id));
  };

  // Clear simulated prints history
  const handleClearAllSimulatorReceipts = () => {
    setSimulatorReceipts([]);
    localStorage.removeItem("ai_p_receipts");
  };

  // Manual Add submit
  const handleCreateManualTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const [sh, sm] = manualTime.split(":").map(Number);
    const [eh, em] = manualEndTime.split(":").map(Number);
    let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (durationMinutes < 0) durationMinutes += 24 * 60; // over midnight

    const newTask: Task = {
      id: `manual-${Date.now()}`,
      title: manualTitle,
      time: manualTime,
      endTime: manualEndTime,
      duration: durationMinutes,
      description: manualDesc || "مهمة مضافة بشكل يدوي ومجدولة.",
      priority: manualPriority,
      isAutoPrintEnabled: true
    };

    setTasks(prev => {
      const updated = [...prev, newTask].sort((a, b) => a.time.localeCompare(b.time));
      return updated;
    });

    setManualTitle("");
    setManualDesc("");
    setShowManualForm(false);
    playSuccessChime();
    setSuccessMsg(`تم إدراج المهمة المخصصة "${newTask.title}" بنجاح.`);
  };

  // Toggle dynamic complete status
  const handleToggleTaskCompleted = (id: string) => {
    setCompletedTaskIds(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem("ai_p_completed", JSON.stringify(next));
      return next;
    });
  };

  // Delete task from list
  const handleDeleteSingleTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setPrintedTaskIds(prev => prev.filter(pId => pId !== id));
    setCompletedTaskIds(prev => prev.filter(cId => cId !== id));
  };

  // Wipe schedule
  const handleClearTaskSchedule = () => {
    if (window.confirm("هل ترغب بالفعل في مسح جدول مهام اليوم بالكامل؟")) {
      setTasks([]);
      setPrintedTaskIds([]);
      setCompletedTaskIds([]);
      localStorage.removeItem("ai_p_tasks");
      localStorage.removeItem("ai_p_printed");
      localStorage.removeItem("ai_p_completed");
      setSuccessMsg("تم تصفير الجدول وإفراغه.");
    }
  };

  // Copy simulated ticket raw text
  const handleCopyReceiptText = (lines: string[]) => {
    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    setSuccessMsg("تم نسخ نص الإيصال بالكامل إلى الحافظة!");
  };

  const handleSelectTemplate = (text: string) => {
    setPlanInput(text);
    playSuccessChime();
  };

  const handleToggleTaskAutoPrint = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          isAutoPrintEnabled: t.isAutoPrintEnabled === false ? true : false
        };
      }
      return t;
    }));
  };

  const handleTestPrint = async () => {
    playSkeuomorphicPrintSound();
    
    const w = printerSettings.lineWidth;
    const divider = "=".repeat(w);
    const textLines = [
      divider,
      centerAlign("ورقة اختبار الاتصال", w),
      divider,
      `عرض الحقول: ${w} حرف`,
      `الوضوح المختار: ${printerSettings.density}`,
      `الحالة: جاهز ومحاكى بنجاح`,
      divider,
      centerAlign("AISTUDIO PRINT ENGINE v2.0", w),
      divider
    ];

    const testReceipt: SimulatedReceipt = {
      id: `test-${Date.now()}`,
      title: "ورقة اختبار الاتصال",
      timeStr: "--:--",
      endTimeStr: "--:--",
      priority: "low",
      description: "اختبار الطابعة والتواصل اللاسلكي الفاخر.",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      textLines: textLines
    };

    setSimulatorReceipts(prev => [testReceipt, ...prev]);

    if (printerSettings.connected && bleCharacteristic) {
      // Create a basic testing command list
      const commandBytes = buildEscPosReceipt(
        "اختبار الطابعة",
        "00:00",
        "00:00",
        "low",
        "ورقة اختبار الاتصال الناجح.",
        printerSettings.lineWidth,
        printerSettings.density,
        printerSettings.headerText,
        printerSettings.footerText
      );
      await transmitBluetoothData(commandBytes);
    }
    setSuccessMsg("تمت طباعة ورقة الاختبار والمحاكاة بنجاح.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-500/20 selection:text-brand-900 antialiased overflow-x-hidden flex flex-col justify-between" dir="rtl">
      
      {/* Decorative Aurora Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-radial from-brand-500/10 via-brand-200/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* --- Main Mobile Shell Frame Wrapper --- */}
      <div className="flex-1 w-full max-w-lg mx-auto bg-white border-x border-slate-100 shadow-2xl relative flex flex-col min-h-screen">
        
        {/* Sleek Dynamic Island / Top-Bar Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 p-4 pb-3 flex flex-col gap-3">
          
          {/* Header Main row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-500 rounded-xl text-white shadow-lg shadow-brand-500/20">
                <Printer className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-1.5">
                  منظم المهام الذكي
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">الذكاء الاصطناعي مدمج بالطابعة الحرارية</p>
              </div>
            </div>
 
            {/* Global Settings & Toggles */}
            <div className="flex items-center gap-1.5">
              
              {/* Sound Bell Toggle */}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg border transition-all ${
                  soundEnabled 
                    ? "bg-brand-50 border-brand-200 text-brand-600" 
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
                title={soundEnabled ? "إيقاف الصوت التنبيهي" : "تفعيل الصوت التنبيهي"}
              >
                {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
              </button>
 
              {/* Device Bluetooth Pair Trigger */}
              <button
                onClick={printerSettings.connected ? handleDisconnectBLE : handlePairBLEDevice}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                  printerSettings.connected
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                <Bluetooth className={`w-3.5 h-3.5 ${printerSettings.connected ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
                <span>{printerSettings.connected ? "متصل" : "اقتران طابعة"}</span>
              </button>
 
            </div>
          </div>
 
          {/* Real-time Task HUD Stats */}
          <div className="grid grid-cols-12 gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
            {/* Clock Widget */}
            <div className="col-span-5 flex items-center gap-2 border-l border-slate-200 pr-1">
              <Clock className="w-4 h-4 text-brand-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-slate-900 tracking-wider">
                  {currentTime.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                </span>
                <span className="text-[9px] text-slate-400">التوقيت المحلي</span>
              </div>
            </div>
 
            {/* Current Active Task Status widget */}
            <div className="col-span-7 flex items-center gap-2 pl-1">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-slate-400 block font-medium">النشاط الجاري الآن</span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {activeTask ? activeTask.title : "لا يوجد مهام حالية"}
                </p>
              </div>
            </div>
          </div>
 
        </header>
        {/* --- Top Global Alerts Container --- */}
        <div className="px-4 mt-2">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-800 p-3 rounded-2xl flex items-start gap-2.5 text-xs mb-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-700">تنبيه النظام</p>
                  <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold px-1 text-sm">×</button>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-brand-50 border border-brand-200 text-brand-800 p-3 rounded-2xl flex items-start gap-2.5 text-xs"
              >
                <CheckCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] text-brand-700 font-medium">{successMsg}</p>
                </div>
                <button onClick={() => setSuccessMsg(null)} className="text-brand-500 hover:text-brand-700 font-bold px-1 text-sm">×</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Main Phone View Scrolling Area --- */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-6">
          
          {/* Tab Selection Header Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setActiveTab("ai-planner")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "ai-planner"
                  ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/15"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>مخطط الذكاء ✦</span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "timeline"
                  ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/15"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>المهام اليومية</span>
              {tasks.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  activeTab === "timeline" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {tasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("printer-hub")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "printer-hub"
                  ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/15"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>الطابعة والمحاكي</span>
              {simulatorReceipts.length > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "printer-hub" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {simulatorReceipts.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: AI Planner Interface */}
          {activeTab === "ai-planner" && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Main AI Box */}
              <div className="bg-gradient-to-b from-brand-50/50 to-white border border-brand-100 rounded-3xl p-5 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl" />
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-brand-100 text-brand-600 rounded-lg">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">تحويل خطتك اليومية لجدول دقيق</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  اكتب روتينك أو خطة يومك غير المرتبة بكلماتك البسيطة. وسيقوم الذكاء الاصطناعي ببناء جدول زمني مقسم بالساعات والدقائق، مفرز وجاهز للطباعة الحرارية التلقائية فور موعد كل مهمة!
                </p>

                {/* Text Area */}
                <div className="relative bg-white border border-slate-200 focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/10 rounded-2xl p-3.5 transition-all">
                  <textarea
                    value={planInput}
                    onChange={(e) => setPlanInput(e.target.value)}
                    placeholder="مثال: أصحو الساعة 7 الصبح ثم تمارين نصف ساعة وفطور، بعدين ببرمج لـ 3 ساعات بتركيز عالي، العصر بروح الجيم وبالمستندات، والمساء قراءة كتاب وهدوء..."
                    className="w-full h-36 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-hidden resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2 border-t border-slate-100 pt-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {planInput.length} حرف
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlanInput("")}
                      className="text-[10px] text-slate-400 hover:text-slate-600 transition-all"
                    >
                      مسح النص
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  onClick={handleGenerateAISchedule}
                  disabled={loading || !planInput.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 text-white font-bold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-500/15 cursor-pointer hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 premium-pulse-btn"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري المعالجة والجدولة الفائقة...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-white text-white" />
                      <span>جدولة وترتيب المهام بالذكاء الاصطناعي ✦</span>
                    </>
                  )}
                </button>
              </div>

              {/* Template Pill Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block px-1">نماذج تخطيط احترافية معدة مسبقاً:</span>
                <div className="grid grid-cols-1 gap-2">
                  {luxuryTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectTemplate(template.text)}
                      className={`text-right p-3 rounded-2xl border transition-all text-xs flex flex-col gap-1 ${
                        planInput === template.text
                          ? "bg-brand-50 border-brand-200 text-brand-800"
                          : "bg-slate-50/50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-bold text-[11px] text-brand-600">{template.label}</span>
                      <p className="text-[10px] text-slate-500 truncate w-full">{template.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Educational info panel */}
              <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-[11px] font-bold text-slate-700">كيف تعمل طابعة المهام؟</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    يقوم التطبيق بمراقبة الوقت بشكل مستمر لحظة بلحظة. فور حلول الساعة المحددة لأي مهمة، يقوم النظام بإصدار تنبيه صوتي وإرسال إيصال المهمة مصاغاً باللغة العربية الصحيحة ومعدلاً للطباعة الحرارية المباشرة إلى طابعتك عبر البلوتوث تلقائياً!
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Dynamic Timeline & Tasks schedule */}
          {activeTab === "timeline" && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Current Time Machine Simulator Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl flex flex-col gap-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-800">التحكم في الوقت (لتجربة الطباعة الفورية)</span>
                  </div>
                  
                  {/* Toggle button */}
                  <button
                    onClick={() => setIsSimulatingTime(!isSimulatingTime)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${
                      isSimulatingTime 
                        ? "bg-brand-600 text-white" 
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {isSimulatingTime ? "تعطيل المحاكاة" : "تفعيل المحاكاة"}
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  يمكنك تحويل الوقت لوضع المحاكاة وتقديم الدقائق لكي يتطابق وقت التطبيق الحالي مع وقت بدء إحدى مهامك، لتشهد انطلاق التنبيه الصوتي الحركي والطباعة الفورية على الطابعة الورقية فوراً!
                </p>

                {isSimulatingTime && (
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 font-bold mb-1">ساعة</span>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={simulatedHour}
                          onChange={(e) => setSimulatedHour(Math.max(0, Math.min(23, Number(e.target.value))))}
                          className="w-10 bg-slate-50 text-center rounded-lg border border-slate-200 p-1 font-mono text-xs font-bold text-slate-800 focus:border-brand-500 outline-hidden"
                        />
                      </div>
                      <span className="text-brand-500 font-bold text-xs mt-3">:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 font-bold mb-1">دقيقة</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={simulatedMinute}
                          onChange={(e) => setSimulatedMinute(Math.max(0, Math.min(59, Number(e.target.value))))}
                          className="w-10 bg-slate-50 text-center rounded-lg border border-slate-200 p-1 font-mono text-xs font-bold text-slate-800 focus:border-brand-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSimulatedMinute(prev => {
                            if (prev === 59) {
                              setSimulatedHour(h => (h + 1) % 24);
                              return 0;
                            }
                            return prev + 1;
                          });
                        }}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl transition-all"
                      >
                        + 1 دقيقة
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date();
                          setSimulatedHour(d.getHours());
                          setSimulatedMinute(d.getMinutes());
                        }}
                        className="text-[9px] text-slate-500 hover:text-slate-800 font-bold underline px-1"
                      >
                        الآن
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks schedule header with controllers */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">المهام اليومية المنسقة</h4>
                  <p className="text-[10px] text-slate-500">مجدولة تلقائياً بدقة بالترتيب الزمني</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-500" />
                    <span>إضافة مهمة</span>
                  </button>

                  {tasks.length > 0 && (
                    <button
                      onClick={handleClearTaskSchedule}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 rounded-xl transition-all"
                      title="تصفير الجدول"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Manual Task Add Modal/Form in timeline */}
              <AnimatePresence>
                {showManualForm && (
                  <motion.form
                    onSubmit={handleCreateManualTaskSubmit}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-3xl gap-3 grid grid-cols-2 relative overflow-hidden"
                  >
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">اسم النشاط</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: مراجعة الشفرة البرمجية مع الفريق"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">وقت البدء</label>
                      <input
                        type="time"
                        required
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">وقت الانتهاء</label>
                      <input
                        type="time"
                        required
                        value={manualEndTime}
                        onChange={(e) => setManualEndTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-hidden font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">مستوى الأهمية (الأولوية)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["high", "medium", "low"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setManualPriority(p)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              manualPriority === p
                                ? p === "high"
                                  ? "bg-rose-50 border-rose-300 text-rose-700"
                                  : p === "medium"
                                  ? "bg-amber-50 border-amber-300 text-amber-700"
                                  : "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-500"
                            }`}
                          >
                            {p === "high" ? "قصوى" : p === "medium" ? "متوسطة" : "عادية"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">وصف تفصيلي للمهمة للطباعة</label>
                      <textarea
                        placeholder="اكتب تفاصيل أو نصائح تود رؤيتها مطبوعة على الورقة الحرارية..."
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        className="w-full h-20 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-hidden resize-none leading-relaxed"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-2 mt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                      >
                        حفظ النشاط
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualForm(false)}
                        className="flex-1 bg-slate-100 text-slate-500 text-xs py-2.5 rounded-xl border border-slate-200 hover:text-slate-700 hover:bg-slate-200 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>

                  </motion.form>
                )}
              </AnimatePresence>

              {/* Chronological List of Cards */}
              {tasks.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 border border-slate-200/80 rounded-3xl p-6">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
                  <h5 className="text-xs font-bold text-slate-700">لا توجد مهام حالية لليوم</h5>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    اكتب خطتك اليومية بالذكاء الاصطناعي في التبويب الأول أو اضغط على زر "إضافة مهمة" لبدء جدولة أوقاتك بدقة.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:right-[15px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200">
                  {tasks.map((task, idx) => {
                    const isCompleted = completedTaskIds.includes(task.id);
                    const isCurrent = currentFormattedTime >= task.time && currentFormattedTime < task.endTime;
                    const isUpcoming = task.time.localeCompare(currentFormattedTime) > 0;
                    const isPast = task.endTime.localeCompare(currentFormattedTime) <= 0;
                    const hasPrinted = printedTaskIds.includes(task.id);

                    // Choose priority badge design
                    const priorityStyle = 
                      task.priority === "high" 
                        ? "bg-rose-50 border-rose-200 text-rose-700" 
                        : task.priority === "medium"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700";

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group relative pr-8 pl-4 py-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? "bg-gradient-to-l from-brand-50/80 to-brand-50/20 border-brand-300 shadow-xs shadow-brand-500/5 ring-1 ring-brand-500/10"
                            : isCompleted
                            ? "bg-slate-50 border-slate-100 opacity-60"
                            : "bg-white border-slate-100 hover:border-slate-200/80 shadow-xs"
                        }`}
                      >
                        
                        {/* Status timeline dot */}
                        <div className={`absolute right-[7px] top-[22px] w-4.5 h-4.5 rounded-full border-4 bg-white z-10 transition-all flex items-center justify-center ${
                          isCompleted
                            ? "border-emerald-500 bg-emerald-50"
                            : isCurrent
                            ? "border-brand-500 bg-brand-50 animate-pulse"
                            : "border-slate-200 bg-slate-50"
                        }`} />

                        {/* Card Header row with time and priority */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-800 tracking-wider">
                              {task.time} - {task.endTime}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">({task.duration} د)</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${priorityStyle}`}>
                              {task.priority === "high" ? "قصوى" : task.priority === "medium" ? "متوسطة" : "عادية"}
                            </span>

                            {hasPrinted && (
                              <span className="text-[8px] bg-emerald-50 border border-emerald-200/40 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                                <Check className="w-2 h-2" />
                                مطبوع
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content area */}
                        <div className="mt-1.5">
                          <h4 className={`text-[13px] font-bold ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {task.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Interactive operations bar */}
                        <div className="mt-3.5 border-t border-slate-100 pt-2.5 flex items-center justify-between gap-3">
                          
                          {/* Completion toggle */}
                          <button
                            onClick={() => handleToggleTaskCompleted(task.id)}
                            className={`flex items-center gap-1.5 text-[10px] font-bold transition-all ${
                              isCompleted
                                ? "text-emerald-600 hover:text-emerald-500"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            <CheckCircle className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-500 fill-emerald-500/10" : "text-slate-300"}`} />
                            <span>{isCompleted ? "مكتمل" : "تحديد كمكتمل"}</span>
                          </button>

                          {/* Print manually button */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => triggerPrintProcess(task, false)}
                              className="bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 font-bold text-[10px] py-1 px-2.5 rounded-xl border border-slate-200 hover:border-transparent transition-all flex items-center gap-1"
                              title="اطبع المهمة بشكل فردي"
                            >
                              <Printer className="w-3 h-3" />
                              <span>طباعة الإيصال</span>
                            </button>

                            <button
                              onClick={() => handleToggleTaskAutoPrint(task.id)}
                              className={`p-1 rounded-lg border transition-all ${
                                task.isAutoPrintEnabled !== false
                                  ? "bg-brand-50 border-brand-200 text-brand-600"
                                  : "bg-slate-100 border-slate-200 text-slate-400"
                              }`}
                              title={task.isAutoPrintEnabled !== false ? "الطباعة التلقائية مفعلة لهذه المهمة" : "الطباعة التلقائية معطلة لهذه المهمة"}
                            >
                              <Bell className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleDeleteSingleTask(task.id)}
                              className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-600 hover:text-rose-700 transition-all ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Printer Hub & Customizer */}
          {activeTab === "printer-hub" && (
            <div className="space-y-5 animate-fadeIn">

              {/* PWA & WebView Troubleshooting Guide Card */}
              <div className={`border rounded-3xl p-5 transition-all duration-300 ${
                showPwaGuide 
                  ? "bg-brand-50/70 border-brand-300 shadow-md ring-2 ring-brand-500/10" 
                  : "bg-white border-slate-200 shadow-xs"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${showPwaGuide ? "bg-brand-500 text-white animate-pulse" : "bg-slate-100 text-slate-500"}`}>
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">تشغيل البلوتوث عبر الهواتف الذكية</h4>
                      <p className="text-[10px] text-slate-500 font-medium">دليل التثبيت الذكي وتجاوز قيود أنظمة التشغيل</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowPwaGuide(!showPwaGuide)}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 px-2.5 py-1 rounded-lg transition-all"
                  >
                    {showPwaGuide ? "إخفاء التفاصيل" : "عرض الدليل"}
                  </button>
                </div>

                <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 space-y-3 font-sans">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[11px]">
                    <span className="text-slate-500 font-medium">البيئة الحالية المكتشفة:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      !(navigator as any).bluetooth 
                        ? "text-rose-600" 
                        : "text-emerald-600"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${!(navigator as any).bluetooth ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                      {!(navigator as any).bluetooth ? "تطبيق APK / WebView (البلوتوث محظور ⚠️)" : "متصفح يدعم البلوتوث (نشط ✦)"}
                    </span>
                  </div>

                  {showPwaGuide && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        نظام أندرويد يحظر تشغيل الـ <strong>Web Bluetooth</strong> تماماً داخل متصفحات الـ WebView المدمجة في ملفات الـ APK لأسباب أمنية. لتشغيل الطابعة والاقتران بها بنجاح، يجب تشغيل التطبيق كـ <strong>تطبيق ويب تقدمي (PWA)</strong> عبر الخطوات البسيطة التالية:
                      </p>

                      <div className="bg-white border border-slate-150 rounded-2xl p-3.5 space-y-3">
                        <h5 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-brand-600" />
                          <span>طريقة التثبيت المباشرة (خلال دقيقة واحدة):</span>
                        </h5>

                        <div className="space-y-3">
                          {/* Step 1 */}
                          <div className="flex items-start gap-2.5 text-[11.5px] text-slate-700">
                            <span className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">١</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold">انسخ رابط هذا الموقع المباشر:</p>
                              <div className="flex items-center gap-1.5 mt-1 max-w-full">
                                <code className="bg-slate-150 border border-slate-200 px-2 py-1 rounded-md font-mono text-[9px] text-slate-600 select-all truncate block">
                                  {window.location.origin}
                                </code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin);
                                    setSuccessMsg("تم نسخ الرابط بنجاح! الصقه الآن في متصفح Chrome بهاتفك.");
                                  }}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-all text-slate-500 shrink-0"
                                  title="نسخ الرابط"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="flex items-start gap-2.5 text-[11.5px] text-slate-700">
                            <span className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">٢</span>
                            <div>
                              <p className="font-bold">افتح متصفح Google Chrome أو Microsoft Edge على هاتفك والصق الرابط هناك.</p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="flex items-start gap-2.5 text-[11.5px] text-slate-700">
                            <span className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">٣</span>
                            <div>
                              <p className="font-bold">اضغط على زر الخيارات (النقاط الثلاثة ⠇) أو أيقونة التحميل في شريط العنوان.</p>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="flex items-start gap-2.5 text-[11.5px] text-slate-700">
                            <span className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">٤</span>
                            <div>
                              <p className="font-bold">اختر <span className="text-brand-600 font-bold">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</span> أو <span className="text-brand-600 font-bold">"تثبيت التطبيق" (Install App)</span>.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic installation button if prompt is available */}
                      {showInstallPrompt && deferredPrompt && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={triggerPwaInstallation}
                          className="w-full bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-brand-500/10 transition-all flex items-center justify-center gap-2 active:scale-98"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تثبيت كـ تطبيق مستقل ومباشر على الهاتف الآن</span>
                        </motion.button>
                      )}

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 text-[10.5px] text-slate-600 leading-relaxed">
                        <strong className="text-emerald-800 font-bold block mb-1">💡 لماذا تطبيق الـ PWA أفضل من الـ APK؟</strong>
                        <ul className="list-disc pr-3 space-y-1">
                          <li>يعمل بملء الشاشة بالكامل وبشكل مستقل مثل أي تطبيق تم تنزيله.</li>
                          <li><strong>يدعم البلوتوث والاقتران بالطابعة الحرارية بشكل كامل 100%</strong> دون أي قيود نظام أندرويد.</li>
                          <li>يتلقى التحديثات والميزات الجديدة تلقائياً فور صدورها دون الحاجة لإعادة تنزيل ملفات APK.</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Virtual Skeuomorphic Thermal Printer Live simulator */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col items-center">
                
                <div className="absolute top-2 left-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] text-slate-500 font-mono">Sim Active</span>
                </div>

                {/* 3D printer slot illustration */}
                <div className="w-full max-w-xs bg-slate-100 rounded-2xl p-4 border border-slate-250 shadow-inner flex flex-col items-center relative">
                  
                  {/* Status lights & brand mockup */}
                  <div className="flex items-center justify-between w-full mb-2 px-1">
                    <span className="text-[8px] font-mono text-slate-400 tracking-widest font-bold">AISTUDIO BLE-58T</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${printerSettings.connected ? "bg-emerald-500" : "bg-red-500"} shadow-md`} />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-md" />
                    </div>
                  </div>

                  {/* Physical Paper Slot Cutter cutout */}
                  <div className="w-full h-3 bg-slate-200 border-y border-slate-300 rounded-md relative shadow-inner overflow-hidden">
                    <div className="absolute inset-x-0 top-0.5 h-[1px] bg-slate-400" />
                  </div>

                  {/* Paper Roll out area */}
                  <div className="w-full bg-slate-50/40 rounded-b-xl overflow-hidden p-2 flex flex-col items-center min-h-[160px] max-h-[300px] overflow-y-auto mt-1 relative scrollbar-none">
                    
                    <AnimatePresence>
                      {simulatorReceipts.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-10 text-slate-400 flex flex-col items-center gap-2"
                        >
                          <FileText className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                          <span className="text-[10px] font-bold">لا توجد قصاصات مطبوعة حالياً</span>
                          <span className="text-[9px] text-slate-400">قم بطباعة أي مهمة لتظهر هنا فوراً</span>
                        </motion.div>
                      ) : (
                        <div className="w-full space-y-4">
                          {simulatorReceipts.map((receipt) => (
                            <motion.div
                              key={receipt.id}
                              initial={{ opacity: 0, y: -40, scaleY: 0.1 }}
                              animate={{ opacity: 1, y: 0, scaleY: 1 }}
                              transition={{ duration: 0.4 }}
                              className="w-full paper-tear p-4 shadow-lg text-slate-900 rounded-t-sm select-all font-mono text-[9px] leading-relaxed border border-gray-100 flex flex-col gap-1 relative text-right"
                              style={{ fontFamily: "monospace", direction: "rtl" }}
                            >
                              
                              {/* Slips action utility overlays on hover */}
                              <div className="absolute top-2 left-2 flex items-center gap-1.5 select-none print:hidden">
                                <button
                                  onClick={() => handleCopyReceiptText(receipt.textLines)}
                                  className="p-1 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-800 rounded-lg transition-all"
                                  title="نسخ النص"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReceiptSlip(receipt.id)}
                                  className="p-1 bg-gray-100 hover:bg-rose-100 text-gray-700 hover:text-rose-800 rounded-lg transition-all"
                                  title="تمزيق قصاصة الورق"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Formatted POS print output lines */}
                              {receipt.textLines.map((line, lIdx) => (
                                <div 
                                  key={lIdx} 
                                  className="whitespace-pre font-mono text-[8px] tracking-normal font-medium"
                                  style={{ letterSpacing: "-0.5px" }}
                                >
                                  {line}
                                </div>
                              ))}

                              {/* Simulation meta */}
                              <div className="mt-2 text-[7px] text-gray-400 text-center select-none border-t border-dashed border-gray-200 pt-1.5">
                                تم توليدها بالذكاء الاصطناعي ✦ وقت الطباعة: {receipt.timestamp}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>

                  </div>

                </div>

                {/* Simulated printer clear button */}
                {simulatorReceipts.length > 0 && (
                  <button
                    onClick={handleClearAllSimulatorReceipts}
                    className="mt-3 text-[10px] text-slate-500 hover:text-rose-600 font-bold transition-all underline animate-fadeIn"
                  >
                    تنظيف أرشيف المخرجات الورقية
                  </button>
                )}
              </div>

              {/* Real BLE Hardware Settings Form */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4.5 h-4.5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-900">إعدادات وضبط وتنسيق الطابعة</h4>
                </div>

                <div className="space-y-4">
                  {/* Header text customizer */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1.5">عنوان رأس الإيصال (Header Text)</label>
                    <input
                      type="text"
                      value={printerSettings.headerText}
                      onChange={(e) => setPrinterSettings(prev => ({ ...prev, headerText: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-hidden"
                    />
                  </div>

                  {/* Footer text customizer */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1.5">تذييل الإيصال (Footer Text)</label>
                    <input
                      type="text"
                      value={printerSettings.footerText}
                      onChange={(e) => setPrinterSettings(prev => ({ ...prev, footerText: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-hidden"
                    />
                  </div>

                  {/* Column configuration & paper density info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5">عرض الورقة (أحرف/أعمدة)</label>
                      <select
                        value={printerSettings.lineWidth}
                        onChange={(e) => setPrinterSettings(prev => ({ ...prev, lineWidth: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 outline-hidden font-mono"
                      >
                        <option value={32}>32 حرف (طابعة 58mm القياسية)</option>
                        <option value={48}>48 حرف (طابعة 80mm الكبيرة)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1.5">درجة سواد الطباعة (Density)</label>
                      <select
                        value={printerSettings.density}
                        onChange={(e) => setPrinterSettings(prev => ({ ...prev, density: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-brand-500 outline-hidden font-mono"
                      >
                        <option value={1}>1 - خفيف</option>
                        <option value={2}>2 - عادي</option>
                        <option value={3}>3 - متوسط</option>
                        <option value={4}>4 - داكن</option>
                        <option value={5}>5 - داكن جداً</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto Print Switches */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">الطباعة التلقائية للجميع</span>
                        <span className="text-[9px] text-slate-400">طباعة فورية للمهمة بمجرد وصول دقيقتها</span>
                      </div>
                      <button
                        onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                        className={`w-10 h-5.5 rounded-full relative transition-all ${
                          autoPrintEnabled ? "bg-brand-600" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          autoPrintEnabled ? "left-1" : "left-5"
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">حصر الطباعة التلقائية للمهام الهامة</span>
                        <span className="text-[9px] text-slate-400">طباعة تلقائية فقط للمهام ذات الأولوية القصوى</span>
                      </div>
                      <button
                        onClick={() => setPrinterSettings(prev => ({ ...prev, autoPrintOnlyHigh: !prev.autoPrintOnlyHigh }))}
                        className={`w-10 h-5.5 rounded-full relative transition-all ${
                          printerSettings.autoPrintOnlyHigh ? "bg-brand-600" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                          printerSettings.autoPrintOnlyHigh ? "left-1" : "left-5"
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Test print trigger */}
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="w-full mt-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-800 border border-slate-200 text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    تغذية الورق وطباعة ورقة اختبار
                  </button>

                </div>
              </div>

              {/* Premium Background Keep-Alive Hub */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4.5 h-4.5 text-brand-600 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-900">رادار اليقظة وحماية المعالج بالخلفية</h4>
                </div>
                
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  أنظمة تشغيل الهواتف (iOS و Android) تقوم بتجميد متصفحات الإنترنت تلقائياً بعد دقيقة واحدة من قفل الشاشة أو وضع الهاتف في الجيب، مما قد يعطل المؤقت التلقائي للطابعة الحرارية. لتجاوز هذه القيود وضمان استمرار الطباعة التلقائية حتى والشاشة مغلقة، فعل التقنيات الفاخرة التالية:
                </p>

                <div className="space-y-3">
                  
                  {/* Wake Lock Control */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isWakeLockActive ? "bg-brand-50 text-brand-600" : "bg-white text-slate-400 border border-slate-200"}`}>
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">منع خمول الشاشة (Screen Wake Lock)</span>
                        <span className="text-[9px] text-slate-400 font-medium">يبقي الشاشة مضيئة وفعالة لمنع الهاتف من الدخول في وضع النوم العميق.</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleWakeLock}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                        isWakeLockActive
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      {isWakeLockActive ? "نشط الآن" : "تفعيل"}
                    </button>
                  </div>

                  {/* Silent Audio Keep-Alive Loop Control */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSilentLoopActive ? "bg-brand-50 text-brand-600" : "bg-white text-slate-400 border border-slate-200"}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">رادار الحفاظ على نشاط المعالج (Keep-Alive Loop)</span>
                        <span className="text-[9px] text-slate-400 font-medium">يقوم بتشغيل ذبذبات صامتة تماماً تخبر نظام الهاتف بأن المتصفح يشغل وسائط نشطة، مما يمنع تعليق المجدول والاتصال بالبلوتوث حتى لو تم قفل الهاتف!</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={isSilentLoopActive ? stopSilentAudioLoop : startSilentAudioLoop}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                        isSilentLoopActive
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      {isSilentLoopActive ? "نشط الآن" : "تفعيل"}
                    </button>
                  </div>

                  {/* Educational Professional Instructions */}
                  <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-[10px] font-bold text-brand-800">نصائح ترويض النظام للهواتف الذكية</span>
                    </div>
                    
                    <ul className="text-[9px] text-slate-600 space-y-1.5 list-disc pr-3 leading-relaxed font-medium">
                      <li>
                        <strong className="text-slate-800">أندرويد (Android):</strong> اذهب إلى تطبيق الإعدادات ← التطبيقات ← متصفح Chrome ← البطارية ← اختر <strong className="text-brand-600">"غير مقيد / Unrestricted"</strong> لتفادي وقف الاتصال بالخلفية.
                      </li>
                      <li>
                        <strong className="text-slate-800">آيفون (iOS):</strong> يرجى إبقاء هذه الصفحة مفتوحة في متصفح Safari، وتفعيل ميزتي "Screen Wake Lock" و "Keep-Alive Loop" أعلاه، ثم خفض سطوع الشاشة إلى أدنى حد وترك الهاتف يعمل.
                      </li>
                      <li>
                        <strong className="text-slate-800">اتصال BLE:</strong> نوصي بعدم تصفح تطبيقات ثقيلة تستهلك الذاكرة لضمان عدم تعليق المتصفح من قِبل نظام التشغيل.
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

        {/* --- Custom Premium App Footer Navigation tabs --- */}
        <footer className="absolute bottom-4 inset-x-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-2.5 flex items-center justify-between gap-2 shadow-xl z-20">
          <div className="flex-1 text-center">
            <span className="text-[9px] text-slate-400 block">مهام اليوم</span>
            <span className="text-xs font-mono font-bold text-brand-600">
              {tasks.filter(t => completedTaskIds.includes(t.id)).length} / {tasks.length}
            </span>
          </div>

          {/* Quick print active task */}
          <button
            onClick={() => {
              if (activeTask) {
                triggerPrintProcess(activeTask, false);
              } else {
                setError("لا يوجد أي نشاط جاري الآن لطباعته.");
              }
            }}
            className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-500/10 active:scale-95"
            title="اطبع النشاط الحالي فوراً"
          >
            <Printer className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center border-r border-slate-100">
            <span className="text-[9px] text-slate-400 block">الورق المطبوع</span>
            <span className="text-xs font-mono font-bold text-brand-600">
              {simulatorReceipts.length} قصاصات
            </span>
          </div>
        </footer>

      </div>

    </div>
  );
}
