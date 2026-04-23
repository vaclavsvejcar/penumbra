type NegativeIdParts = {
  seqGlobal: number
  year: number
  seqYear: number
}

type FrameIdParts = {
  frameNumber: number
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

export function negativeDisplayId(neg: NegativeIdParts): string {
  return `${pad(neg.seqGlobal, 4)}/${neg.year}-${pad(neg.seqYear, 3)}`
}

export function frameDisplayId(
  neg: NegativeIdParts,
  frame: FrameIdParts,
): string {
  return `${negativeDisplayId(neg)}/${pad(frame.frameNumber, 2)}`
}

export function paddedFrameNumber(frame: FrameIdParts): string {
  return pad(frame.frameNumber, 2)
}
