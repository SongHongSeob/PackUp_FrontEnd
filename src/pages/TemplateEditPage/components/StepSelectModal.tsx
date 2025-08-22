import { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "../../../components/Button";
import { CloseIcon } from "../../../assets";
import { getStepBackground } from "../constants";
import type { Category } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (stepCount: number) => void;
  currentCategory: Category;
};

const ensureRoot = () => {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "modal-root";
    document.body.appendChild(el);
  }
  return el;
};

export default function StepSelectModal({ isOpen, onClose, onSelectStep, currentCategory }: Props) {
  const root = ensureRoot();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !root) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* dim */}
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/50" />
      {/* 모달창 */}
      <div role="dialog" aria-modal="true" className="z-[9999] inline-flex p-6 flex-col justify-center items-center gap-4 rounded-xl bg-white shadow-lg max-w-2xl">
        {/* header */}
        <div className="flex justify-between items-center w-full">
          <h2 className="text-lg font-semibold">스텝 선택</h2>
          <button onClick={onClose} className="w-6 h-6 cursor-pointer">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* content */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { step: 1 },
            { step: 2 },
            { step: 3 },
            { step: 4 }
          ].map(({ step }) => (
            <button
              key={step}
              onClick={() => {
                onSelectStep(step);
                onClose();
              }}
              className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-colors"
            >
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getStepBackground(currentCategory, step)}
                  alt={`스텝 ${step}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">스텝 ${step}</div>`;
                    }
                  }}
                />
              </div>
              <div className="text-center">
                <span className="font-medium block">스텝 {step}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* actions */}
        <div className="flex gap-2 w-full">
          <Button variant="line" onClick={onClose} className="flex-1">
            취소
          </Button>
        </div>
      </div>
    </div>,
    root
  );
}