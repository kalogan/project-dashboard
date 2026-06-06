"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateBoardState } from "@/app/actions/updateBoardState";
import type { Pillar } from "@/types";

/**
 * The Visual Logistics Board.
 *
 * Renders a markdown board body (`### Column` lanes, `- [ ] Task #tag` cards)
 * as an accessible, keyboard-navigable drag-and-drop board (@dnd-kit). Moves
 * are persisted by rewriting the source `.mdx` so the file and UI stay in sync.
 */

interface Card {
  id: string;
  text: string;
  tag?: string;
  done: boolean;
}
type Items = Record<string, string[]>; // columnId -> ordered cardIds

interface ParsedBoard {
  columns: { id: string; title: string }[];
  items: Items;
  cards: Record<string, Card>;
}

const TASK_RE = /^- \[([ xX])\]\s+(.*)$/;

function rawLine(card: Card): string {
  return `- [${card.done ? "x" : " "}] ${card.text}${
    card.tag ? ` #${card.tag}` : ""
  }`;
}

function parseBoard(source: string): ParsedBoard {
  const columns: { id: string; title: string }[] = [];
  const items: Items = {};
  const cards: Record<string, Card> = {};
  let colId = "";
  let c = 0;
  let k = 0;

  for (const line of source.split("\n")) {
    const header = line.match(/^###\s+(.*)$/);
    if (header) {
      colId = `col-${c++}`;
      columns.push({ id: colId, title: header[1].trim() });
      items[colId] = [];
      continue;
    }
    const task = line.match(TASK_RE);
    if (task && colId) {
      const done = task[1].toLowerCase() === "x";
      let text = task[2].trim();
      let tag: string | undefined;
      const tagMatch = text.match(/^(.*?)\s+#(\S+)$/);
      if (tagMatch) {
        text = tagMatch[1].trim();
        tag = tagMatch[2];
      }
      const id = `card-${k++}`;
      cards[id] = { id, text, tag, done };
      items[colId].push(id);
    }
  }
  return { columns, items, cards };
}

function CardView({ card, dragging }: { card: Card; dragging?: boolean }) {
  return (
    <div
      className={`select-none border bg-theme-base p-3 transition-all duration-200 ease-out ${
        dragging
          ? "border-[#4e2329] drop-shadow-[0_0_8px_rgba(77,187,192,0.6)]"
          : "border-theme-border"
      }`}
    >
      <p
        className={`font-normal text-theme-text ${
          card.done ? "line-through opacity-60" : ""
        }`}
      >
        {card.text}
      </p>
      {card.tag && (
        <span className="mt-2 block font-mono text-[10px] uppercase tracking-widest text-gray-500">
          #{card.tag}
        </span>
      )}
    </div>
  );
}

function SortableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`cursor-grab outline-none ${isDragging ? "opacity-40" : ""}`}
    >
      <CardView card={card} dragging={isDragging} />
    </div>
  );
}

function Column({
  id,
  title,
  cardIds,
  cards,
}: {
  id: string;
  title: string;
  cardIds: string[];
  cards: Record<string, Card>;
}) {
  // Droppable so empty columns still accept a card.
  const { setNodeRef } = useDroppable({ id });
  return (
    <section className="flex w-72 flex-shrink-0 flex-col border border-theme-border bg-black/50">
      <h3 className="border-b border-theme-border px-3 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-theme-muted">
        {title}
      </h3>
      <div ref={setNodeRef} className="flex min-h-[6rem] flex-col gap-3 p-3">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cardIds.map((cardId) => (
            <SortableCard key={cardId} card={cards[cardId]} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

export default function LogisticsBoard({
  source,
  pillar,
  slug,
}: {
  source: string;
  pillar: Pillar;
  slug: string;
}) {
  const [board, setBoard] = useState<ParsedBoard>(() => parseBoard(source));
  const [activeId, setActiveId] = useState<string | null>(null);

  // Re-sync if the underlying file changes (e.g. after a persisted move).
  useEffect(() => setBoard(parseBoard(source)), [source]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string) => {
    if (id in board.items) return id;
    return board.columns.find((col) => board.items[col.id].includes(id))?.id;
  };

  function persist(items: Items) {
    if (process.env.NODE_ENV === "production") return; // dev-only persistence
    updateBoardState({
      pillar,
      slug,
      columns: board.columns.map((col) => ({
        title: col.title,
        cards: items[col.id].map((id) => rawLine(board.cards[id])),
      })),
    }).catch(() => {
      /* advisory; optimistic UI already reflects the move */
    });
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const from = findContainer(String(active.id));
    const to = findContainer(String(over.id));
    if (!from || !to || from === to) return;

    setBoard((prev) => {
      const fromIds = [...prev.items[from]];
      const toIds = [...prev.items[to]];
      const activeIndex = fromIds.indexOf(String(active.id));
      fromIds.splice(activeIndex, 1);
      const overIndex = toIds.indexOf(String(over.id));
      toIds.splice(overIndex >= 0 ? overIndex : toIds.length, 0, String(active.id));
      return { ...prev, items: { ...prev.items, [from]: fromIds, [to]: toIds } };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const container = findContainer(String(over.id));
    const from = findContainer(String(active.id));
    if (!container || from !== container) {
      persist(board.items); // cross-column move already settled in onDragOver
      return;
    }
    setBoard((prev) => {
      const ids = prev.items[container];
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      const nextIds =
        oldIndex === newIndex ? ids : arrayMove(ids, oldIndex, newIndex);
      const items = { ...prev.items, [container]: nextIds };
      persist(items);
      return { ...prev, items };
    });
  }

  const activeCard = activeId ? board.cards[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-scroll pb-4">
        {board.columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            cardIds={board.items[col.id]}
            cards={board.cards}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <CardView card={activeCard} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
