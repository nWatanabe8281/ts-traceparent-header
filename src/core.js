/**
 * ts-traceparent-header
 *
 * Parses a W3C traceparent header string into its four fields with strict
 * validation. Throws on any structural deviation so callers can branch on
 * try/catch rather than re-checking the result.
 */

/**
 * Result of a successful parse.
 */
export class Traceparent {
  /**
   * @param {object} fields
   * @param {string} fields.version  Two lowercase hex digits.
   * @param {string} fields.traceId  32 lowercase hex digits.
   * @param {string} fields.spanId   16 lowercase hex digits.
   * @param {string} fields.flags    Two lowercase hex digits.
   */
  constructor({ version, traceId, spanId, flags }) {
    this.version = version;
    this.traceId = traceId;
    this.spanId = spanId;
    this.flags = flags;
    Object.freeze(this);
  }

  /**
   * Reconstructs the canonical header string.
   * 
   * @returns {string}
   */
  toString() {
    return `${this.version}-${this.traceId}-${this.spanId}-${this.flags}`;
  }
}

const VERSION_RE = /^[0-9a-f]{2}$/;
const TRACE_ID_RE = /^[0-9a-f]{32}$/;
const SPAN_ID_RE = /^[0-9a-f]{16}$/;
const FLAGS_RE = /^[0-9a-f]{2}$/;

/**
 * Parse a W3C traceparent header value.
 *
 * The format is: `version-trace-id-span-id-flags` where every field is lowercase
 * hexadecimal with fixed widths (2-32-16-2). The W3C spec reserves the all-zero
 * trace id and all-zero span id as "invalid"; this parser rejects them because a
 * real propagation context should never carry them.
 *
 * The spec also defines lowercase as canonical. Uppercase hex is technically
 * legal but discouraged for interoperability — some downstream tools reject it.
 * This library normalizes to lowercase and does not reject uppercase input.
 *
 * @param {string} header - Raw header value as received.
 * @returns {Traceparent} Frozen, validated fields.
 * @throws {Error} If the header is malformed, has bad field widths, or carries
 *   an all-zero trace or span id.
 */
export function parseTraceparent(header) {
  if (typeof header !== 'string') {
    throw new Error(`traceparent must be a string, got ${typeof header}`);
  }

  const trimmed = header.trim();
  const parts = trimmed.split('-');
  if (parts.length !== 4) {
    throw new Error(
      `traceparent must have exactly 4 dash-separated fields, got ${parts.length}`
    );
  }

  const [versionRaw, traceIdRaw, spanIdRaw, flagsRaw] = parts;

  const version = versionRaw.toLowerCase();
  const traceId = traceIdRaw.toLowerCase();
  const spanId = spanIdRaw.toLowerCase();
  const flags = flagsRaw.toLowerCase();

  if (!VERSION_RE.test(version)) {
    throw new Error(
      `version must be 2 lowercase hex digits, got "${versionRaw}"`
    );
  }
  if (!TRACE_ID_RE.test(traceId)) {
    throw new Error(
      `trace id must be 32 lowercase hex digits, got "${traceIdRaw}"`
    );
  }
  if (!SPAN_ID_RE.test(spanId)) {
    throw new Error(
      `span id must be 16 lowercase hex digits, got "${spanIdRaw}"`
    );
  }
  if (!FLAGS_RE.test(flags)) {
    throw new Error(
      `flags must be 2 lowercase hex digits, got "${flagsRaw}"`
    );
  }
  if (traceId === '0'.repeat(32)) {
    throw new Error('trace id must not be all zeros');
  }
  if (spanId === '0'.repeat(16)) {
    throw new Error('span id must not be all zeros');
  }

  return new Traceparent({ version, traceId, spanId, flags });
}
