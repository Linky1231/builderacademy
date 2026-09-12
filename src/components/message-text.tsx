import { Link } from "@tanstack/react-router";
import { Hash } from "lucide-react";

const MENTION = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

export function MessageText({ content }: { content: string }) {
  const nodes: Array<string | { title: string; id: string }> = [];
  let last = 0;
  for (const match of content.matchAll(MENTION)) {
    if (match.index! > last) nodes.push(content.slice(last, match.index));
    nodes.push({ title: match[1], id: match[2] });
    last = match.index! + match[0].length;
  }
  if (last < content.length) nodes.push(content.slice(last));

  return <p className="whitespace-pre-wrap break-words">{nodes.map((node, index) => typeof node === "string"
    ? <span key={index}>{node}</span>
    : <Link key={index} to="/forum" hash={node.id} className="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 align-middle text-sm font-bold text-accent hover:bg-accent/25">
        <Hash className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{node.title}</span>
      </Link>)}</p>;
}
