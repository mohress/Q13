/**
 * Utility for shaping and formatting Arabic text for BLE thermal printers and simulators.
 */

// Arabic letter definitions and their forms: [Isolated, End, Middle, Start]
interface ArabicLetter {
  char: string;
  isolated: number;
  end: number;
  middle: number;
  start: number;
  rules: {
    connectBefore: boolean;
    connectAfter: boolean;
  };
}

const ARABIC_LETTERS: { [key: string]: ArabicLetter } = {
  "ا": { char: "ا", isolated: 0xFE8D, end: 0xFE8E, middle: 0xFE8E, start: 0xFE8D, rules: { connectBefore: true, connectAfter: false } },
  "أ": { char: "أ", isolated: 0xFE83, end: 0xFE84, middle: 0xFE84, start: 0xFE83, rules: { connectBefore: true, connectAfter: false } },
  "إ": { char: "إ", isolated: 0xFE87, end: 0xFE88, middle: 0xFE88, start: 0xFE87, rules: { connectBefore: true, connectAfter: false } },
  "آ": { char: "آ", isolated: 0xFE81, end: 0xFE82, middle: 0xFE82, start: 0xFE81, rules: { connectBefore: true, connectAfter: false } },
  "ب": { char: "ب", isolated: 0xFE8F, end: 0xFE90, middle: 0xFE92, start: 0xFE91, rules: { connectBefore: true, connectAfter: true } },
  "ت": { char: "ت", isolated: 0xFE95, end: 0xFE96, middle: 0xFE98, start: 0xFE97, rules: { connectBefore: true, connectAfter: true } },
  "ث": { char: "ث", isolated: 0xFE99, end: 0xFE9A, middle: 0xFE9C, start: 0xFE9B, rules: { connectBefore: true, connectAfter: true } },
  "ج": { char: "ج", isolated: 0xFE9D, end: 0xFE9E, middle: 0xFEA0, start: 0xFE9F, rules: { connectBefore: true, connectAfter: true } },
  "ح": { char: "ح", isolated: 0xFEA1, end: 0xFEA2, middle: 0xFEA4, start: 0xFEA3, rules: { connectBefore: true, connectAfter: true } },
  "خ": { char: "خ", isolated: 0xFEA5, end: 0xFEA6, middle: 0xFEA8, start: 0xFEA7, rules: { connectBefore: true, connectAfter: true } },
  "د": { char: "د", isolated: 0xFEA9, end: 0xFEAA, middle: 0xFEAA, start: 0xFEA9, rules: { connectBefore: true, connectAfter: false } },
  "ذ": { char: "ذ", isolated: 0xFEAB, end: 0xFEAC, middle: 0xFEAC, start: 0xFEAB, rules: { connectBefore: true, connectAfter: false } },
  "ر": { char: "ر", isolated: 0xFEAD, end: 0xFEAE, middle: 0xFEAE, start: 0xFEAD, rules: { connectBefore: true, connectAfter: false } },
  "ز": { char: "ز", isolated: 0xFEAF, end: 0xFEB0, middle: 0xFEB0, start: 0xFEAF, rules: { connectBefore: true, connectAfter: false } },
  "س": { char: "س", isolated: 0xFEB1, end: 0xFEB2, middle: 0xFEB4, start: 0xFEB3, rules: { connectBefore: true, connectAfter: true } },
  "ش": { char: "ش", isolated: 0xFEB5, end: 0xFEB6, middle: 0xFEB8, start: 0xFEB7, rules: { connectBefore: true, connectAfter: true } },
  "ص": { char: "ص", isolated: 0xFEB9, end: 0xFEBA, middle: 0xFEBC, start: 0xFEBB, rules: { connectBefore: true, connectAfter: true } },
  "ض": { char: "ض", isolated: 0xFEBD, end: 0xFEBE, middle: 0xFEC0, start: 0xFEBF, rules: { connectBefore: true, connectAfter: true } },
  "ط": { char: "ط", isolated: 0xFEC1, end: 0xFEC2, middle: 0xFEC4, start: 0xFEC3, rules: { connectBefore: true, connectAfter: true } },
  "ظ": { char: "ظ", isolated: 0xFEC5, end: 0xFEC6, middle: 0xFEC8, start: 0xFEC7, rules: { connectBefore: true, connectAfter: true } },
  "ع": { char: "ع", isolated: 0xFEC9, end: 0xFECA, middle: 0xFECC, start: 0xFECB, rules: { connectBefore: true, connectAfter: true } },
  "غ": { char: "غ", isolated: 0xFECD, end: 0xFECE, middle: 0xFED0, start: 0xFEDF, rules: { connectBefore: true, connectAfter: true } },
  "ف": { char: "ف", isolated: 0xFED1, end: 0xFED2, middle: 0xFED4, start: 0xFED3, rules: { connectBefore: true, connectAfter: true } },
  "ق": { char: "ق", isolated: 0xFED5, end: 0xFED6, middle: 0xFED8, start: 0xFED7, rules: { connectBefore: true, connectAfter: true } },
  "ك": { char: "ك", isolated: 0xFED9, end: 0xFEDA, middle: 0xFEDC, start: 0xFEDB, rules: { connectBefore: true, connectAfter: true } },
  "ل": { char: "ل", isolated: 0xFEDD, end: 0xFEDE, middle: 0xFEE0, start: 0xFEDF, rules: { connectBefore: true, connectAfter: true } },
  "م": { char: "م", isolated: 0xFEE1, end: 0xFEE2, middle: 0xFEE4, start: 0xFEE3, rules: { connectBefore: true, connectAfter: true } },
  "ن": { char: "ن", isolated: 0xFEE5, end: 0xFEE6, middle: 0xFEE8, start: 0xFEE7, rules: { connectBefore: true, connectAfter: true } },
  "ه": { char: "ه", isolated: 0xFEE9, end: 0xFEEA, middle: 0xFEEC, start: 0xFEEB, rules: { connectBefore: true, connectAfter: true } },
  "و": { char: "و", isolated: 0xFEED, end: 0xFEEE, middle: 0xFEEE, start: 0xFEED, rules: { connectBefore: true, connectAfter: false } },
  "ي": { char: "ي", isolated: 0xFEF1, end: 0xFEF2, middle: 0xFEF4, start: 0xFEF3, rules: { connectBefore: true, connectAfter: true } },
  "ى": { char: "ى", isolated: 0xFEF0, end: 0xFEF0, middle: 0xFEF0, start: 0xFEF0, rules: { connectBefore: true, connectAfter: false } },
  "ة": { char: "ة", isolated: 0xFEE7, end: 0xFEE8, middle: 0xFEE8, start: 0xFEE7, rules: { connectBefore: true, connectAfter: false } },
  "ئ": { char: "ئ", isolated: 0xFE89, end: 0xFE8A, middle: 0xFE8C, start: 0xFE8B, rules: { connectBefore: true, connectAfter: true } },
  "ؤ": { char: "ؤ", isolated: 0xFE85, end: 0xFE86, middle: 0xFE86, start: 0xFE85, rules: { connectBefore: true, connectAfter: false } },
  "ء": { char: "ء", isolated: 0xFE80, end: 0xFE80, middle: 0xFE80, start: 0xFE80, rules: { connectBefore: false, connectAfter: false } }
};

