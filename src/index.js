/**
 * Public entry point for ts-traceparent-header.
 *
 * Re-exports parseTraceparent and Traceparent so consumers can import a single
 * module: `import { parseTraceparent } from 'ts-traceparent-header'`.
 */
export { parseTraceparent, Traceparent } from './core.js';
