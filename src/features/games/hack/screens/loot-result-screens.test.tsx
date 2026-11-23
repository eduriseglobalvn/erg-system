import { ThemeProvider, createTheme } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { LootResultData, PlayerState } from "@/features/games/game-types";
import { LootScreen } from "@/features/games/hack/screens/loot-screen";
import { LootEmptyScreen, LootOpenScreen } from "@/features/games/hack/screens/loot-result-screens";

const me: PlayerState = { playerId: "p1", displayName: "Minh Anh", stars: 1660, coins: 950, streak: 3, firewall: true, rank: 3, playerCount: 32, answeredCount: 12, correctCount: 11 };
const clock = () => 222_000;
const wrap = (node: ReactNode) => render(<ThemeProvider theme={createTheme()}>{node}</ThemeProvider>);

describe("loot screens (06, 07, 07b)", () => {
  it("06: three packs; on desktop a click opens the pack at once", () => {
    const onPick = vi.fn();
    wrap(<LootScreen phone={false} me={me} starsGained={120} getRemainingMs={clock} locked={false} onPick={onPick} />);
    expect(screen.getByText("GIẢI MÃ 1 GÓI DỮ LIỆU")).toBeTruthy();
    expect(screen.getByText("MÃ ĐÚNG · +120 SAO ĐÃ KHÓA VÀO KÉT")).toBeTruthy();
    const packs = screen.getAllByRole("button", { pressed: false });
    expect(packs).toHaveLength(3);
    fireEvent.click(packs[1]);
    expect(onPick).toHaveBeenCalledWith(1);
  });

  it("06 phone: tap selects, the button then opens it; a locked screen sends nothing", () => {
    const onPick = vi.fn();
    const { unmount } = wrap(<LootScreen phone me={me} starsGained={120} getRemainingMs={clock} locked={false} onPick={onPick} />);
    expect((screen.getByRole("button", { name: /GIẢI MÃ gói/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[2]);
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /GIẢI MÃ goi_/ }));
    expect(onPick).toHaveBeenCalledWith(2);
    unmount();
    const locked = vi.fn();
    wrap(<LootScreen phone={false} me={me} starsGained={120} getRemainingMs={clock} locked onPick={locked} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(locked).not.toHaveBeenCalled();
  });

  it("07: shows the coins won and what the two other packs held", () => {
    const result: LootResultData = { pickedSlot: 1, me, slots: [{ kind: "SCRAP", coins: 50 }, { kind: "BIG_WALLET", coins: 400 }, { kind: "EMPTY", coins: 0 }] };
    const onNext = vi.fn();
    wrap(<LootOpenScreen phone={false} result={result} locked={false} onNext={onNext} />);
    expect(screen.getByText("+400 XU")).toBeTruthy();
    expect(screen.getByText(/VÍ LỚN · 10 LẦN MỚI GẶP 1/)).toBeTruthy();
    expect(screen.getByText(/tệp vụn \+50 và GÓI RỖNG/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "> NHIỆM VỤ TIẾP" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("07b: empty pack keeps the coin total and moves on by itself after 2 s", () => {
    vi.useFakeTimers();
    const result: LootResultData = { pickedSlot: 1, me: { ...me, coins: 630 }, slots: [{ kind: "SMALL_WALLET", coins: 150 }, { kind: "EMPTY", coins: 0 }, { kind: "SCRAP", coins: 50 }] };
    const onNext = vi.fn();
    wrap(<LootEmptyScreen phone={false} result={result} starsGained={120} getRemainingMs={clock} locked={false} onNext={onNext} />);
    expect(screen.getByText("0 XU")).toBeTruthy();
    expect(screen.getByText("Trúng gói rỗng. Hai gói kia đều có hàng.")).toBeTruthy();
    expect(screen.getByText("GÓI 2 · BẠN CHỌN")).toBeTruthy();
    expect(screen.getByText("+150")).toBeTruthy();
    expect(screen.getByText(/Kho xu giữ nguyên 630, không bị trừ/)).toBeTruthy();
    vi.advanceTimersByTime(2000);
    expect(onNext).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