// Unicode range for standard Arabic letters
const isArabicChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) || (code >= 0xFE70 && code <= 0xFEFF);
};

/**
 * Shapes Arabic text based on letter positions.
 */
export function shapeArabicText(text: string): string {
  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const currentChar = chars[i];

    if (!isArabicChar(currentChar) || !ARABIC_LETTERS[currentChar]) {
      result.push(currentChar);
      continue;
    }

    const prevChar = chars[i - 1];
    const nextChar = chars[i + 1];

    const prevLetter = ARABIC_LETTERS[prevChar];
    const nextLetter = ARABIC_LETTERS[nextChar];
    const currentLetter = ARABIC_LETTERS[currentChar];

    const canConnectBefore = prevLetter && prevLetter.rules.connectAfter && currentLetter.rules.connectBefore;
    const canConnectAfter = nextLetter && nextLetter.rules.connectBefore && currentLetter.rules.connectAfter;

    let shapedCode = currentLetter.isolated;

    if (canConnectBefore && canConnectAfter) {
      shapedCode = currentLetter.middle;
    } else if (canConnectBefore) {
      shapedCode = currentLetter.end;
    } else if (canConnectAfter) {
      shapedCode = currentLetter.start;
    } else {
      shapedCode = currentLetter.isolated;
    }

    result.push(String.fromCharCode(shapedCode));
  }

  return result.join("");
}

