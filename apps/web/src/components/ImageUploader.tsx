// 写真OCRアップローダ（V1から移植）。
// V2方針に合わせた変更点:
//   - 画像はサーバー保存しない（image_url / upload-image / onImagesChanged を削除）
//   - 原稿用紙クロップ（react-image-crop）は依存追加を避けるため一旦省略
//   - OCRは Hono の /ocr（認証付き、{ images:[...] } → { text }）に接続
// 残した機能: EXIF向き補正＋手動回転 / 画像品質チェック＋自動補正 / OCR用強調 /
//   複数枚（2枚目追加）/ 読み取り後の確認・編集 / 撮り直し / キーボード入力への切替

"use client";

import {
  AlertTriangle,
  ArrowUp,
  Camera,
  Contrast,
  ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
  Sun,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** 1枚分のOCR結果 */
interface PageResult {
  preview: string; // プレビュー用画像 (data URI)
  text: string; // OCR結果テキスト
}

interface ImageUploaderProps {
  onTextExtracted: (text: string) => void;
  /** キーボード入力モードに切り替える */
  onSwitchToKeyboard?: () => void;
}

type Phase = "upload" | "rotate" | "loading" | "result" | "add-second";

/** 画像品質チェックの結果 */
type QualityLevel = "good" | "warn" | "poor";
interface QualityResult {
  level: QualityLevel;
  issues: string[];
}

/** Canvas上の画像データから品質を診断する（明るさ・コントラスト・ぼけ） */
function checkImageQuality(canvas: HTMLCanvasElement): QualityResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { level: "good", issues: [] };

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = data.length / 4;

  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    sumSq += gray * gray;
  }
  const meanBrightness = sum / pixelCount;
  const variance = sumSq / pixelCount - meanBrightness * meanBrightness;
  const stdDev = Math.sqrt(Math.max(0, variance));

  const step = Math.max(1, Math.floor(Math.sqrt(pixelCount / 10000)));
  let lapSum = 0;
  let lapSumSq = 0;
  let lapCount = 0;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const c = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const t =
        0.299 * data[idx - width * 4] +
        0.587 * data[idx - width * 4 + 1] +
        0.114 * data[idx - width * 4 + 2];
      const b =
        0.299 * data[idx + width * 4] +
        0.587 * data[idx + width * 4 + 1] +
        0.114 * data[idx + width * 4 + 2];
      const l = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
      const r = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const laplacian = t + b + l + r - 4 * c;
      lapSum += laplacian;
      lapSumSq += laplacian * laplacian;
      lapCount++;
    }
  }

  const lapMean = lapCount > 0 ? lapSum / lapCount : 0;
  const lapVariance = lapCount > 0 ? lapSumSq / lapCount - lapMean * lapMean : 0;

  const issues: string[] = [];
  if (meanBrightness < 60) {
    issues.push("写真が暗すぎます。明るい場所で撮り直すと精度が上がります");
  } else if (meanBrightness > 240) {
    issues.push("写真が明るすぎます（白飛び）。光の反射を避けてください");
  }
  if (stdDev < 25) {
    issues.push("文字と背景のコントラストが低いです。影が入っていないか確認してください");
  }
  if (lapVariance < 50) {
    issues.push("ピントが合っていない可能性があります。カメラを固定して撮り直してみてください");
  }

  let level: QualityLevel;
  if (issues.length === 0) {
    level = "good";
  } else if (issues.length === 1 && meanBrightness >= 40 && meanBrightness <= 245) {
    level = "warn";
  } else {
    level = "poor";
  }

  return { level, issues };
}

