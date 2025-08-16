import TemplateCardSmall from "./TemplateCardSmall";
import type { TemplateListItem } from "../../../stores/templateListStore";
import { useNavigate } from "react-router-dom";

type TemplateGridProps = {
    templates: TemplateListItem[];
    onBookmarkToggle?: () => void;
};

const TemplateGrid: React.FC<TemplateGridProps> = ({ templates, onBookmarkToggle }) => {
    const navigate = useNavigate();
    
    // 템플릿 상세보기 페이지로 이동
    const handleDetail = (templateNo: number) => {
        navigate(`/template/${templateNo}/detail`);
    };
    
    // 4개씩 맞추기 위한 placeholder 계산
    const placeholderCount = templates.length % 4 === 0 ? 0 : 4 - (templates.length % 4);
    const placeholders = Array(placeholderCount).fill(null); // null을 placeholder로 사용
    const fullItems: (TemplateListItem | null)[] = [...templates, ...placeholders]; // 혼합 배열

    return (
        <div className="flex w-[1200px] flex-col items-center gap-[32px]">
            {Array.from({ length: Math.ceil(fullItems.length / 4) }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex justify-between items-center self-stretch">
                    {fullItems.slice(rowIdx * 4, rowIdx * 4 + 4).map((item, idx) =>
                        item ? (
                            <TemplateCardSmall
                            key={item.templateNo}
                            template={item}
                            onRename={() => {}}
                            onEdit={() => handleDetail(item.templateNo)}
                            onDuplicate={() => {}}
                            onDelete={() => {}}
                            onBookmarkToggle={onBookmarkToggle} />
                        ) : (
                            <div key={`placeholder-${rowIdx}-${idx}`} className="w-[276px] h-[374px] bg-transparent"></div>
                        )
                    )}
                </div>
            ))}
        </div>
    );
};

export default TemplateGrid;
