import { Metadata } from "next";
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";

export const metadata: Metadata = {
  title: "GSCL Guide — Admin & Operations",
  description: "Complete admin panel guide and operations manual for GSCL v1.0.1",
};

export default function GuidePage() {
  const guidePath = path.join(process.cwd(), "GUIDE.md");
  let content = "";

  try {
    content = fs.readFileSync(guidePath, "utf-8");
  } catch {
    content = "# Guide not found";
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