/** 適応的コントラスト補正（暗い画像のブースト・ぼけのシャープニング） */
function autoCorrectImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  quality: QualityResult,
): void {
  if (quality.level === "good") return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = data.length / 4;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const mean = sum / pixelCount;

  if (mean < 100) {
    const gamma = Math.min(2.0, 128 / Math.max(mean, 1));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, 255 * (data[i] / 255) ** (1 / gamma));
      data[i + 1] = Math.min(255, 255 * (data[i + 1] / 255) ** (1 / gamma));
      data[i + 2] = Math.min(255, 255 * (data[i + 2] / 255) ** (1 / gamma));
    }
  }

  const hasBlur = quality.issues.some((i) => i.includes("ピント"));
  if (hasBlur) {
    const copy = new Uint8ClampedArray(data);
    const sharpenAmount = 0.5;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c];
          const avg =
            (copy[idx - width * 4 + c] +
              copy[idx + width * 4 + c] +
              copy[idx - 4 + c] +
              copy[idx + 4 + c]) /
            4;
          const sharpened = center + sharpenAmount * (center - avg);
          data[idx + c] = Math.max(0, Math.min(255, sharpened));
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export default function ImageUploader({ onTextExtracted, onSwitchToKeyboard }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const secondFileInputRef = useRef<HTMLInputElement>(null);
  const secondCameraInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pages, setPages] = useState<PageResult[]>([]);
  const [combinedText, setCombinedText] = useState("");

  // JPEGファイルからEXIF orientationを読む
  const getExifOrientation = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
        resolve(1);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const view = new DataView(e.target?.result as ArrayBuffer);
        if (view.getUint16(0, false) !== 0xffd8) {
          resolve(1);
          return;
        }
        let offset = 2;
        while (offset < view.byteLength) {
          if (view.getUint16(offset, false) === 0xffe1) {
            const exifOffset = offset + 10;
            const little = view.getUint16(exifOffset, false) === 0x4949;
            const tags = view.getUint16(exifOffset + 8, little);
            for (let i = 0; i < tags; i++) {
              const tagOffset = exifOffset + 10 + i * 12;
              if (tagOffset + 12 > view.byteLength) break;
              if (view.getUint16(tagOffset, little) === 0x0112) {
                resolve(view.getUint16(tagOffset + 8, little));
                return;
              }
            }
            resolve(1);
            return;
          }
          offset += 2 + view.getUint16(offset + 2, false);
        }
        resolve(1);
      };
      reader.onerror = () => resolve(1);
      reader.readAsArrayBuffer(file.slice(0, 65536));
    });
  };

  const exifToRotation = (orientation: number): number => {
    switch (orientation) {
      case 3:
        return 180;
      case 6:
        return 90;
      case 8:
        return 270;
      default:
        return 0;
    }
  };

  // OCR用に強調: グレースケール + コントラスト
  const enhanceForOCR = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const grayValues: number[] = new Array(data.length / 4);
    for (let i = 0; i < data.length; i += 4) {
      grayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const sorted = [...grayValues].sort((a, b) => a - b);
    const minVal = sorted[Math.floor(sorted.length * 0.01)];
    const maxVal = sorted[Math.floor(sorted.length * 0.99)];
    const range = maxVal - minVal || 1;

    for (let i = 0; i < data.length; i += 4) {
      let gray = grayValues[i / 4];
      gray = ((gray - minVal) / range) * 255;
      gray = Math.max(0, Math.min(255, gray));

      const normalized = gray / 255;
      const curved =
        normalized < 0.5 ? 0.5 * (2 * normalized) ** 0.6 : 1 - 0.5 * (2 * (1 - normalized)) ** 0.6;
      gray = curved * 255;

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // プレビュー画像（回転・原色）を生成 + 品質チェック
  const generatePreview = (
    file: File,
    extraRotation: number,
  ): Promise<{ dataUrl: string; quality: QualityResult }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = async () => {
          const exifOrientation = await getExifOrientation(file);
          const exifRot = exifToRotation(exifOrientation);
          const totalRotation = (exifRot + extraRotation) % 360;

          let { width, height } = img;
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          const isSwapped = totalRotation === 90 || totalRotation === 270;
          const canvasW = isSwapped ? height : width;
          const canvasH = isSwapped ? width : height;

          const canvas = document.createElement("canvas");
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }

          ctx.translate(canvasW / 2, canvasH / 2);
          ctx.rotate((totalRotation * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          resolve({
            dataUrl: canvas.toDataURL("image/jpeg", 0.85),
            quality: checkImageQuality(canvas),
          });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // OCR用画像処理: リサイズ・回転・自動補正・強調・圧縮
  const processImageForOCR = (
    file: File,
    extraRotation: number,
    qualityInfo: QualityResult | null,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = async () => {
          const exifOrientation = await getExifOrientation(file);
          const exifRot = exifToRotation(exifOrientation);
          const totalRotation = (exifRot + extraRotation) % 360;

          let { width, height } = img;
          const maxWidth = 2400;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          const isSwapped = totalRotation === 90 || totalRotation === 270;
          const canvasW = isSwapped ? height : width;
          const canvasH = isSwapped ? width : height;

          const canvas = document.createElement("canvas");
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }

          ctx.translate(canvasW / 2, canvasH / 2);
          ctx.rotate((totalRotation * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          if (qualityInfo && qualityInfo.level !== "good") {
            autoCorrectImage(ctx, canvasW, canvasH, qualityInfo);
          }
          enhanceForOCR(ctx, canvasW, canvasH);

          const result = canvas.toDataURL("image/jpeg", 0.9);
          if (result.length > 3 * 1024 * 1024) {
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } else {
            resolve(result);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // OCRテキストの整形
  const cleanOCRText = (raw: string): string => {
    return raw
      .replace(/([　-鿿豈-﫿])\s+([　-鿿豈-﫿])/g, "$1$2")
      .replace(/([　-鿿豈-﫿])\s+([　-鿿豈-﫿])/g, "$1$2")
      .replace(/[ \t]+$/gm, "")
      .replace(/^[ \t]{2,}/gm, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // Step 1: ファイル選択 → プレビュー + 回転コントロール
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    setCurrentFile(file);
    setRotation(0);
    setError(null);

    const { dataUrl, quality: q } = await generatePreview(file, 0);
    setPreview(dataUrl);
    setQuality(q);
    setPhase("rotate");
  };

  // Step 2: 回転
  const handleRotateLeft = async () => {
    if (!currentFile) return;
    const newRotation = (rotation + 270) % 360;
    setRotation(newRotation);
    const { dataUrl, quality: q } = await generatePreview(currentFile, newRotation);
    setPreview(dataUrl);
    setQuality(q);
  };

  const handleRotateRight = async () => {
    if (!currentFile) return;
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    const { dataUrl, quality: q } = await generatePreview(currentFile, newRotation);
    setPreview(dataUrl);
    setQuality(q);
  };

  // Step 3: OCR実行（/ocr に処理済み画像を1枚送る）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 内部関数は安定でカーソル/履歴に依存しない（V1踏襲）
  const handleStartOCR = useCallback(async () => {
    if (!currentFile) return;
    setPhase("loading");
    setError(null);
    const startedAt = Date.now();
    trackEvent("ocr_started", { input_method: "photo" });

    try {
      const ocrImage = await processImageForOCR(currentFile, rotation, quality);
      const { dataUrl: previewImage } = await generatePreview(currentFile, rotation);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE}/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ images: [ocrImage] }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ||
            "読み取りに失敗しました。写真を撮り直してみてください。",
        );
      }

      const data = (await response.json()) as { text: string };
      const cleanedText = cleanOCRText(data.text);

      const newPages = [...pages, { preview: previewImage, text: cleanedText }];
      setPages(newPages);
      setCombinedText(newPages.map((p) => p.text).join("\n"));

      setCurrentFile(null);
      setPreview(null);
      setPhase("result");
      trackEvent("ocr_succeeded", { input_method: "photo", duration_ms: Date.now() - startedAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      trackEvent("ocr_failed", { input_method: "photo", error_code: "OCR_ERROR" });
      setRetryCount((c) => c + 1);
      setPhase("rotate");
    }
  }, [currentFile, rotation, pages, quality]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirm = () => {
    if (combinedText) {
      onTextExtracted(combinedText);
      resetUI();
    }
  };

  const handleAddSecond = () => {
    setPhase("add-second");
    setCurrentFile(null);
    setPreview(null);
    setRotation(0);
    setError(null);
  };

  const handleSecondFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    setCurrentFile(file);
    setRotation(0);
    setError(null);

    const { dataUrl, quality: q } = await generatePreview(file, 0);
    setPreview(dataUrl);
    setQuality(q);
    setPhase("rotate");
  };

  const handleSecondInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) handleSecondFileSelect(file);
  };

  const resetUI = () => {
    setPreview(null);
    setCombinedText("");
    setError(null);
    setCurrentFile(null);
    setRotation(0);
    setQuality(null);
    setRetryCount(0);
    setPages([]);
    setPhase("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (secondFileInputRef.current) secondFileInputRef.current.value = "";
    if (secondCameraInputRef.current) secondCameraInputRef.current.value = "";
  };

  // ===== Phase: rotate =====
  if (phase === "rotate" && preview) {
    const isSecondPage = pages.length > 0;
    const showQualityWarning = quality && quality.level !== "good";
    const softWarning = retryCount >= 2;

    return (
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
            {error}
          </div>
        )}

        <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl border border-blue-100">
          <p className="font-semibold mb-1">
            {isSecondPage ? "2枚目の画像の向きを確認" : "画像の向きを確認"}
          </p>
          <p className="text-xs">
            作文が正しい向きになっていることを確認してください。向きが違う場合は回転ボタンで調整できます。
          </p>
        </div>

        {showQualityWarning && (
          <div
            className={`text-sm px-4 py-3 rounded-xl border animate-scale-in ${
              quality.level === "poor" && !softWarning
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={2.5} />
              <div>
                <p className="font-semibold mb-1">
                  {softWarning
                    ? "自動補正して読み取ります"
                    : quality.level === "poor"
                      ? "読み取りの精度が下がる可能性があります"
                      : "画像の品質をチェックしました"}
                </p>
                {softWarning ? (
                  <p className="text-xs">
                    画像を自動で補正して読み取ります。結果を確認して、違うところがあれば修正してください。
                  </p>
                ) : (
                  <ul className="text-xs space-y-0.5">
                    {quality.issues.map((issue) => (
                      <li key={issue}>・{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleRotateLeft}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-100 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors active:scale-[0.96]"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            左に回転
          </button>
          <button
            type="button"
            onClick={handleRotateRight}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-100 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors active:scale-[0.96]"
          >
            右に回転
            <RotateCw size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          {/* biome-ignore lint/performance/noImgElement: data URLのプレビュー表示でnext/imageの最適化対象外 */}
          <img src={preview} alt="プレビュー" className="w-full h-auto block" />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (isSecondPage) {
                setPhase("result");
              } else {
                setRetryCount((c) => c + 1);
                resetUI();
              }
            }}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            {isSecondPage ? "戻る" : "撮り直す"}
          </button>
          <button
            type="button"
            onClick={handleStartOCR}
            className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors active:scale-[0.98] shadow-brand"
          >
            {showQualityWarning && !softWarning ? "このまま読み取る" : "この向きで読み取る"}
          </button>
        </div>

        {retryCount >= 2 && onSwitchToKeyboard && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-2">写真からの読み取りがうまくいかない場合</p>
            <button
              type="button"
              onClick={onSwitchToKeyboard}
              className="text-sm font-bold text-brand hover:underline"
            >
              キーボード入力に切り替える
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== Phase: add-second =====
  if (phase === "add-second") {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl border border-blue-100">
          <p className="font-semibold mb-1">2枚目の写真を選択</p>
          <p className="text-xs">原稿用紙の2枚目を撮影またはアップロードしてください。</p>
        </div>

        {pages[0] && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
            {/* biome-ignore lint/performance/noImgElement: data URLのサムネイルでnext/imageの最適化対象外 */}
            <img
              src={pages[0].preview}
              alt="1枚目"
              className="w-12 h-16 object-cover rounded-lg border border-gray-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500">1枚目</p>
              <p className="text-xs text-gray-400">{pages[0].text.length}字</p>
            </div>
          </div>
        )}

        <input
          ref={secondFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleSecondInputChange}
          className="hidden"
        />
        <input
          ref={secondCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleSecondInputChange}
          className="hidden"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => secondFileInputRef.current?.click()}
            className="flex-1 py-3 rounded-2xl border-2 border-brand bg-white text-brand font-bold text-sm hover:bg-brand-light/30 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ImageIcon size={16} />
            写真を選ぶ
          </button>
          <button
            type="button"
            onClick={() => secondCameraInputRef.current?.click()}
            className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors active:scale-[0.98] shadow-brand flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            カメラで撮る
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPhase("result")}
          className="w-full py-2 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          戻る
        </button>
      </div>
    );
  }

  // ===== Phase: result =====
  if (phase === "result" && pages.length > 0) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-xl border border-amber-200 animate-scale-in">
          <p className="font-semibold mb-1">読み取った文章を確認してください</p>
          <p className="text-xs leading-relaxed">
            手書きのため、ときどき読み間違いがあります。
            <span className="font-bold">
              写真と見比べて、違うところを直してから添削に進んでください。
            </span>
            <br />
            正確なテキストほど、添削も正確になります。段落の区切りはEnterキーで改行できます。
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500">元の写真（タップで拡大）</p>
          <div className="flex gap-2 overflow-x-auto">
            {pages.map((page, i) => (
              <div key={page.preview} className="shrink-0 relative">
                <button
                  type="button"
                  className="block p-0 border-0 bg-transparent"
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(
                        `<html><head><title>${i + 1}枚目</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${page.preview}" /></body></html>`,
                      );
                    }
                  }}
                >
                  {/* biome-ignore lint/performance/noImgElement: data URLのプレビューでnext/imageの最適化対象外 */}
                  <img
                    src={page.preview}
                    alt={`${i + 1}枚目`}
                    className="w-[140px] h-auto rounded-xl border-2 border-gray-200 cursor-pointer hover:border-brand transition-colors"
                  />
                </button>
                <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {i + 1}枚目
                </span>
              </div>
            ))}
          </div>
        </div>

        {pages.length === 1 && (
          <button
            type="button"
            onClick={handleAddSecond}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 font-bold text-sm hover:border-brand hover:text-brand hover:bg-brand-light/30 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            2枚目を追加する
          </button>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">読み取り結果（編集できます）</p>
            <p className="text-xs text-gray-400 tabular-nums">{combinedText.length}字</p>
          </div>
          <textarea
            value={combinedText}
            onChange={(e) => setCombinedText(e.target.value)}
            className="w-full h-48 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 text-sm leading-[1.8] resize-none focus:outline-none focus:border-brand transition-colors"
          />
          <p className="text-xs text-gray-400">
            写真と見比べて、違う文字や抜けている部分があれば修正してください
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={resetUI}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors active:scale-[0.98] shadow-brand"
          >
            確認して続ける
          </button>
        </div>
      </div>
    );
  }

  // ===== Phase: loading =====
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
          <Loader2 size={32} stroke="#2f6e59" className="animate-spin" />
        </div>
        <p className="text-gray-700 font-bold">
          {pages.length > 0 ? "2枚目を読み取り中..." : "テキストを読み取り中..."}
        </p>
        <p className="text-xs text-gray-400">少しお待ちください</p>
      </div>
    );
  }

  // ===== Phase: upload (initial) =====
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
          {error}
        </div>
      )}

      {/* 撮影のコツ */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-bold mb-2">きれいに読み取るコツ</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">
              <Sun size={14} strokeWidth={2.5} />
            </span>
            <span>明るい場所で撮る</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">
              <ArrowUp size={14} strokeWidth={2.5} />
            </span>
            <span>真上から撮る</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">
              <Square size={14} strokeWidth={2.5} />
            </span>
            <span>作文全体を写す</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">
              <Contrast size={14} strokeWidth={2.5} />
            </span>
            <span>影が入らないように</span>
          </div>
        </div>
        <p className="text-xs mt-2 text-amber-600">※ 読み取った文字は、あとで確認・修正できます</p>
      </div>

      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={handleDragDrop}
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-brand hover:bg-brand-light/30 transition-colors cursor-pointer bg-gray-50"
      >
        <Upload size={48} strokeWidth={1.5} className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-700 font-bold mb-1">写真をアップロード</p>
        <p className="text-xs text-gray-500">ドラッグ＆ドロップ、またはタップして選択</p>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 rounded-2xl border-2 border-brand bg-white text-brand font-bold text-sm hover:bg-brand-light/30 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <ImageIcon size={16} />
          写真を選ぶ
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-colors active:scale-[0.98] shadow-brand flex items-center justify-center gap-2"
        >
          <Camera size={16} />
          カメラで撮る
        </button>
      </div>
    </div>
  );
}
