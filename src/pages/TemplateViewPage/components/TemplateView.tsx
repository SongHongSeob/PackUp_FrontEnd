// import { useTemplateDetailStore } from "../../../stores/templateDetailStore";
import StepText from "./StepText";

// 전체 보드: 6x6
// ox, oy: 서브그리드의 좌상단 원점(px)
const PARTITIONS_BY_TOTAL_STEPS: Record<
    number,
    Record<number, { ox: number; oy: number; cols: number; rows: number }>
> = {
    1: {
        1: { ox: 235, oy: 275, cols: 6, rows: 6 },
    },
    2: {
        1: { ox: 135, oy: 245, cols: 3, rows: 6 },
        2: { ox: 435, oy: 245, cols: 3, rows: 6 },
    },
    3: {
        1: { ox: 135, oy: 195, cols: 3, rows: 3 },
        2: { ox: 135, oy: 485, cols: 3, rows: 3 },
        3: { ox: 445, oy: 240, cols: 3, rows: 6 },
    },
    4: {
        1: { ox: 155, oy: 190, cols: 3, rows: 3 },
        2: { ox: 155, oy: 485, cols: 3, rows: 3 },
        3: { ox: 460, oy: 190, cols: 3, rows: 3 },
        4: { ox: 460, oy: 485, cols: 3, rows: 3 },
    },
};

// 서브그리드에서의 오브젝트 좌표 계산
const localCellFromLocNum = (locNum: number, cols: number) => {
    const sx = ((locNum - 1) % cols) + 1;
    const sy = Math.floor((locNum - 1) / cols) + 1;
    return { sx, sy };
};

// 서브그리드(원점 ox,oy) + 로컬셀(sx,sy) = 글로벌셀(gx,gy)
const toGlobalCell = (ox: number, oy: number, sx: number, sy: number) => {
    const gx = ox + (sx - 1) * 42.5;
    const gy = oy - (sx - 1) * 25 + (sy - 1) * 50;
    return { gx, gy };
};

// 최종: 전체스텝수, 현재스텝번호, locNum -> 글로벌셀(gx,gy)
const resolveGlobalCell = (totalSteps: number, stepNo: number, locNum: number) => {
    const part = PARTITIONS_BY_TOTAL_STEPS[totalSteps]?.[stepNo];
    const { cols, rows, ox, oy } = part;
    const { sx, sy } = localCellFromLocNum(locNum, cols);
    // 서브그리드 범위 넘어갈 경우
    const sxClamped = Math.min(sx, cols);
    const syClamped = Math.min(sy, rows);

    return toGlobalCell(ox, oy, sxClamped, syClamped);
};

// 임시 오브젝트
const cells = [
    { totalSteps: 4, stepNo: 3, locNum: 5 },
    { totalSteps: 4, stepNo: 1, locNum: 1 },
    { totalSteps: 4, stepNo: 2, locNum: 3 }
];

// 스텝별 텍스트박스 데이터
type StackDef = { locNum: number; items: string[]; x: number; y: number };

const TEXT_STACKS: Record<number, StackDef[]> = {
    4: [
        { locNum: 1, items: ["스텝1 메모 A", "스텝1 메모 B"], x: 20, y: 35 },
        { locNum: 2, items: ["스텝2 메모 A"], x: 20, y: 437 },
        { locNum: 3, items: ["스텝3 메모 A", "스텝3 메모 B", "스텝3 메모 C"], x: 668, y: 52 },
        { locNum: 4, items: ["스텝4 메모 A"], x: 668, y: 430 },
    ],
};

// 텍스트박스 컴포넌트 (스큐 + 회전 적용)
const TextBox: React.FC<{ text: string }> = ({ text }) => (
    <div
        className="inline-block relative has-[.is-open]:z-[9999]"
        style={{
            transform: "skew(-30deg, 0deg) rotate(-30deg)",
            transformOrigin: "center",
            width: "110px",
            background: "transparent",
            border: "none",
            padding: 0,
        }}
    >
        <StepText text={text} />
    </div>
);

const TemplateView = () => {
    // const { templateData } = useTemplateDetailStore();
    // const backgroundImage = `/cate-${templateData?.templateCateNo}-step-${templateData?.stepsList.length}.svg`;
    // 서버 배경 이미지 경로: https://packupapi.xyz/images/background/daily/step4.svg
    const backgroundImage = '/cate-2-step-4.svg'; // 테스트용 고정 경로
    const totalSteps = 4; // 지금 배경과 맞춤

    return (
        <div className="relative mx-auto w-[800px] h-[800px] bg-white">
            <img draggable={false} className="absolute w-[800px] h-[800px] left-0 top-0" src={backgroundImage} />
            {/* 오브젝트 배치 */}
            {cells.map((cell, i) => {
                const { gx, gy } = resolveGlobalCell(cell.totalSteps, cell.stepNo, cell.locNum);
                return (
                    <img
                        key={i}
                        src="https://packup-api.kro.kr/images/object/daily/Backpack.png"
                        draggable={false} // 드래그 미리보기 방지
                        className="absolute"
                        style={{
                            left: `${gx}px`,
                            top: `${gy}px`,
                            zIndex: 40-i,
                            width: "83px",
                            height: "83px",
                        }}
                    />
                );
            })}
            {/* 스텝별 텍스트박스 */}
            {TEXT_STACKS[totalSteps].map((stack, i) =>
                stack.items.map((txt, idx) => (
                    <div
                        key={`${i}-${idx}`}
                        className="absolute"
                        style={{
                            left: stack.x,
                            top: stack.y + idx * 92, // 간격 포함 배치
                        }}
                    >
                        <TextBox text={txt} />
                    </div>
                ))
            )}
        </div>
    );
};

export default TemplateView;