/**
 * Reverses words and text layout to print correctly in Right-to-Left (RTL) mode.
 */
export function reverseArabicForPrinting(text: string, lineWidth: number = 32): string {
  const shaped = shapeArabicText(text);
  const lines = wrapText(shaped, lineWidth);
  
  return lines.map(line => {
    // Reverse only parts containing Arabic characters
    const segments = segmentLine(line);
    return segments.map(seg => {
      if (isArabicChar(seg[0])) {
        return Array.from(seg).reverse().join("");
      }
      return seg;
    }).join("");
  }).join("\n");
}

/**
 * Split line into Arabic and non-Arabic segments to keep numbers and Latin text correct.
 */
function segmentLine(line: string): string[] {
  const segments: string[] = [];
  let currentSegment = "";
  let currentIsArabic = false;

  for (const char of line) {
    const charIsArabic = isArabicChar(char);
    if (currentSegment === "") {
      currentSegment = char;
      currentIsArabic = charIsArabic;
    } else if (charIsArabic === currentIsArabic) {
      currentSegment += char;
    } else {
      segments.push(currentSegment);
      currentSegment = char;
      currentIsArabic = charIsArabic;
    }
  }
  if (currentSegment !== "") {
    segments.push(currentSegment);
  }
  return segments;
}

/**
 * Helper to wrap text into lines of defined length.
 */
function wrapText(text: string, limit: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine === "") {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= limit) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine !== "") {
    lines.push(currentLine);
  }
  return lines;
}

// Windows-1256 character encoding map for Arabic characters.
const UNICODE_TO_CP1256: { [key: number]: number } = {
  0x060C: 0xA1, // Arabic comma
  0x061B: 0xBA, // Arabic semicolon
  0x061F: 0xBF, // Arabic question mark
  0x0621: 0xC1, // Hamza
  0x0622: 0xC2, // Alef Madda
  0x0623: 0xC3, // Alef Hamza Above
  0x0624: 0xC4, // Waw Hamza
  0x0625: 0xC5, // Alef Hamza Below
  0x0626: 0xC6, // Yeh Hamza
  0x0627: 0xC7, // Alef
  0x0628: 0xC8, // Beh
  0x0629: 0xC9, // Teh Marbuta
  0x062A: 0xCA, // Teh
  0x062B: 0xCB, // Theh
  0x062C: 0xCC, // Jeem
  0x062D: 0xCD, // Hah
  0x062E: 0xCE, // Khah
  0x062F: 0xCF, // Dal
  0x0630: 0xD0, // Thal
  0x0631: 0xD1, // Reh
  0x0632: 0xD2, // Zain
  0x0633: 0xD3, // Seen
  0x0634: 0xD4, // Sheen
  0x0635: 0xD5, // Sad
  0x0636: 0xD6, // Dad
  0x0637: 0xD7, // Tah
  0x0638: 0xD8, // Zah
  0x0639: 0xD9, // Ain
  0x063A: 0xDA, // Ghain
  0x0640: 0xE0, // Tatweel
  0x0641: 0xE1, // Feh
  0x0642: 0xE2, // Qaf
  0x0643: 0xE3, // Kaf
  0x0644: 0xE4, // Lam
  0x0645: 0xE5, // Meem
  0x0646: 0xE6, // Noon
  0x0647: 0xE7, // Heh
  0x0648: 0xE8, // Waw
  0x0649: 0xE9, // Alef Maksura
  0x064A: 0xEA, // Yeh
  0x064B: 0xF0, // Fathatayn
  0x064C: 0xF1, // Dammatayn
  0x064D: 0xF2, // Kasratayn
  0x064E: 0xF3, // Fatha
  0x064F: 0xF5, // Damma
  0x0650: 0xF6, // Kasra
  0x0651: 0xF8, // Shadda
  0x0652: 0xFA, // Sukun
};

/**
 * Translates standard/shaped Arabic letters into a Windows-1256 Uint8Array for direct POS printer printing.
 */
