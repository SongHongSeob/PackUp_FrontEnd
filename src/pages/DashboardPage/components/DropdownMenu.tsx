import { RenameIcon, EditIcon, DuplicateIcon, DeleteIcon } from "../../../assets";

type DropdownMenuProps = {
    onRename?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
    onRename,
    onEdit,
    onDuplicate,
    onDelete,
}) => {
    // 공통 키보드 핸들러
    const handleKeyDown = (e: React.KeyboardEvent, callback?: () => void) => {
        if (["Enter", " "].includes(e.key)) {
            e.preventDefault();
            callback?.();
        }
    };

    return (
        <div role="menu" className="inline-flex px-[16px] py-[12px] items-center rounded-[8px] bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.12)]">
            <ul className="flex flex-col items-start gap-[12px]">
                <li>
                    <button
                    onClick={onRename}
                    onKeyDown={(e) => handleKeyDown(e, onRename)}
                    role="menuitem"
                    className="cursor-pointer flex h-[36px] justify-center items-center gap-[8px]">
                        <RenameIcon className="w-[18px] h-[18px]" />
                        <p className="text-[rgba(0,0,0,0.7)] font-pretendard text-[16px] font-medium leading-normal">템플릿명 변경</p>
                    </button>
                </li>
                <li>
                    <button
                    onClick={onEdit}
                    onKeyDown={(e) => handleKeyDown(e, onEdit)}
                    role="menuitem"
                    className="cursor-pointer flex h-[36px] justify-center items-center gap-[8px]">
                        <EditIcon className="w-[18px] h-[18px]" />
                        <p className="text-[rgba(0,0,0,0.7)] font-pretendard text-[16px] font-medium leading-normal">상세보기</p>
                    </button>
                </li>
                <li>
                    <button
                    onClick={onDuplicate}
                    onKeyDown={(e) => handleKeyDown(e, onDuplicate)}
                    role="menuitem"
                    className="cursor-pointer flex h-[36px] justify-center items-center gap-[8px]">
                        <DuplicateIcon className="w-[18px] h-[18px]" />
                        <p className="text-[rgba(0,0,0,0.7)] font-pretendard text-[16px] font-medium leading-normal">복사하기</p>
                    </button>
                </li>
                <div className="h-0 self-stretch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="114" height="2" viewBox="0 0 114 2" fill="none">
                        <path d="M0.882812 0.839844H113.883" stroke="#F0F0F0" strokeWidth="1" />
                    </svg>
                </div>
                <li>
                    <button
                    onClick={onDelete}
                    onKeyDown={(e) => handleKeyDown(e, onDelete)}
                    role="menuitem"
                    className="cursor-pointer flex h-[36px] justify-center items-center gap-[8px]">
                        <DeleteIcon className="w-[18px] h-[18px]" />
                        <p className="text-[rgba(0,0,0,0.7)] font-pretendard text-[16px] font-medium leading-normal">삭제하기</p>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default DropdownMenu;
