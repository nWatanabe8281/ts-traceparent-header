# ts-traceparent-header

Parses a W3C traceparent header string into `version`, `traceId`, `spanId`, and `flags`, rejecting anything that is not structurally valid.

## Usage

```js
import { parseTraceparent, Traceparent } from 'ts-traceparent-header';

const tp = parseTraceparent(
  '00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-01'
);

console.log(tp.version); // '00'
console.log(tp.traceId); // '0af7651916cd43dd8448132116c39f94'
console.log(tp.spanId);  // '00f067aa0ba902b7'
console.log(tp.flags);   // '01'
console.log(tp.toString()); // original header string
```

## Why

There are libraries that parse traceparent headers and also generate them, manage sampling state, or carry a propagation context through async hops. If all you need is to pull the four fields out of a header string and know the values are safe to use, that extra surface area is a liability.

`parseTraceparent` takes a string and either returns a frozen `Traceparent` object with the four lowercase-hex fields or throws. No sampling, no context propagation, no mutation. The returned object is frozen so downstream code cannot accidentally corrupt it.

The W3C spec says the all-zero trace id and all-zero span id are invalid and must not be used. This library treats that as a hard error and throws, rather than handing back a structurally valid but semantically broken value.

## Edges

Uppercase hex is technically legal per the spec but discouraged for interoperability. This library normalizes uppercase to lowercase silently rather than rejecting it — `toString()` will always emit lowercase. If you need to detect and reject uppercase input, do a case-sensitive check before calling `parseTraceparent`.

Leading and trailing whitespace is trimmed. Internal whitespace between fields is not, and will cause a parse failure (the field regex requires contiguous hex).

## Exports

- `parseTraceparent(header: string): Traceparent` — throws on any malformed input.
- `Traceparent` — the result class, frozen on construction. Exposes `version`, `traceId`, `spanId`, `flags`, and `toString()`.

## Running tests

```
node --test
```

No build step, no dependencies. ESM only.
