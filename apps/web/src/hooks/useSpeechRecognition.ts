"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface UseSpeechRecognitionOptions {
  /** 確定テキストが来たら呼ばれる */
  onTranscript: (text: string) => void;
  /** 暫定テキストが来たら呼ばれる（前回の暫定を置き換える） */
  onInterim: (text: string) => void;
}

export function useSpeechRecognition({ onTranscript, onInterim }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppingRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);

  // コールバックを常に最新に保つ
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);

  // ブラウザ対応チェック
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
      setIsSupported(false);
    }
  }, []);

  const start = useCallback(() => {
    if (!isSupported) return;
    setError(null);
    isStoppingRef.current = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja-JP";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        // Web Speech API（日本語）が半角スペースを挟むことがあるので除去
        const cleaned = finalTranscript.replace(/ /g, "");
        onTranscriptRef.current(cleaned);
      } else {
        onInterimRef.current(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (isStoppingRef.current) return;

      switch (event.error) {
        case "not-allowed":
          setError("マイクの使用が許可されていません。ブラウザの設定を確認してください。");
          setIsListening(false);
          break;
        case "no-speech":
          return;
        case "network":
          setError("ネットワークエラーが発生しました。");
          setIsListening(false);
          break;
        case "aborted":
          return;
        default:
          setError("音声認識に失敗しました。もう一度お試しください。");
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (!isStoppingRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError("音声認識を開始できませんでした。");
      setIsListening(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    isStoppingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    error,
    isSupported,
    toggle,
    start,
    stop,
  };
}
