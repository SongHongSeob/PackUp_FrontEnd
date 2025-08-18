import { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "../../../components/Button";
import { CloseIcon } from "../../../assets";
import { getCategoryBackground } from "../constants";
import type { Category } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectBackground: (background: string) => void;
  currentCategory: Category;
  currentBackground: string;
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

export default function BackgroundSelectModal({ 
  isOpen, 
  onClose, 
  onSelectBackground, 
  currentCategory,
  currentBackground 
}: Props) {
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

  // 카테고리별 배경 옵션 (여행: 캐리어, 업무: 서류가방 등)
  const getCategoryBackgroundOptions = (category: Category) => {
    switch (category) {
      case '여행':
        return [
          { id: 'travel-carrier-1', name: '캐리어 타입 1', type: 'carrier' },
          { id: 'travel-carrier-2', name: '캐리어 타입 2', type: 'carrier' },
          { id: 'travel-backpack', name: '백팩', type: 'backpack' },
          { id: 'travel-duffel', name: '더플백', type: 'duffel' }
        ];
      case '업무':
        return [
          { id: 'business-briefcase-1', name: '서류가방 타입 1', type: 'briefcase' },
          { id: 'business-briefcase-2', name: '서류가방 타입 2', type: 'briefcase' },
          { id: 'business-laptop', name: '노트북 가방', type: 'laptop' },
          { id: 'business-messenger', name: '메신저백', type: 'messenger' }
        ];
      case '생활':
        return [
          { id: 'daily-tote', name: '토트백', type: 'tote' },
          { id: 'daily-shoulder', name: '숄더백', type: 'shoulder' },
          { id: 'daily-crossbody', name: '크로스백', type: 'crossbody' },
          { id: 'daily-backpack', name: '데일리 백팩', type: 'backpack' }
        ];
      default:
        return [
          { id: 'default-bag', name: '기본 가방', type: 'default' }
        ];
    }
  };

  const backgroundOptions = getCategoryBackgroundOptions(currentCategory);
  const backgrounds = backgroundOptions.map(option => ({
    id: option.id,
    name: option.name,
    image: getCategoryBackground(currentCategory) // 실제로는 카테고리 기본 배경 사용
  }));

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* dim */}
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/50" />
      {/* 모달창 */}
      <div role="dialog" aria-modal="true" className="z-[9999] inline-flex p-6 flex-col justify-center items-center gap-4 rounded-xl bg-white shadow-lg max-w-2xl">
        {/* header */}
        <div className="flex justify-between items-center w-full">
          <h2 className="text-lg font-semibold">배경 선택</h2>
          <button onClick={onClose} className="w-6 h-6 cursor-pointer">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* content */}
        <div className="grid grid-cols-2 gap-4">
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => {
                onSelectBackground(bg.image);
                onClose();
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                currentBackground === bg.image
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-400'
              }`}
            >
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={bg.image}
                  alt={bg.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">${bg.name}</div>`;
                    }
                  }}
                />
              </div>
              <span className="font-medium">{bg.name}</span>
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