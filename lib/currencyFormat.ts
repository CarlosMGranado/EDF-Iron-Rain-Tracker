export type BuiltNumberPart =
  | { kind: "digit"; char: string; muted: boolean }
  | { kind: "sep" };

export function buildGroupedNumberParts(
  value: number,
  opts?: {
    minDigits?: number;
    maxDigits?: number;
    groupSize?: number;
    padToMinDigits?: boolean;
    muteLeadingZeros?: boolean;
  }
): BuiltNumberPart[] {
  const minDigits = opts?.minDigits ?? 9;
  const maxDigits = opts?.maxDigits ?? 10;
  const groupSize = opts?.groupSize ?? 3;
  const padToMinDigits = opts?.padToMinDigits ?? true;
  const muteLeadingZeros = opts?.muteLeadingZeros ?? true;

  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const raw = String(safe);

  const trimmed = maxDigits ? (raw.length > maxDigits ? raw.slice(raw.length - maxDigits) : raw) : raw;

  const targetLen = padToMinDigits ? Math.max(minDigits, trimmed.length) : trimmed.length;
  const padded = padToMinDigits ? trimmed.padStart(targetLen, "0") : trimmed;

  let firstNonZero = padded.search(/[^0]/);
  if (firstNonZero === -1) firstNonZero = padded.length - 1;

  const parts: BuiltNumberPart[] = [];
  for (let i = 0; i < padded.length; i++) {
    const isLeadingZero = i < firstNonZero;
    parts.push({
      kind: "digit",
      char: padded[i],
      muted: muteLeadingZeros && padToMinDigits && isLeadingZero
    });

    const remaining = padded.length - i - 1;
    if (remaining > 0 && remaining % groupSize === 0) parts.push({ kind: "sep" });
  }

  return parts;
}
