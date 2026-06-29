import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint to generate structured tasks from user plan
app.post("/api/generate-tasks", async (req, res) => {
  try {
    const { plan, localTime } = req.body;

    if (!plan || typeof plan !== "string") {
      res.status(400).json({ error: "الخطة النصية مطلوبة لإنشاء المهام." });
      return;
    }

    const systemPrompt = `أنت خبير في التخطيط وإدارة الوقت والمهام اليومية بدقة عالية.
مهمتك هي أخذ الخطة اليومية أو الأفكار العشوائية المقدمة من المستخدم، وتحويلها إلى جدول مهام يومي متكامل ومفصل ومقسم بدقة متناهية حسب الأوقات (ساعة البدء وساعة الانتهاء).

يجب الالتزام بالقواعد التالية:
1. استخرج مهاماً واضحة ومحددة مع أوقات دقيقة بصيغة 24 ساعة (مثال: 07:00 إلى 08:30).
2. إذا لم يذكر المستخدم أوقاتاً محددة لبعض الأنشطة، وزعها بشكل منطقي على مدار اليوم بدءاً من الصباح أو حسب الوقت الحالي للمستخدم: ${localTime || "08:00"}.
3. يجب أن تكون العناوين والوصف باللغة العربية واضحة وبسيطة ومحفزة للإنتاجية والطباعة الورقية.
4. حدد مستوى الأهمية لكل مهمة (high, medium, low) حسب محتواها.
5. احسب المدة الزمنية لكل مهمة بالدقائق بدقة.
6. لا تترك أي فجوات زمنية كبيرة غير مفسرة بين المهام إذا كان ذلك ممكناً.`;

    const userPrompt = `إليك الخطة اليومية الخاصة بي:
"${plan}"

الوقت الحالي لدي الآن هو: ${localTime || "غير محدد"}.
يرجى تحويلها إلى قائمة المهام اليومية المهيكلة بدقة بالكامل وحسب الـ Schema المحددة.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks"],
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "قائمة المهام اليومية المقسمة والمجدولة",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "time", "endTime", "duration", "description", "priority"],
                properties: {
                  id: {
                    type: Type.STRING,
                    description: "معرف فريد للمهمة (مثال: task-1, task-2)",
                  },
                  title: {
                    type: Type.STRING,
                    description: "عنوان المهمة بشكل مختصر وواضح (بالعربية)",
                  },
                  time: {
                    type: Type.STRING,
                    description: "وقت بدء المهمة بصيغة 24 ساعة (مثال: '09:30')",
                  },
                  endTime: {
                    type: Type.STRING,
                    description: "وقت انتهاء المهمة بصيغة 24 ساعة (مثال: '11:00')",
                  },
                  duration: {
                    type: Type.INTEGER,
                    description: "مدة المهمة بالدقائق",
                  },
                  description: {
                    type: Type.STRING,
                    description: "وصف تفصيلي لما يجب إنجازه في هذه المهمة ونصائح للطباعة",
                  },
                  priority: {
                    type: Type.STRING,
                    description: "مستوى الأهمية (high أو medium أو low)",
                  },
                },
              },
            },
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("لم يتم استلام استجابة صالحة من الذكاء الاصطناعي.");
    }

    const data = JSON.parse(resultText.trim());
    res.json(data);
  } catch (error: any) {
    console.error("خطأ أثناء إنشاء المهام:", error);
    res.status(500).json({ error: error?.message || "حدث خطأ غير متوقع أثناء معالجة طلبك." });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