export function convertToWindows1256(text: string): Uint8Array {
  const bytes: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    
    // Look up unicode to CP1256 mapping
    if (UNICODE_TO_CP1256[code] !== undefined) {
      bytes.push(UNICODE_TO_CP1256[code]);
    } else if (code >= 0xFE70 && code <= 0xFEFF) {
      // It's a shaped Arabic character form. Let's find its matching standard Arabic letter
      // and translate that.
      let found = false;
      for (const key of Object.keys(ARABIC_LETTERS)) {
        const letter = ARABIC_LETTERS[key];
        if (letter.isolated === code || letter.end === code || letter.middle === code || letter.start === code) {
          const standardCode = letter.char.charCodeAt(0);
          if (UNICODE_TO_CP1256[standardCode] !== undefined) {
            bytes.push(UNICODE_TO_CP1256[standardCode]);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        // Fallback to ASCII approximation or space
        bytes.push(0x20);
      }
    } else if (code < 128) {
      // Standard ASCII character
      bytes.push(code);
    } else {
      // Space or unsupported symbol
      bytes.push(0x20);
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Builds the complete binary raw print commands (ESC/POS) for a task receipt.
 */
export function buildEscPosReceipt(
  title: string,
  timeStr: string,
  endTimeStr: string,
  priority: string,
  description: string,
  lineWidth: number = 32,
  density: number = 3,
  customHeader: string = "مهامي اليومية",
  customFooter: string = "بالتوفيق والنجاح!"
): Uint8Array {
  const commands: number[] = [];

  // ESC @ (Initialize printer)
  commands.push(0x1B, 0x40);

  // Set printing density (darkness)
  // GS ~ n (often 0-5)
  commands.push(0x1D, 0x7E, density);

  // Function to add a line to receipt
  const addLine = (text: string, align: "left" | "center" | "right" = "right") => {
    // Alignment commands: ESC a n (0: Left, 1: Center, 2: Right)
    const alignVal = align === "left" ? 0 : align === "center" ? 1 : 2;
    commands.push(0x1B, 0x61, alignVal);

    // Set code page to CP1256
    // ESC t n (frequently 22 or 51 for Windows-1256 Arabic, depending on printer model)
    commands.push(0x1B, 0x74, 22);

    // Format Arabic RTL
    const formatted = reverseArabicForPrinting(text, lineWidth);
    const encodedBytes = convertToWindows1256(formatted);
    
    for (let b of Array.from(encodedBytes)) {
      commands.push(b);
    }
    // Newline
    commands.push(0x0A);
  };

  const addDivider = () => {
    commands.push(0x1B, 0x61, 1); // Center
    const divider = "-".repeat(lineWidth);
    for (let i = 0; i < divider.length; i++) {
      commands.push(divider.charCodeAt(i));
    }
    commands.push(0x0A);
  };

  // 1. Header
  if (customHeader) {
    addLine(customHeader, "center");
  } else {
    addLine("منظم المهام الذكي", "center");
  }
  addDivider();

  // 2. Task Time
  addLine(`الوقت: ${timeStr} - ${endTimeStr}`, "right");
  
  // 3. Task Title (double height/width ESC ! 0x10 / 0x20 / 0x30)
  commands.push(0x1B, 0x61, 1); // Center
  commands.push(0x1B, 0x21, 0x10); // Double height
  const shapedTitle = reverseArabicForPrinting(title, Math.floor(lineWidth / 1.5));
  const titleBytes = convertToWindows1256(shapedTitle);
  for (let b of Array.from(titleBytes)) {
    commands.push(b);
  }
  commands.push(0x0A);
  commands.push(0x1B, 0x21, 0x00); // Standard size

  // 4. Priority
  const priorityAr = priority === "high" ? "أهمية قصوى !!!" : priority === "medium" ? "أهمية متوسطة" : "أهمية عادية";
  addLine(`الأولوية: ${priorityAr}`, "right");
  
  addDivider();

  // 5. Description
  addLine(description, "right");

  addDivider();

  // 6. Footer
  if (customFooter) {
    addLine(customFooter, "center");
  }
  
  // Custom timestamp
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  commands.push(0x1B, 0x61, 1); // Center
  for (let i = 0; i < dateStr.length; i++) {
    commands.push(dateStr.charCodeAt(i));
  }
  commands.push(0x0A);

  // Feed 4 lines of paper
  commands.push(0x1B, 0x64, 4);

  // Cut paper (GS V 66 0)
  commands.push(0x1D, 0x56, 66, 0);

  return new Uint8Array(commands);
}
