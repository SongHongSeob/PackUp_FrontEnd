import { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "../../../components/Button";
import { CloseIcon } from "../../../assets";
import type { Category } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
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

export default function CategorySelectModal({ isOpen, onClose, onSelectCategory, currentCategory }: Props) {
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

  const categories: { value: Category; label: string; color: string }[] = [
    { value: '업무', label: '업무', color: 'bg-blue-100 text-blue-600' },
    { value: '생활', label: '생활', color: 'bg-green-100 text-green-600' },
    { value: '여행', label: '여행', color: 'bg-purple-100 text-purple-600' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* dim */}
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/50" />
      {/* 모달창 */}
      <div role="dialog" aria-modal="true" className="z-[9999] inline-flex p-6 flex-col justify-center items-center gap-4 rounded-xl bg-white shadow-lg max-w-md">
        {/* header */}
        <div className="flex justify-between items-center w-full">
          <h2 className="text-lg font-semibold">카테고리 선택</h2>
          <button onClick={onClose} className="w-6 h-6 cursor-pointer">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* content */}
        <div className="flex flex-col gap-3 w-full">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => {
                onSelectCategory(category.value);
                onClose();
              }}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                currentCategory === category.value
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                  {category.label}
                </div>
                <span className="font-medium">{category.label} 템플릿</span>
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