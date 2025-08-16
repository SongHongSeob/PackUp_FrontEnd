import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Slider } from './components/ui/slider';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Type, 
  Grid3x3, 
  Layers, 
  Palette, 
  RotateCcw, 
  Trash2,
  Search,
  X,
  CheckSquare,
  Settings,
  Move,
  MousePointer2,
  Grid,
  Box,
  Square,
  Copy,
  Edit3,
  MoreHorizontal,
  Pipette,
  Maximize,
  Minimize,
  Edit
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from './components/ui/context-menu';

// Canvas object interface
interface CanvasObject {
  id: string;
  type: 'icon' | 'text' | 'step';
  x: number;
  y: number;
  content: string;
  color?: string;
  size?: number;
  rotation?: number;
  stepSize?: { width: number; height: number };
  stepOrder?: number;
  stepColor?: string;
  fontSize?: number;
  fontWeight?: string;
  stepItems?: string[];
  depth3D?: number;
  name?: string;
  gridSize?: { width: number; height: number };
  isInStep?: string;
  stepLocalX?: number;
  stepLocalY?: number;
}

interface TemplateEditorProps {
  templateId: number | null;
  isQuickCreate: boolean;
  templateType: string;
  onSave: () => void;
  onBack: () => void;
}

export default function TemplateEditor({ 
  templateId, 
  isQuickCreate, 
  templateType, 
  onSave, 
  onBack 
}: TemplateEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const expandedStepRef = useRef<HTMLDivElement>(null);
  const [templateTitle, setTemplateTitle] = useState('할일 템플릿');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [draggedObject, setDraggedObject] = useState<CanvasObject | null>(null);
  const [canvasBackground, setCanvasBackground] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [showPreview, setShowPreview] = useState(false);
  const [editingText, setEditingText] = useState<CanvasObject | null>(null);
  const [showStepGridModal, setShowStepGridModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [hoveredStepSize, setHoveredStepSize] = useState<string | null>(null);
  const [is3DView, setIs3DView] = useState(true);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuObject, setContextMenuObject] = useState<CanvasObject | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [customColorValue, setCustomColorValue] = useState('#667eea');
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; valid: boolean; occupiedCells?: { x: number; y: number }[] } | null>(null);
  
  // Step expanded state
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  
  // Icon search and filtering state
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('Object');

  // Step hover state
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  // Calculate step grid size
  const getStepGridSize = (stepObj: CanvasObject) => {
    if (!stepObj.stepSize) return { cols: 4, rows: 4 };
    const cols = Math.floor(stepObj.stepSize.width / 20);
    const rows = Math.floor(stepObj.stepSize.height / 20);
    return { cols, rows };
  };

  // Enhanced step collision detection with smooth animations
  const pushAwayOverlappingSteps = useCallback((draggedStepId: string, newX: number, newY: number, draggedStepSize: { width: number; height: number }) => {
    const otherSteps = objects.filter(obj => obj.type === 'step' && obj.id !== draggedStepId);
    
    // Canvas boundary check
    const canvasWidth = 600;
    const canvasHeight = 800;
    const boundedX = Math.max(0, Math.min(newX, canvasWidth - draggedStepSize.width));
    const boundedY = Math.max(0, Math.min(newY, canvasHeight - draggedStepSize.height));
    
    // Collect steps that need to be moved
    const stepsToMove: { stepId: string; newX: number; newY: number; originalX: number; originalY: number }[] = [];
    
    for (const step of otherSteps) {
      if (!step.stepSize) continue;
      
      // Enhanced collision detection with smooth movement
      const draggedLeft = boundedX;
      const draggedRight = boundedX + draggedStepSize.width;
      const draggedTop = boundedY;
      const draggedBottom = boundedY + draggedStepSize.height;
      
      const stepLeft = step.x;
      const stepRight = step.x + step.stepSize.width;
      const stepTop = step.y;
      const stepBottom = step.y + step.stepSize.height;
      
      // Check if overlapping with margin for smoother interaction
      const margin = 15;
      const isOverlapping = !(draggedRight + margin <= stepLeft || draggedLeft - margin >= stepRight || 
                             draggedBottom + margin <= stepTop || draggedTop - margin >= stepBottom);
      
      if (isOverlapping) {
        let newStepX = step.x;
        let newStepY = step.y;
        
        // Smoother push direction calculation
        const centerX1 = boundedX + draggedStepSize.width / 2;
        const centerY1 = boundedY + draggedStepSize.height / 2;
        const centerX2 = step.x + step.stepSize.width / 2;
        const centerY2 = step.y + step.stepSize.height / 2;
        
        const deltaX = centerX2 - centerX1;
        const deltaY = centerY2 - centerY1;
        
        // Determine push direction with smoother calculation
        const pushDistance = 40;
        const minPushDistance = 20;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Push horizontally
          if (deltaX > 0) {
            newStepX = Math.max(draggedRight + minPushDistance, step.x + pushDistance);
          } else {
            newStepX = Math.min(draggedLeft - step.stepSize.width - minPushDistance, step.x - pushDistance);
          }
        } else {
          // Push vertically  
          if (deltaY > 0) {
            newStepY = Math.max(draggedBottom + minPushDistance, step.y + pushDistance);
          } else {
            newStepY = Math.min(draggedTop - step.stepSize.height - minPushDistance, step.y - pushDistance);
          }
        }
        
        // Keep pushed step within canvas bounds
        newStepX = Math.max(0, Math.min(newStepX, canvasWidth - step.stepSize.width));
        newStepY = Math.max(0, Math.min(newStepY, canvasHeight - step.stepSize.height));
        
        stepsToMove.push({ 
          stepId: step.id, 
          newX: newStepX, 
          newY: newStepY,
          originalX: step.x,
          originalY: step.y
        });
      }
    }
    
    // Apply smooth CSS transitions for pushed steps
    if (stepsToMove.length > 0) {
      setObjects(prev => prev.map(obj => {
        const movedStep = stepsToMove.find(moved => moved.stepId === obj.id);
        if (movedStep) {
          const deltaX = movedStep.newX - obj.x;
          const deltaY = movedStep.newY - obj.y;
          
          // Update step position smoothly
          const updatedStep = { ...obj, x: movedStep.newX, y: movedStep.newY };
          
          // Move internal objects together with the step
          setTimeout(() => {
            setObjects(current => current.map(innerObj => {
              if (innerObj.isInStep === obj.id) {
                return { ...innerObj, x: innerObj.x + deltaX, y: innerObj.y + deltaY };
              }
              return innerObj;
            }));
          }, 50); // Small delay for smoother animation
          
          return updatedStep;
        }
        return obj;
      }));
    }
    
    return { boundedX, boundedY };
  }, [objects]);

  // Grid snap function
  const snapToGrid = (x: number, y: number, gridSize: number = 10) => {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  // Enhanced step internal grid snap function with collision detection
  const snapToExpandedStepGrid = (x: number, y: number, stepObj: CanvasObject, objectSize: { width: number; height: number } = { width: 2, height: 2 }) => {
    if (!stepObj.stepSize) return { x, y, localX: 0, localY: 0, valid: false, occupiedCells: [] };
    
    const { cols, rows } = getStepGridSize(stepObj);
    
    // Expanded step is 3x the actual size
    const zoomFactor = 3;
    const expandedWidth = stepObj.stepSize.width * zoomFactor;
    const expandedHeight = stepObj.stepSize.height * zoomFactor;
    const gridCellWidth = expandedWidth / cols;
    const gridCellHeight = expandedHeight / rows;
    
    // Snap to grid
    const snappedCol = Math.max(0, Math.min(cols - objectSize.width, Math.round(x / gridCellWidth)));
    const snappedRow = Math.max(0, Math.min(rows - objectSize.height, Math.round(y / gridCellHeight)));
    
    // Calculate occupied cells for visual feedback
    const occupiedCells: { x: number; y: number }[] = [];
    for (let row = snappedRow; row < snappedRow + objectSize.height; row++) {
      for (let col = snappedCol; col < snappedCol + objectSize.width; col++) {
        occupiedCells.push({ x: col, y: row });
      }
    }
    
    // Enhanced collision detection
    const conflictingObjects = objects.filter(obj => 
      obj.id !== draggedObject?.id && 
      obj.isInStep === stepObj.id &&
      obj.stepLocalX !== undefined && obj.stepLocalY !== undefined &&
      obj.stepLocalX < snappedCol + objectSize.width &&
      obj.stepLocalX + (obj.gridSize?.width || 2) > snappedCol &&
      obj.stepLocalY < snappedRow + objectSize.height &&
      obj.stepLocalY + (obj.gridSize?.height || 2) > snappedRow
    );
    
    const isValidPosition = conflictingObjects.length === 0;
    
    return {
      x: snappedCol * gridCellWidth,
      y: snappedRow * gridCellHeight,
      localX: snappedCol,
      localY: snappedRow,
      valid: isValidPosition,
      occupiedCells
    };
  };

  // Step internal grid snap function (for regular canvas)
  const snapToStepGrid = (x: number, y: number, stepObj: CanvasObject, objectSize: { width: number; height: number } = { width: 2, height: 2 }) => {
    if (!stepObj.stepSize) return { x, y, localX: 0, localY: 0, valid: false };
    
    const stepX = stepObj.x;
    const stepY = stepObj.y;
    const { cols, rows } = getStepGridSize(stepObj);
    
    // Step internal grid size
    const gridCellWidth = stepObj.stepSize.width / cols;
    const gridCellHeight = stepObj.stepSize.height / rows;
    
    // Convert to step internal relative coordinates
    const relativeX = x - stepX;
    const relativeY = y - stepY;
    
    // Snap to grid
    const snappedCol = Math.max(0, Math.min(cols - objectSize.width, Math.round(relativeX / gridCellWidth)));
    const snappedRow = Math.max(0, Math.min(rows - objectSize.height, Math.round(relativeY / gridCellHeight)));
    
    // Collision detection
    const isValidPosition = !objects.some(obj => 
      obj.id !== draggedObject?.id && 
      obj.isInStep === stepObj.id &&
      obj.stepLocalX !== undefined && obj.stepLocalY !== undefined &&
      obj.stepLocalX < snappedCol + objectSize.width &&
      obj.stepLocalX + (obj.gridSize?.width || 2) > snappedCol &&
      obj.stepLocalY < snappedRow + objectSize.height &&
      obj.stepLocalY + (obj.gridSize?.height || 2) > snappedRow
    );
    
    return {
      x: stepX + (snappedCol * gridCellWidth),
      y: stepY + (snappedRow * gridCellHeight),
      localX: snappedCol,
      localY: snappedRow,
      valid: isValidPosition
    };
  };

  // Step area collision check
  const isPointInStep = (x: number, y: number, stepObj: CanvasObject) => {
    if (!stepObj.stepSize) return false;
    return x >= stepObj.x && 
           x <= stepObj.x + stepObj.stepSize.width && 
           y >= stepObj.y && 
           y <= stepObj.y + stepObj.stepSize.height;
  };

  // Icon data (all icons are 2x2)
  const iconCategories = [
    { id: 'all', name: '전체', icon: '🔍' },
    { id: 'travel', name: '여행', icon: '✈️' },
    { id: 'fitness', name: '운동', icon: '💪' },
    { id: 'work', name: '업무', icon: '💼' },
    { id: 'food', name: '음식', icon: '🍽️' },
    { id: 'home', name: '생활', icon: '🏠' },
    { id: 'study', name: '학습', icon: '📚' }
  ];

  const availableIcons = [
    // Travel icons
    { id: 'plane', icon: '✈️', name: '비행기', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'luggage', icon: '🧳', name: '캐리어', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'passport', icon: '📄', name: '여권', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'camera', icon: '📷', name: '카메라', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'map', icon: '🗺️', name: '지도', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'hotel', icon: '🏨', name: '호텔', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'car', icon: '🚗', name: '자동차', category: 'travel', gridSize: { width: 2, height: 2 } },
    { id: 'train', icon: '🚄', name: '기차', category: 'travel', gridSize: { width: 2, height: 2 } },
    
    // Fitness icons
    { id: 'dumbbell', icon: '🏋️', name: '덤벨', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'shoe', icon: '👟', name: '운동화', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'water', icon: '💧', name: '물', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'towel', icon: '🏃', name: '수건', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'timer', icon: '⏰', name: '타이머', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'yoga', icon: '🧘', name: '요가', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'bicycle', icon: '🚴', name: '자전거', category: 'fitness', gridSize: { width: 2, height: 2 } },
    { id: 'swimming', icon: '🏊', name: '수영', category: 'fitness', gridSize: { width: 2, height: 2 } },
    
    // Work icons
    { id: 'laptop', icon: '💻', name: '노트북', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'phone', icon: '📱', name: '휴대폰', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'document', icon: '📄', name: '문서', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'pen', icon: '✏️', name: '펜', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'briefcase', icon: '💼', name: '서류가방', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'meeting', icon: '👥', name: '회의', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'calendar', icon: '📅', name: '달력', category: 'work', gridSize: { width: 2, height: 2 } },
    { id: 'email', icon: '📧', name: '이메일', category: 'work', gridSize: { width: 2, height: 2 } },
    
    // Food icons
    { id: 'apple', icon: '🍎', name: '사과', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'bread', icon: '🍞', name: '빵', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'milk', icon: '🥛', name: '우유', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'coffee', icon: '☕', name: '커피', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'pizza', icon: '🍕', name: '피자', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'salad', icon: '🥗', name: '샐러드', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'rice', icon: '🍚', name: '밥', category: 'food', gridSize: { width: 2, height: 2 } },
    { id: 'soup', icon: '🍲', name: '찌개', category: 'food', gridSize: { width: 2, height: 2 } },
    
    // Home icons
    { id: 'home', icon: '🏠', name: '집', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'bed', icon: '🛏️', name: '침대', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'shower', icon: '🚿', name: '샤워', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'laundry', icon: '🧺', name: '세탁', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'cleaning', icon: '🧹', name: '청소', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'cooking', icon: '🍳', name: '요리', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'shopping', icon: '🛒', name: '쇼핑', category: 'home', gridSize: { width: 2, height: 2 } },
    { id: 'plant', icon: '🌱', name: '식물', category: 'home', gridSize: { width: 2, height: 2 } },
    
    // Study icons
    { id: 'book', icon: '📚', name: '책', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'pencil', icon: '✏️', name: '연필', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'notebook', icon: '📓', name: '노트', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'calculator', icon: '🧮', name: '계산기', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'globe', icon: '🌍', name: '지구본', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'graduation', icon: '🎓', name: '졸업모', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'microscope', icon: '🔬', name: '현미경', category: 'study', gridSize: { width: 2, height: 2 } },
    { id: 'test', icon: '📝', name: '시험', category: 'study', gridSize: { width: 2, height: 2 } }
  ];

  // Filtered icons
  const filteredIcons = availableIcons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                         icon.icon.includes(iconSearchTerm);
    const matchesCategory = selectedIconCategory === 'all' || icon.category === selectedIconCategory;
    return matchesSearch && matchesCategory;
  });

  // Step grid size options
  const stepSizes = [
    { id: '2x2', name: '2x2 기본', width: 2, height: 2, icon: '▦' },
    { id: '3x3', name: '3x3 중간', width: 3, height: 3, icon: '▦' },
    { id: '4x4', name: '4x4 큰', width: 4, height: 4, icon: '■' },
    { id: '5x6', name: '5x6 와이드', width: 5, height: 6, icon: '▬' },
    { id: '7x12', name: '7x12 메가', width: 7, height: 12, icon: '▭' }
  ];

  // Color palette
  const colorPalette = [
    '#4F46E5', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#000000'  // Black
  ];

  // Background gradient options
  const backgroundGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  ];

  // ESC key event handler
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedStep(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  // Initial template setup
  useEffect(() => {
    if (isQuickCreate && templateType) {
      const templateTitles: { [key: string]: string } = {
        'workout': 'FITNESS KIT',
        'travel': 'TRAVEL KIT',
        'survival': 'SURVIVAL KIT',
        'project': 'PROJECT KIT',
        'study': 'STUDY KIT',
        'moving': 'MOVING KIT'
      };
      setTemplateTitle(templateTitles[templateType] || '할일 템플릿');
      
      const templateBackgrounds: { [key: string]: string } = {
        'workout': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        'travel': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'survival': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        'project': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        'study': 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
        'moving': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      };
      setCanvasBackground(templateBackgrounds[templateType] || canvasBackground);

      // Initial steps and icons for poster templates
      if (['workout', 'travel', 'survival'].includes(templateType)) {
        const initialObjects: CanvasObject[] = [
          // Main title
          {
            id: 'title-' + Date.now(),
            type: 'text',
            x: 50,
            y: 50,
            content: templateTitles[templateType],
            color: '#ffffff',
            fontSize: 32,
            fontWeight: 'bold',
            rotation: 0,
            name: '제목'
          },
          // Step areas
          {
            id: 'step1-' + Date.now(),
            type: 'step',
            x: 100,
            y: 150,
            content: '4x4 스텝',
            stepSize: { width: 160, height: 160 },
            stepColor: '#4F46E5',
            stepOrder: 1,
            stepItems: [],
            depth3D: 40,
            name: 'STEP 1'
          },
          {
            id: 'step2-' + (Date.now() + 1),
            type: 'step',
            x: 350,
            y: 150,
            content: '4x4 스텝',
            stepSize: { width: 160, height: 160 },
            stepColor: '#EF4444',
            stepOrder: 2,
            stepItems: [],
            depth3D: 40,
            name: 'STEP 2'
          },
          {
            id: 'step3-' + (Date.now() + 2),
            type: 'step',
            x: 100,
            y: 350,
            content: '4x4 스텝',
            stepSize: { width: 160, height: 160 },
            stepColor: '#10B981',
            stepOrder: 3,
            stepItems: [],
            depth3D: 40,
            name: 'STEP 3'
          },
          {
            id: 'step4-' + (Date.now() + 3),
            type: 'step',
            x: 350,
            y: 350,
            content: '4x4 스텝',
            stepSize: { width: 160, height: 160 },
            stepColor: '#F59E0B',
            stepOrder: 4,
            stepItems: [],
            depth3D: 40,
            name: 'STEP 4'
          }
        ];
        setObjects(initialObjects);
      }
    }
  }, [isQuickCreate, templateType]);

  // Step click handler (expansion is button-only)
  const handleStepClick = (stepId: string) => {
    setSelectedObject(stepId);
  };

  // Step expansion toggle
  const toggleStepExpansion = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
    setSelectedObject(stepId);
  };

  // Right-click context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, object: CanvasObject) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuObject(object);
    setShowContextMenu(true);
  }, []);

  // Enhanced expanded step drag handling with visual feedback
  const handleExpandedStepMouseDown = useCallback((e: React.MouseEvent, object: CanvasObject) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!expandedStepRef.current || !expandedStep) return;

    const stepObj = objects.find(obj => obj.id === expandedStep);
    if (!stepObj) return;

    const { cols, rows } = getStepGridSize(stepObj);
    const zoomFactor = 3;
    const expandedWidth = stepObj.stepSize!.width * zoomFactor;
    const expandedHeight = stepObj.stepSize!.height * zoomFactor;
    const gridCellWidth = expandedWidth / cols;
    const gridCellHeight = expandedHeight / rows;

    const rect = expandedStepRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - ((object.stepLocalX || 0) * gridCellWidth);
    const offsetY = e.clientY - rect.top - ((object.stepLocalY || 0) * gridCellHeight);
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedObject(object);
    setSelectedObject(object.id);
    setIsDragging(true);
  }, [expandedStep, objects]);

  // Enhanced expanded step drag move handling with improved visual feedback
  const handleExpandedStepMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedObject || !expandedStepRef.current || !expandedStep) return;
    
    const rect = expandedStepRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    const stepObj = objects.find(obj => obj.id === expandedStep);
    if (stepObj) {
      const snappedPos = snapToExpandedStepGrid(newX, newY, stepObj, draggedObject.gridSize);
      setDragPreview({ 
        x: snappedPos.x, 
        y: snappedPos.y, 
        valid: snappedPos.valid,
        occupiedCells: snappedPos.occupiedCells 
      });
    }
  }, [isDragging, draggedObject, dragOffset, expandedStep, objects]);

  // Expanded step drag end handling
  const handleExpandedStepMouseUp = useCallback(() => {
    if (!isDragging || !draggedObject || !expandedStep || !dragPreview) return;
    
    const stepObj = objects.find(obj => obj.id === expandedStep);
    if (stepObj && dragPreview.valid) {
      const snappedPos = snapToExpandedStepGrid(dragPreview.x, dragPreview.y, stepObj, draggedObject.gridSize);
      
      // Update step internal local coordinates
      setObjects(prev => prev.map(obj => 
        obj.id === draggedObject.id 
          ? { 
              ...obj, 
              stepLocalX: snappedPos.localX,
              stepLocalY: snappedPos.localY,
              // Also update actual canvas coordinates
              x: stepObj.x + (snappedPos.localX * (stepObj.stepSize!.width / getStepGridSize(stepObj).cols)),
              y: stepObj.y + (snappedPos.localY * (stepObj.stepSize!.height / getStepGridSize(stepObj).rows))
            }
          : obj
      ));
    }
    
    setIsDragging(false);
    setDraggedObject(null);
    setDragOffset({ x: 0, y: 0 });
    setDragPreview(null);
  }, [isDragging, draggedObject, expandedStep, dragPreview, objects]);

  // Improved drag start (regular canvas)
  const handleMouseDown = useCallback((e: React.MouseEvent, object: CanvasObject) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Step internal icons cannot be dragged on canvas
    if (object.isInStep && object.type === 'icon') {
      return;
    }

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - object.x;
    const offsetY = e.clientY - rect.top - object.y;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedObject(object);
    setSelectedObject(object.id);
    setIsDragging(true);
  }, []);

  // Enhanced drag move with collision detection (regular canvas)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedObject || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    if (draggedObject.type === 'step' && draggedObject.stepSize) {
      // Enhanced step dragging with smooth push-away animation
      const { boundedX, boundedY } = pushAwayOverlappingSteps(draggedObject.id, newX, newY, draggedObject.stepSize);
      
      // Apply smooth CSS transition for the dragged step
      setObjects(prev => prev.map(obj => {
        if (obj.id === draggedObject.id) {
          return { 
            ...obj, 
            x: boundedX, 
            y: boundedY,
            // Add temporary CSS transition class
            style: {
              transition: 'transform 300ms cubic-bezier(0.23, 1, 0.32, 1)'
            }
          };
        }
        return obj;
      }));
    } else if (draggedObject.type === 'icon') {
      // Icon drag with step area detection
      const stepsInCanvas = objects.filter(obj => obj.type === 'step');
      let targetStep: CanvasObject | null = null;
      
      for (const step of stepsInCanvas) {
        if (isPointInStep(newX + 20, newY + 20, step)) { // Center point check
          targetStep = step;
          break;
        }
      }
      
      if (targetStep) {
        // Snapping to step internal grid
        const snappedPos = snapToStepGrid(newX, newY, targetStep, draggedObject.gridSize);
        
        setObjects(prev => prev.map(obj => 
          obj.id === draggedObject.id 
            ? { 
                ...obj, 
                x: snappedPos.x, 
                y: snappedPos.y,
                isInStep: targetStep!.id,
                stepLocalX: snappedPos.localX,
                stepLocalY: snappedPos.localY
              }
            : obj
        ));
      } else {
        // Free canvas dragging with grid snap
        const snapped = snapToGrid(newX, newY);
        setObjects(prev => prev.map(obj => 
          obj.id === draggedObject.id 
            ? { 
                ...obj, 
                x: snapped.x, 
                y: snapped.y,
                isInStep: undefined,
                stepLocalX: undefined,
                stepLocalY: undefined
              }
            : obj
        ));
      }
    } else {
      // Text or other objects
      const snapped = snapToGrid(newX, newY);
      setObjects(prev => prev.map(obj => 
        obj.id === draggedObject.id ? { ...obj, x: snapped.x, y: snapped.y } : obj
      ));
    }
  }, [isDragging, draggedObject, dragOffset, objects, pushAwayOverlappingSteps]);

  // Drag end handling
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Remove temporary transition styles after a brief delay
      setTimeout(() => {
        setObjects(prev => prev.map(obj => ({
          ...obj,
          style: undefined
        })));
      }, 350);
    }
    
    setIsDragging(false);
    setDraggedObject(null);
    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, draggedObject]);

  // Add new icon
  const addIcon = (iconData: any) => {
    const newIcon: CanvasObject = {
      id: 'icon-' + Date.now(),
      type: 'icon',
      x: 100,
      y: 200,
      content: iconData.icon,
      name: iconData.name,
      gridSize: iconData.gridSize,
      color: '#000000'
    };
    setObjects(prev => [...prev, newIcon]);
    setSelectedObject(newIcon.id);
  };

  // Add new text
  const addText = () => {
    const newText: CanvasObject = {
      id: 'text-' + Date.now(),
      type: 'text',
      x: 50,
      y: 100,
      content: '새 텍스트',
      color: '#000000',
      fontSize: 16,
      fontWeight: 'normal',
      name: '텍스트'
    };
    setObjects(prev => [...prev, newText]);
    setSelectedObject(newText.id);
  };

  // Add new step
  const addStep = (size: any) => {
    const newStep: CanvasObject = {
      id: 'step-' + Date.now(),
      type: 'step',
      x: 50,
      y: 150,
      content: `${size.width}x${size.height} 스텝`,
      stepSize: { width: size.width * 40, height: size.height * 40 },
      stepColor: '#4F46E5',
      stepOrder: objects.filter(obj => obj.type === 'step').length + 1,
      stepItems: [],
      depth3D: 40,
      name: `STEP ${objects.filter(obj => obj.type === 'step').length + 1}`
    };
    setObjects(prev => [...prev, newStep]);
    setSelectedObject(newStep.id);
    setShowStepGridModal(false);
  };

  // Delete object
  const deleteObject = (objectId: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    if (selectedObject === objectId) {
      setSelectedObject(null);
    }
    setShowContextMenu(false);
  };

  // Duplicate object
  const duplicateObject = (objectId: string) => {
    const objectToDuplicate = objects.find(obj => obj.id === objectId);
    if (objectToDuplicate) {
      const duplicatedObject: CanvasObject = {
        ...objectToDuplicate,
        id: objectToDuplicate.type + '-' + Date.now(),
        x: objectToDuplicate.x + 20,
        y: objectToDuplicate.y + 20,
        name: (objectToDuplicate.name || objectToDuplicate.content) + ' 복사본'
      };
      setObjects(prev => [...prev, duplicatedObject]);
      setSelectedObject(duplicatedObject.id);
    }
    setShowContextMenu(false);
  };

  // Update object property
  const updateObjectProperty = (objectId: string, property: string, value: any) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId ? { ...obj, [property]: value } : obj
    ));
  };

  // Start editing text
  const startEditingText = (object: CanvasObject) => {
    if (object.type === 'text') {
      setEditingText(object);
    }
  };

  // Save text edit
  const saveTextEdit = (newContent: string) => {
    if (editingText) {
      updateObjectProperty(editingText.id, 'content', newContent);
      setEditingText(null);
    }
  };

  // Selected object
  const selectedObj = objects.find(obj => obj.id === selectedObject);

  // Custom color input handler
  const handleCustomColorChange = (color: string) => {
    setCustomColorValue(color);
    if (selectedObject) {
      if (selectedObj?.type === 'step') {
        updateObjectProperty(selectedObject, 'stepColor', color);
      } else {
        updateObjectProperty(selectedObject, 'color', color);
      }
    }
  };

  // Apply custom color
  const applyCustomColor = () => {
    if (selectedObject) {
      if (selectedObj?.type === 'step') {
        updateObjectProperty(selectedObject, 'stepColor', customColorValue);
      } else {
        updateObjectProperty(selectedObject, 'color', customColorValue);
      }
    }
    setShowColorPicker(false);
  };

  // Render Object Properties Panel
  const renderObjectProperties = () => {
    if (!selectedObj) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
          <Box className="h-12 w-12 mb-4 opacity-50" />
          <p>객체를 선택해주세요</p>
          <p className="text-sm mt-2">캔버스에서 객체를 클릭하면<br/>속성을 편집할 수 있습니다</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Object Info */}
        <div>
          <Label className="text-sm font-medium mb-2 block">객체 정보</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">이름</Label>
              <Input
                value={selectedObj.name || selectedObj.content}
                onChange={(e) => updateObjectProperty(selectedObj.id, 'name', e.target.value)}
                className="mt-1"
                placeholder="객체 이름"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">X 위치</Label>
                <Input
                  type="number"
                  value={Math.round(selectedObj.x)}
                  onChange={(e) => updateObjectProperty(selectedObj.id, 'x', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Y 위치</Label>
                <Input
                  type="number"
                  value={Math.round(selectedObj.y)}
                  onChange={(e) => updateObjectProperty(selectedObj.id, 'y', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {selectedObj.type === 'text' && (
          <div>
            <Label className="text-sm font-medium mb-2 block">텍스트</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600">내용</Label>
                <Input
                  value={selectedObj.content}
                  onChange={(e) => updateObjectProperty(selectedObj.id, 'content', e.target.value)}
                  className="mt-1"
                  placeholder="텍스트 내용"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">크기</Label>
                  <Input
                    type="number"
                    value={selectedObj.fontSize || 16}
                    onChange={(e) => updateObjectProperty(selectedObj.id, 'fontSize', parseInt(e.target.value) || 16)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">굵기</Label>
                  <Select
                    value={selectedObj.fontWeight || 'normal'}
                    onValueChange={(value) => updateObjectProperty(selectedObj.id, 'fontWeight', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">보통</SelectItem>
                      <SelectItem value="bold">굵게</SelectItem>
                      <SelectItem value="lighter">얇게</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Properties */}
        {selectedObj.type === 'step' && (
          <div>
            <Label className="text-sm font-medium mb-2 block">스텝</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600">스텝 이름</Label>
                <Input
                  value={selectedObj.name || `STEP ${selectedObj.stepOrder || 1}`}
                  onChange={(e) => updateObjectProperty(selectedObj.id, 'name', e.target.value)}
                  className="mt-1"
                  placeholder="스텝 이름"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">너비</Label>
                  <Input
                    type="number"
                    value={selectedObj.stepSize?.width || 160}
                    onChange={(e) => updateObjectProperty(selectedObj.id, 'stepSize', {
                      ...selectedObj.stepSize,
                      width: parseInt(e.target.value) || 160
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">높이</Label>
                  <Input
                    type="number"
                    value={selectedObj.stepSize?.height || 160}
                    onChange={(e) => updateObjectProperty(selectedObj.id, 'stepSize', {
                      ...selectedObj.stepSize,
                      height: parseInt(e.target.value) || 160
                    })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">3D 깊이</Label>
                <Slider
                  value={[selectedObj.depth3D || 40]}
                  onValueChange={([value]) => updateObjectProperty(selectedObj.id, 'depth3D', value)}
                  max={80}
                  min={0}
                  step={5}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{selectedObj.depth3D || 40}px</div>
              </div>
            </div>
          </div>
        )}

        {/* Color Properties */}
        <div>
          <Label className="text-sm font-medium mb-2 block">색상</Label>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className="h-8 w-full rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (selectedObj.type === 'step') {
                      updateObjectProperty(selectedObj.id, 'stepColor', color);
                    } else {
                      updateObjectProperty(selectedObj.id, 'color', color);
                    }
                  }}
                />
              ))}
            </div>
            
            {/* Custom Color Picker */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={customColorValue}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={customColorValue}
                  onChange={(e) => setCustomColorValue(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
                <Button
                  size="sm"
                  onClick={applyCustomColor}
                  className="px-3"
                >
                  적용
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">작업</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateObject(selectedObj.id)}
              className="flex-1"
            >
              <Copy className="h-3 w-3 mr-1" />
              복제
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteObject(selectedObj.id)}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              삭제
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            {/* Editable Title */}
            <div className="relative group">
              {isEditingTitle ? (
                <Input
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-xl font-bold border-none p-0 h-auto bg-transparent focus:bg-white focus:border focus:rounded focus:px-2 focus:py-1"
                  autoFocus
                />
              ) : (
                <div
                  className="text-xl font-bold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors group"
                  onClick={() => setIsEditingTitle(true)}
                  onMouseEnter={() => setIsHoveringTitle(true)}
                  onMouseLeave={() => setIsHoveringTitle(false)}
                >
                  {templateTitle}
                  {isHoveringTitle && (
                    <Edit className="inline-block h-4 w-4 ml-2 opacity-50" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? '편집' : '미리보기'}
            </Button>
            
            <Button
              size="sm"
              onClick={onSave}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              저장
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar - Tools */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Object">객체</TabsTrigger>
                <TabsTrigger value="Property">속성</TabsTrigger>
              </TabsList>
              
              <TabsContent value="Object" className="mt-4 space-y-4">
                {/* Add Text */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">텍스트</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addText}
                    className="w-full justify-start"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    텍스트 추가
                  </Button>
                </div>

                {/* Add Step */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">스텝</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStepGridModal(true)}
                    className="w-full justify-start"
                  >
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    스텝 추가
                  </Button>
                </div>

                {/* Add Icons */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">아이콘</Label>
                  
                  {/* Icon Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="아이콘 검색..."
                      value={iconSearchTerm}
                      onChange={(e) => setIconSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {iconCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedIconCategory(category.id)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedIconCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {category.icon} {category.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                    {filteredIcons.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => addIcon(icon)}
                        onMouseEnter={() => setHoveredIcon(icon.id)}
                        onMouseLeave={() => setHoveredIcon(null)}
                        className="aspect-square flex items-center justify-center text-lg bg-gray-50 hover:bg-blue-50 rounded border transition-colors relative group"
                        title={icon.name}
                      >
                        {icon.icon}
                        {hoveredIcon === icon.id && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                            {icon.name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {filteredIcons.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>검색 결과가 없습니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="Property" className="mt-4">
                {renderObjectProperties()}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
            <div className="relative">
              {/* Canvas */}
              <div
                ref={canvasRef}
                className="relative bg-white shadow-lg"
                style={{
                  width: '600px',
                  height: '800px',
                  background: canvasBackground,
                  transform: showPreview ? 'scale(0.8)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                  overflow: 'hidden'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Grid Lines */}
                {showGridLines && !showPreview && (
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                )}

                {/* Canvas Objects */}
                {objects.map((obj) => (
                  <div key={obj.id}>
                    {obj.type === 'text' && (
                      <div
                        className={`absolute cursor-pointer select-none ${
                          selectedObject === obj.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          left: obj.x,
                          top: obj.y,
                          color: obj.color,
                          fontSize: obj.fontSize,
                          fontWeight: obj.fontWeight,
                          transform: `rotate(${obj.rotation || 0}deg)`,
                          transformOrigin: 'center',
                          // Apply smooth transition if it's being moved
                          transition: obj.style?.transition || 'none'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, obj)}
                        onClick={() => setSelectedObject(obj.id)}
                        onDoubleClick={() => startEditingText(obj)}
                        onContextMenu={(e) => handleContextMenu(e, obj)}
                      >
                        {editingText?.id === obj.id ? (
                          <Input
                            value={obj.content}
                            onChange={(e) => updateObjectProperty(obj.id, 'content', e.target.value)}
                            onBlur={() => setEditingText(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingText(null);
                              }
                            }}
                            className="border-none p-0 h-auto bg-transparent"
                            style={{
                              color: obj.color,
                              fontSize: obj.fontSize,
                              fontWeight: obj.fontWeight,
                            }}
                            autoFocus
                          />
                        ) : (
                          obj.content
                        )}
                      </div>
                    )}

                    {obj.type === 'icon' && (
                      <div
                        className={`absolute cursor-pointer select-none flex items-center justify-center ${
                          selectedObject === obj.id ? 'ring-2 ring-blue-500' : ''
                        } ${obj.isInStep ? 'opacity-80' : ''}`}
                        style={{
                          left: obj.x,
                          top: obj.y,
                          width: (obj.gridSize?.width || 2) * 20,
                          height: (obj.gridSize?.height || 2) * 20,
                          fontSize: '24px',
                          transform: `rotate(${obj.rotation || 0}deg)`,
                          transformOrigin: 'center',
                          // Apply smooth transition if it's being moved
                          transition: obj.style?.transition || 'none'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, obj)}
                        onClick={() => setSelectedObject(obj.id)}
                        onContextMenu={(e) => handleContextMenu(e, obj)}
                      >
                        {obj.content}
                      </div>
                    )}

                    {obj.type === 'step' && (
                      <div
                        className={`absolute cursor-pointer ${
                          selectedObject === obj.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          left: obj.x,
                          top: obj.y,
                          width: obj.stepSize?.width,
                          height: obj.stepSize?.height,
                          // Apply smooth transition if it's being moved
                          transition: obj.style?.transition || 'none'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, obj)}
                        onClick={() => handleStepClick(obj.id)}
                        onMouseEnter={() => setHoveredStep(obj.id)}
                        onMouseLeave={() => setHoveredStep(null)}
                        onContextMenu={(e) => handleContextMenu(e, obj)}
                      >
                        {/* 3D Step Rendering */}
                        {is3DView ? (
                          <div className="relative">
                            {/* Main step face */}
                            <div
                              className="absolute inset-0 rounded-lg shadow-lg flex items-center justify-center border-2 border-white/30"
                              style={{
                                backgroundColor: obj.stepColor,
                                color: 'white',
                              }}
                            >
                              <div className="text-center">
                                <div className="text-sm font-bold mb-1">
                                  {obj.name || `STEP ${obj.stepOrder}`}
                                </div>
                                {showGridLines && (
                                  <div className="text-xs opacity-70">
                                    {getStepGridSize(obj).cols}×{getStepGridSize(obj).rows}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 3D depth effect */}
                            <div
                              className="absolute rounded-lg"
                              style={{
                                top: -obj.depth3D! / 2,
                                right: -obj.depth3D! / 2,
                                width: obj.stepSize?.width,
                                height: obj.depth3D,
                                backgroundColor: obj.stepColor,
                                opacity: 0.6,
                                transform: 'skewY(-30deg)',
                                transformOrigin: 'bottom'
                              }}
                            />
                            <div
                              className="absolute rounded-lg"
                              style={{
                                bottom: -obj.depth3D! / 2,
                                left: obj.depth3D! / 2,
                                width: obj.depth3D,
                                height: obj.stepSize?.height,
                                backgroundColor: obj.stepColor,
                                opacity: 0.4,
                                transform: 'skewX(-30deg)',
                                transformOrigin: 'top'
                              }}
                            />

                            {/* Step controls overlay */}
                            {(hoveredStep === obj.id || selectedObject === obj.id) && (
                              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStepExpansion(obj.id);
                                  }}
                                  className="bg-white/90 text-gray-800 hover:bg-white text-xs px-2 py-1"
                                >
                                  <Maximize className="h-3 w-3 mr-1" />
                                  확대
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // 2D Step Rendering
                          <div
                            className="w-full h-full rounded-lg shadow-lg flex items-center justify-center border-2 border-white/30"
                            style={{
                              backgroundColor: obj.stepColor,
                              color: 'white',
                            }}
                          >
                            <div className="text-center">
                              <div className="text-sm font-bold mb-1">
                                {obj.name || `STEP ${obj.stepOrder}`}
                              </div>
                              {showGridLines && (
                                <div className="text-xs opacity-70">
                                  {getStepGridSize(obj).cols}×{getStepGridSize(obj).rows}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Internal step grid lines (only when selected) */}
                        {showGridLines && selectedObject === obj.id && (
                          <div className="absolute inset-0 pointer-events-none">
                            <svg width="100%" height="100%" className="opacity-50">
                              <defs>
                                <pattern
                                  id={`step-grid-${obj.id}`}
                                  width={obj.stepSize!.width / getStepGridSize(obj).cols}
                                  height={obj.stepSize!.height / getStepGridSize(obj).rows}
                                  patternUnits="userSpaceOnUse"
                                >
                                  <path
                                    d={`M ${obj.stepSize!.width / getStepGridSize(obj).cols} 0 L 0 0 0 ${obj.stepSize!.height / getStepGridSize(obj).rows}`}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="1"
                                  />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#step-grid-${obj.id})`} />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Canvas Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGridLines(!showGridLines)}
                  className={`${showGridLines ? 'bg-blue-100' : ''}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIs3DView(!is3DView)}
                  className={`${is3DView ? 'bg-blue-100' : ''}`}
                  title={is3DView ? '2D 뷰로 전환' : '3D 뷰로 전환'}
                >
                  <Box className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Background Controls */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">배경:</Label>
              <div className="flex gap-2">
                {backgroundGradients.map((gradient, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      canvasBackground === gradient ? 'border-blue-500 scale-110' : 'border-gray-300'
                    }`}
                    style={{ background: gradient }}
                    onClick={() => setCanvasBackground(gradient)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Grid Size Modal */}
      <Dialog open={showStepGridModal} onOpenChange={setShowStepGridModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스텝 크기 선택</DialogTitle>
            <DialogDescription>
              새로운 스텝의 크기를 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            {stepSizes.map((size) => (
              <Card
                key={size.id}
                className={`cursor-pointer transition-all border-2 hover:border-blue-400 ${
                  hoveredStepSize === size.id ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                }`}
                onClick={() => addStep(size)}
                onMouseEnter={() => setHoveredStepSize(size.id)}
                onMouseLeave={() => setHoveredStepSize(null)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{size.icon}</div>
                  <div className="font-medium">{size.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {size.width * 40}×{size.height * 40}px
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Context Menu */}
      {showContextMenu && contextMenuObject && (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div 
              className="fixed"
              style={{ 
                left: contextMenuPosition.x, 
                top: contextMenuPosition.y,
                width: 1,
                height: 1 
              }}
            />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => duplicateObject(contextMenuObject.id)}>
              <Copy className="h-4 w-4 mr-2" />
              복제
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              setSelectedObject(contextMenuObject.id);
              setShowContextMenu(false);
            }}>
              <Edit3 className="h-4 w-4 mr-2" />
              편집
            </ContextMenuItem>
            {contextMenuObject.type === 'step' && (
              <ContextMenuItem onClick={() => {
                toggleStepExpansion(contextMenuObject.id);
                setShowContextMenu(false);
              }}>
                <Maximize className="h-4 w-4 mr-2" />
                확대
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => deleteObject(contextMenuObject.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {/* Expanded Step Modal */}
      {expandedStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                스텝 편집: {objects.find(obj => obj.id === expandedStep)?.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  확대 3배
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedStep(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-8 flex items-center justify-center bg-gray-50">
              {(() => {
                const stepObj = objects.find(obj => obj.id === expandedStep);
                if (!stepObj || !stepObj.stepSize) return null;

                const { cols, rows } = getStepGridSize(stepObj);
                const zoomFactor = 3;
                const expandedWidth = stepObj.stepSize.width * zoomFactor;
                const expandedHeight = stepObj.stepSize.height * zoomFactor;
                const gridCellWidth = expandedWidth / cols;
                const gridCellHeight = expandedHeight / rows;

                return (
                  <div className="relative">
                    <div
                      ref={expandedStepRef}
                      className="relative bg-white border-2 border-gray-300 rounded-lg shadow-lg"
                      style={{
                        width: expandedWidth,
                        height: expandedHeight,
                        backgroundColor: stepObj.stepColor,
                        backgroundImage: `
                          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: `${gridCellWidth}px ${gridCellHeight}px`
                      }}
                      onMouseMove={handleExpandedStepMouseMove}
                      onMouseUp={handleExpandedStepMouseUp}
                      onMouseLeave={handleExpandedStepMouseUp}
                    >
                      {/* Grid cells */}
                      {Array.from({ length: rows }).map((_, row) =>
                        Array.from({ length: cols }).map((_, col) => {
                          const isOccupied = objects.some(obj => 
                            obj.isInStep === expandedStep &&
                            obj.stepLocalX === col && 
                            obj.stepLocalY === row
                          );
                          
                          const isDragTarget = dragPreview?.occupiedCells?.some(cell => 
                            cell.x === col && cell.y === row
                          );

                          return (
                            <div
                              key={`${row}-${col}`}
                              className={`absolute border border-white/20 transition-all duration-150 ${
                                isOccupied ? 'bg-white/20' : ''
                              } ${
                                isDragTarget && dragPreview?.valid ? 'bg-green-400/40' : ''
                              } ${
                                isDragTarget && !dragPreview?.valid ? 'bg-red-400/40' : ''
                              }`}
                              style={{
                                left: col * gridCellWidth,
                                top: row * gridCellHeight,
                                width: gridCellWidth,
                                height: gridCellHeight
                              }}
                            />
                          );
                        })
                      )}

                      {/* Objects in this step */}
                      {objects.filter(obj => obj.isInStep === expandedStep).map((obj) => (
                        <div
                          key={obj.id}
                          className={`absolute cursor-move select-none flex items-center justify-center ${
                            selectedObject === obj.id ? 'ring-2 ring-blue-500' : ''
                          } ${isDragging && draggedObject?.id === obj.id ? 'opacity-50' : ''}`}
                          style={{
                            left: (obj.stepLocalX || 0) * gridCellWidth,
                            top: (obj.stepLocalY || 0) * gridCellHeight,
                            width: (obj.gridSize?.width || 2) * gridCellWidth,
                            height: (obj.gridSize?.height || 2) * gridCellHeight,
                            fontSize: `${24 * zoomFactor}px`,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '8px',
                            border: '2px solid rgba(255,255,255,0.5)'
                          }}
                          onMouseDown={(e) => handleExpandedStepMouseDown(e, obj)}
                          onClick={() => setSelectedObject(obj.id)}
                        >
                          {obj.content}
                        </div>
                      ))}

                      {/* Drag preview */}
                      {dragPreview && draggedObject && (
                        <div
                          className={`absolute pointer-events-none flex items-center justify-center ${
                            dragPreview.valid ? 'bg-green-400/60' : 'bg-red-400/60'
                          }`}
                          style={{
                            left: dragPreview.x,
                            top: dragPreview.y,
                            width: (draggedObject.gridSize?.width || 2) * gridCellWidth,
                            height: (draggedObject.gridSize?.height || 2) * gridCellHeight,
                            fontSize: `${24 * zoomFactor}px`,
                            borderRadius: '8px',
                            border: `2px solid ${dragPreview.valid ? '#10B981' : '#EF4444'}`
                          }}
                        >
                          {draggedObject.content}
                        </div>
                      )}
                    </div>

                    {/* Legend */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 text-sm space-y-2">
                      <div className="font-medium text-gray-800">범례</div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white/40 border border-white/60 rounded"></div>
                        <span className="text-gray-600">빈 공간</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white/60 border border-white/80 rounded"></div>
                        <span className="text-gray-600">사용 중</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-400/60 border border-green-500 rounded"></div>
                        <span className="text-gray-600">배치 가능</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-400/60 border border-red-500 rounded"></div>
                        <span className="text-gray-600">충돌</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                아이콘을 드래그하여 위치를 조정하세요. ESC 키로 편집을 종료할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Context menu click outside handler */}
      {showContextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
}