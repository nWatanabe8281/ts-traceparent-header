import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTraceparent, Traceparent } from '../src/index.js';

const VALID = '00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-01';

function validFlagsCases() {
  return [
    '00', '01', '06', '09', '0a', '0f', '10', 'ff',
    '2a', '5c', '91', 'b3', 'c0', 'd4', 'e8', 'f7'
  ];
}

function validHex32Cases() {
  return [
    '0af7651916cd43dd8448132116c39f94',
    '1234567890abcdef1234567890abcdef',
    'fedcba9876543210fedcba9876543210',
    'abcdef0123456789abcdef0123456789',
    '00000000000000000000000000000001',
    '10000000000000000000000000000000'
  ];
}

function validHex16Cases() {
  return [
    '00f067aa0ba902b7',
    '1234567890abcdef',
    'fedcba9876543210',
    'abcdef0123456789',
    '0000000000000001',
    '1000000000000000'
  ];
}

test('parses a valid traceparent', () => {
  const tp = parseTraceparent(VALID);
  assert.ok(tp instanceof Traceparent);
  assert.equal(tp.version, '00');
  assert.equal(tp.traceId, '0af7651916cd43dd8448132116c39f94');
  assert.equal(tp.spanId, '00f067aa0ba902b7');
  assert.equal(tp.flags, '01');
});

test('toString round-trips canonical input', () => {
  const tp = parseTraceparent(VALID);
  assert.equal(tp.toString(), VALID);
});

test('result is frozen', () => {
  const tp = parseTraceparent(VALID);
  assert.ok(Object.isFrozen(tp));
  assert.throws(() => { tp.version = 'ff'; }, TypeError);
});

test('trims surrounding whitespace', () => {
  const tp = parseTraceparent('  ' + VALID + '\t');
  assert.equal(tp.toString(), VALID);
});

test('normalizes uppercase hex to lowercase', () => {
  const upper = VALID.toUpperCase();
  const tp = parseTraceparent(upper);
  assert.equal(tp.toString(), VALID);
});

test('rejects non-string input', () => {
  assert.throws(() => parseTraceparent(null), /must be a string/);
  assert.throws(() => parseTraceparent(42), /must be a string/);
  assert.throws(() => parseTraceparent(undefined), /must be a string/);
  assert.throws(() => parseTraceparent({}), /must be a string/);
});

test('rejects empty string', () => {
  assert.throws(() => parseTraceparent(''), /exactly 4 dash-separated/);
});

test('rejects too few fields', () => {
  assert.throws(() => parseTraceparent('00-aaa-bbb'), /exactly 4 dash-separated/);
});

test('rejects too many fields', () => {
  assert.throws(() => parseTraceparent('00-aaa-bbb-01-02'), /exactly 4 dash-separated/);
});

test('rejects all-zero trace id', () => {
  const header = '00-' + '0'.repeat(32) + '-00f067aa0ba902b7-01';
  assert.throws(() => parseTraceparent(header), /trace id must not be all zeros/);
});

test('rejects all-zero span id', () => {
  const header = '00-0af7651916cd43dd8448132116c39f94-' + '0'.repeat(16) + '-01';
  assert.throws(() => parseTraceparent(header), /span id must not be all zeros/);
});

test('rejects wrong version width', () => {
  assert.throws(
    () => parseTraceparent('0-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-01'),
    /version must be 2 lowercase hex digits/
  );
  assert.throws(
    () => parseTraceparent('000-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-01'),
    /version must be 2 lowercase hex digits/
  );
});

test('rejects wrong trace id width', () => {
  assert.throws(
    () => parseTraceparent('00-0af7-00f067aa0ba902b7-01'),
    /trace id must be 32 lowercase hex digits/
  );
});

test('rejects wrong span id width', () => {
  assert.throws(
    () => parseTraceparent('00-0af7651916cd43dd8448132116c39f94-00f067-01'),
    /span id must be 16 lowercase hex digits/
  );
});

test('rejects wrong flags width', () => {
  assert.throws(
    () => parseTraceparent('00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-1'),
    /flags must be 2 lowercase hex digits/
  );
  assert.throws(
    () => parseTraceparent('00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-001'),
    /flags must be 2 lowercase hex digits/
  );
});

test('rejects non-hex version', () => {
  assert.throws(
    () => parseTraceparent('zz-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-01'),
    /version must be 2 lowercase hex digits/
  );
});

test('rejects non-hex trace id', () => {
  assert.throws(
    () => parseTraceparent('00-0af7651916cd43dd8448132116c39f9g-00f067aa0ba902b7-01'),
    /trace id must be 32 lowercase hex digits/
  );
});

test('rejects non-hex span id', () => {
  assert.throws(
    () => parseTraceparent('00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b-01'),
    /span id must be 16 lowercase hex digits/
  );
});

test('rejects non-hex flags', () => {
  assert.throws(
    () => parseTraceparent('00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-zz'),
    /flags must be 2 lowercase hex digits/
  );
});

for (const f of validFlagsCases()) {
  test(`accepts flags "${f}"`, () => {
    const header = `00-0af7651916cd43dd8448132116c39f94-00f067aa0ba902b7-${f}`;
    const tp = parseTraceparent(header);
    assert.equal(tp.flags, f);
  });
}

for (const tid of validHex32Cases()) {
  test(`accepts trace id "${tid}"`, () => {
    const header = `00-${tid}-00f067aa0ba902b7-01`;
    const tp = parseTraceparent(header);
    assert.equal(tp.traceId, tid);
  });
}

for (const sid of validHex16Cases()) {
  test(`accepts span id "${sid}"`, () => {
    const header = `00-0af7651916cd43dd8448132116c39f94-${sid}-01`;
    const tp = parseTraceparent(header);
    assert.equal(tp.spanId, sid);
  });
}
