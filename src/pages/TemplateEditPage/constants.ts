import type { IconItem } from './types';

// 아이콘 리스트 데이터
export const iconList: IconItem[] = [
  // 업무 카테고리
  { id: 'usb', icon: '/1. 오브젝트/업무/100px/USB.png', label: 'USB', tags: ['전자기기', '저장'], category: '업무' },
  { id: 'laptop', icon: '/1. 오브젝트/업무/100px/노트북.png', label: '노트북', tags: ['전자기기', '컴퓨터'], category: '업무' },
  { id: 'key', icon: '/1. 오브젝트/업무/100px/열쇠.png', label: '열쇠', tags: ['도구', '보안'], category: '업무' },
  { id: 'wallet', icon: '/1. 오브젝트/업무/100px/지갑.png', label: '지갑', tags: ['액세서리', '금전'], category: '업무' },
  { id: 'glasses', icon: '/1. 오브젝트/업무/100px/안경.png', label: '안경', tags: ['액세서리', '시력'], category: '업무' },
  { id: 'notebook', icon: '/1. 오브젝트/업무/100px/노트.png', label: '노트', tags: ['문구', '작성'], category: '업무' },
  { id: 'briefcase', icon: '/1. 오브젝트/업무/100px/서류가방.png', label: '서류가방', tags: ['가방', '업무'], category: '업무' },
  { id: 'shirt', icon: '/1. 오브젝트/업무/100px/셔츠.png', label: '셔츠', tags: ['의류', '상의'], category: '업무' },
  { id: 'tumbler', icon: '/1. 오브젝트/업무/100px/텀블러.png', label: '텀블러', tags: ['음료', '보온'], category: '업무' },
  { id: 'watch', icon: '/1. 오브젝트/업무/100px/손목시계.png', label: '손목시계', tags: ['액세서리', '시간'], category: '업무' },
  { id: 'pencil', icon: '/1. 오브젝트/업무/100px/연필.png', label: '연필', tags: ['문구', '작성'], category: '업무' },
  { id: 'mirror', icon: '/1. 오브젝트/업무/100px/거울.png', label: '거울', tags: ['액세서리', '미용'], category: '업무' },
  { id: 'socks', icon: '/1. 오브젝트/업무/100px/양말.png', label: '양말', tags: ['의류', '신발'], category: '업무' },
  { id: 'comb', icon: '/1. 오브젝트/업무/100px/빗.png', label: '빗', tags: ['미용', '도구'], category: '업무' },
  { id: 'handkerchief', icon: '/1. 오브젝트/업무/100px/손수건.png', label: '손수건', tags: ['위생', '액세서리'], category: '업무' },
  { id: 'earphones', icon: '/1. 오브젝트/업무/100px/블루투스이어폰.png', label: '블루투스이어폰', tags: ['전자기기', '음악'], category: '업무' },
  { id: 'vitamin', icon: '/1. 오브젝트/업무/100px/비타민.png', label: '비타민', tags: ['건강', '영양'], category: '업무' },
  { id: 'lipstick', icon: '/1. 오브젝트/업무/100px/립스틱.png', label: '립스틱', tags: ['화장품', '미용'], category: '업무' },
  { id: 'pouch', icon: '/1. 오브젝트/업무/100px/파우치.png', label: '파우치', tags: ['수납', '액세서리'], category: '업무' },
  { id: 'umbrella', icon: '/1. 오브젝트/업무/100px/우산.png', label: '우산', tags: ['액세서리', '비'], category: '업무' },
  
  // 여행 카테고리
  { id: 'passport', icon: '/1. 오브젝트/여행/100px/여권.png', label: '여권', tags: ['문서', '신분증'], category: '여행' },
  { id: 'suitcase', icon: '/1. 오브젝트/여행/100px/캐리어.png', label: '캐리어', tags: ['가방', '수납'], category: '여행' },
  { id: 'hat', icon: '/1. 오브젝트/여행/100px/모자.png', label: '모자', tags: ['의류', '보호'], category: '여행' },
  { id: 'snack', icon: '/1. 오브젝트/여행/100px/간식.png', label: '간식', tags: ['음식', '에너지'], category: '여행' },
  { id: 'charger', icon: '/1. 오브젝트/여행/100px/충전기.png', label: '충전기', tags: ['전자기기', '전원'], category: '여행' },
  { id: 'lantern', icon: '/1. 오브젝트/여행/100px/랜턴.png', label: '랜턴', tags: ['전자기기', '조명'], category: '여행' },
  { id: 'tent', icon: '/1. 오브젝트/여행/100px/텐트.png', label: '텐트', tags: ['숙박', '캠핑'], category: '여행' },
  { id: 'sleeping-bag', icon: '/1. 오브젝트/여행/100px/침낭.png', label: '침낭', tags: ['숙박', '수면'], category: '여행' },
  { id: 'thermos', icon: '/1. 오브젝트/여행/100px/보온병.png', label: '보온병', tags: ['음료', '보온'], category: '여행' },
  { id: 'pillow-travel', icon: '/1. 오브젝트/여행/100px/목베게.png', label: '목베게', tags: ['수면', '편의'], category: '여행' },
  
  // 생활 카테고리 (일상으로 매핑)
  { id: 'mirror-daily', icon: '/1. 오브젝트/일상/100px/거울.png', label: '거울', tags: ['미용', '일상'], category: '생활' },
  { id: 'pot', icon: '/1. 오브젝트/일상/100px/냄비.png', label: '냄비', tags: ['요리', '주방'], category: '생활' },
  { id: 'toolbox', icon: '/1. 오브젝트/일상/100px/공구함.png', label: '공구함', tags: ['도구', '수리'], category: '생활' },
  { id: 'basket', icon: '/1. 오브젝트/일상/100px/바구니.png', label: '바구니', tags: ['수납', '정리'], category: '생활' },
  { id: 'soap', icon: '/1. 오브젝트/일상/100px/비누.png', label: '비누', tags: ['위생', '청소'], category: '생활' },
  { id: 'broom', icon: '/1. 오브젝트/일상/100px/빗자루.png', label: '빗자루', tags: ['청소', '정리'], category: '생활' },
  { id: 'flashlight', icon: '/1. 오브젝트/일상/100px/손전등.png', label: '손전등', tags: ['조명', '전자기기'], category: '생활' },
  { id: 'sponge', icon: '/1. 오브젝트/일상/100px/스펀지.png', label: '스펀지', tags: ['청소', '주방'], category: '생활' },
  { id: 'knife', icon: '/1. 오브젝트/일상/100px/식칼.png', label: '식칼', tags: ['요리', '주방'], category: '생활' },
  { id: 'clothes-hanger', icon: '/1. 오브젝트/일상/100px/옷걸이.png', label: '옷걸이', tags: ['정리', '세탁'], category: '생활' }
];

// 카테고리별 배경 이미지 설정
export const getCategoryBackground = (category: '업무' | '생활' | '여행') => {
  switch (category) {
    case '여행':
      return '/2. 배경/01 캐리어(여행)/캐리어-스텝1.svg';
    case '업무':
      return '/2. 배경/02 서류가방(업무)/서류가방-스텝1.svg';
    case '생활':
      return '/2. 배경/03 에코백(일상)/에코백-스텝1.svg';
    default:
      return '/2. 배경/01 캐리어(여행)/캐리어-스텝1.svg';
  }
};

// 스텝별 배경 이미지 설정
export const getStepBackground = (category: '업무' | '생활' | '여행', stepNumber: number) => {
  switch (category) {
    case '여행':
      return `/2. 배경/01 캐리어(여행)/캐리어-스텝${stepNumber}.svg`;
    case '업무':
      return `/2. 배경/02 서류가방(업무)/서류가방-스텝${stepNumber}.svg`;
    case '생활':
      return `/2. 배경/03 에코백(일상)/에코백-스텝${stepNumber}.svg`;
    default:
      return `/2. 배경/01 캐리어(여행)/캐리어-스텝${stepNumber}.svg`;
  }
};