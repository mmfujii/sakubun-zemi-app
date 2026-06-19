"use client";

import { useCallback, useRef } from "react";

const MAX_HISTORY = 100;
const DEBOUNCE_MS = 500;

/**
 * テキスト編集用の undo/redo フック。
 * 入力ごとに履歴を作らないようデバウンスしてスナップショットを取る。
 * OCRや下書き復元など、プログラム的なセットは setImmediate で即スナップショット。
 */
export function useUndoRedo(value: string, onChange: (v: string) => void) {
  const historyRef = useRef<string[]>([""]);
  const pointerRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");

  const pushSnapshot = useCallback((text: string) => {
    if (text === lastSavedRef.current) return;
    const history = historyRef.current.slice(0, pointerRef.current + 1);
    history.push(text);
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
    historyRef.current = history;
    pointerRef.current = history.length - 1;
    lastSavedRef.current = text;
  }, []);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        pushSnapshot(newValue);
      }, DEBOUNCE_MS);
    },
    [onChange, pushSnapshot],
  );

  const setImmediate = useCallback(
    (newValue: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onChange(newValue);
      pushSnapshot(newValue);
    },
    [onChange, pushSnapshot],
  );

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      pushSnapshot(value);
    }
    if (pointerRef.current > 0) {
      pointerRef.current -= 1;
      const prev = historyRef.current[pointerRef.current];
      lastSavedRef.current = prev;
      onChange(prev);
    }
  }, [onChange, pushSnapshot, value]);

  const redo = useCallback(() => {
    if (pointerRef.current < historyRef.current.length - 1) {
      pointerRef.current += 1;
      const next = historyRef.current[pointerRef.current];
      lastSavedRef.current = next;
      onChange(next);
    }
  }, [onChange]);

  const canUndo =
    pointerRef.current > 0 || (timerRef.current !== null && value !== lastSavedRef.current);
  const canRedo = pointerRef.current < historyRef.current.length - 1;

  const resetHistory = useCallback(() => {
    historyRef.current = [""];
    pointerRef.current = 0;
    lastSavedRef.current = "";
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { handleChange, setImmediate, undo, redo, canUndo, canRedo, resetHistory };
}
