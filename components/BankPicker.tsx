"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type Bank = { name: string; code: string };

// Banks most people use, shown first before anyone types.
const POPULAR = [
  "Guaranty Trust", "Access Bank", "Zenith", "First Bank", "United Bank For Africa", "OPay",
  "Moniepoint", "Kuda", "PalmPay", "Fidelity", "Wema", "Stanbic", "Sterling", "Union Bank", "FCMB",
];

// Everyday names people type, mapped to words in the official bank name.
const NICKNAMES: Record<string, string> = {
  gtb: "guaranty trust", gtbank: "guaranty trust", gt: "guaranty trust",
  uba: "united bank for africa", fbn: "first bank", firstbank: "first bank",
  fcmb: "first city monument", fidelity: "fidelity", alat: "wema", stanbic: "stanbic",
  moniepoint: "moniepoint", opay: "opay", palmpay: "palmpay", kuda: "kuda", polaris: "polaris",
  ecobank: "ecobank", eco: "ecobank", keystone: "keystone", jaiz: "jaiz", providus: "providus",
  carbon: "carbon", vfd: "vfd", sterling: "sterling", union: "union bank", unity: "unity",
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function score(bank: Bank, q: string): number {
  const name = norm(bank.name);
  const terms = [q, NICKNAMES[q.replace(/ /g, "")]].filter(Boolean) as string[];
  let best = 0;
  for (const t of terms) {
    if (name === t) best = Math.max(best, 100);
    else if (name.startsWith(t)) best = Math.max(best, 80);
    else if (name.split(" ").some((w) => w.startsWith(t))) best = Math.max(best, 60);
    else if (name.includes(t)) best = Math.max(best, 40);
    else if (t.split(" ").every((w) => name.includes(w))) best = Math.max(best, 30);
  }
  return best;
}

export function BankPicker({ banks, value, onChange, loading }: {
  banks: Bank[];
  value: string;
  onChange: (code: string) => void;
  loading?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const selected = banks.find((b) => b.code === value) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) {
      const popular = POPULAR.map((p) => banks.find((b) => norm(b.name).startsWith(norm(p)) || norm(b.name).includes(norm(p))))
        .filter((b, i, a): b is Bank => !!b && a.indexOf(b) === i);
      const rest = banks.filter((b) => !popular.includes(b));
      return { popular, rest };
    }
    const hits = banks
      .map((b) => ({ b, s: score(b, q) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s || x.b.name.localeCompare(y.b.name))
      .map((x) => x.b);
    return { popular: [], rest: hits };
  }, [banks, query]);

  const flat = useMemo(() => [...results.popular, ...results.rest], [results]);

  useEffect(() => setActive(0), [query]);

  // Close when tapping outside.
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Keep the highlighted bank in view while using arrow keys.
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(b: Bank) {
    onChange(b.code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { if (open && flat[active]) { e.preventDefault(); choose(flat[active]); } }
    else if (e.key === "Escape") { setOpen(false); }
  }

  const row = (b: Bank, i: number) => (
    <li
      key={b.code}
      id={`${id}-opt-${i}`}
      data-i={i}
      role="option"
      aria-selected={i === active}
      className={`bank-opt${i === active ? " active" : ""}${b.code === value ? " chosen" : ""}`}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => choose(b)}
      onPointerEnter={() => setActive(i)}
    >
      {b.name}
      {b.code === value && <span aria-hidden="true">✓</span>}
    </li>
  );

  return (
    <div className="bank-picker" ref={wrapRef}>
      <input
        ref={inputRef}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && flat[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={loading ? "Loading banks…" : selected ? selected.name : "Type to search, e.g. GTBank"}
        value={open ? query : selected?.name ?? query}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKey}
        disabled={loading && banks.length === 0}
      />
      <span className="bank-caret" aria-hidden="true">⌄</span>
      {open && (
        <ul className="bank-list" id={listId} role="listbox" ref={listRef}>
          {flat.length === 0 ? (
            <li className="bank-empty">No bank matches &quot;{query}&quot;. Try a shorter name.</li>
          ) : (
            <>
              {results.popular.length > 0 && <li className="bank-head" aria-hidden="true">Popular</li>}
              {results.popular.map((b, i) => row(b, i))}
              {results.popular.length > 0 && results.rest.length > 0 && <li className="bank-head" aria-hidden="true">All banks</li>}
              {results.rest.map((b, i) => row(b, i + results.popular.length))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
