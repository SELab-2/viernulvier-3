import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

export default function BlogDetailRoute() {
  const { blogId } = useParams();
  const { t } = useTranslation();

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <h1 className="text-4xl font-bold">{t("blogs.detail.title")}</h1>
        <p className="text-lg opacity-75">{t("blogs.detail.comingSoon")}</p>
        {blogId && <p>Blog ID: {blogId}</p>}
      </main>
    </div>
  );
}
