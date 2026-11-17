import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

export function ModuleStub({
  title,
  next,
}: {
  title: string;
  next: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        title="המסך יושלם עם נתוני העבודה של המודול הזה. בינתיים אפשר לחזור לבית או לתזרים."
        action={
          <Link href="/" className="rounded-xl bg-[var(--brand)] px-4 py-2 text-white">
            {next}
          </Link>
        }
      />
    </div>
  );
}
