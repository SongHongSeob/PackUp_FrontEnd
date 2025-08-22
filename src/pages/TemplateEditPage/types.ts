// 템플릿 에디터 타입 정의

export interface GridItem {
  id: string;
  type: 'object' | 'text';
  content: string;
  x: number;
  y: number;
  stepId: string;
  sectionId?: string;
  label?: string;
  cateNo?: number;
  category?: string;
}

export interface TextItem {
  id: string;
  content: string;
  x: number | string;
  y: number | string;
  fontSize: number;
  color: string;
  isEditing: boolean;
  isExpanded?: boolean; // 텍스트박스 확장/접기 상태
}

export interface GridSection {
  id: string;
  x: number; // 퍼센트
  y: number; // 퍼센트
  width: number; // 퍼센트
  height: number; // 퍼센트
  customName?: string;
}

export interface Step {
  id: string;
  name: string;
  grid: (GridItem | null)[][];
  sections: GridSection[];
  items?: GridItem[]; // 자유롭게 배치된 아이콘들
}

export interface IconItem {
  id: string;
  icon: string;
  label: string;
  tags: string[];
  category: '업무' | '생활' | '여행';
}

export interface BackgroundOption {
  id: string;
  name: string;
  image: string;
}

export type Category = '업무' | '생활' | '여행';
export type RecommendationTab = 'all' | 'recommended';
export type ActiveTab = 'preparations' | 'attributes';