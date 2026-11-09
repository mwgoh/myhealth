import { CATEGORY_LABEL, type Category } from "@/domain/types";

// 색은 점에만 쓰고 글자는 본문색으로 둔다. 색을 구분하지 못해도 라벨로 읽힌다.
export const CATEGORY_DOT: Record<Category, string> = {
  strength: "bg-cat-strength",
  bodyweight: "bg-cat-bodyweight",
  core: "bg-cat-core",
  stretching: "bg-cat-stretching",
  cardio: "bg-cat-cardio",
};

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-ink">
      <span className={`size-2 rounded-full ${CATEGORY_DOT[category]}`} aria-hidden />
      {CATEGORY_LABEL[category]}
    </span>
  );
}
