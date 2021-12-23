'use strict';

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const { optimize } = require('../../lib/svgo.js');

const regEOL = new RegExp(EOL, 'g');

const normalize = (file) => {
  return file.trim().replace(regEOL, '\n');
};

const parseFixture = async (file) => {
  const filepath = path.resolve(__dirname, file);
  const content = await fs.promises.readFile(filepath, 'utf-8');
  return normalize(content).split(/\s*@@@\s*/);
};

describe('svgo', () => {
  it('should create indent with 2 spaces', async () => {
    const [original, expected] = await parseFixture('test.svg');
    const result = optimize(original, {
      plugins: [],
      js2svg: { pretty: true, indent: 2 },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should handle plugins order properly', async () => {
    const [original, expected] = await parseFixture('plugins-order.svg');
    const result = optimize(original, { input: 'file', path: 'input.svg' });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should handle empty svg tag', async () => {
    const result = optimize('<svg />', { input: 'file', path: 'input.svg' });
    expect(result.data).toEqual('<svg/>');
  });
  it('should resolve and not escape numeric character references', async () => {
    const result = optimize('<svg><text class="&#1234; &#xabcd;">&#xabcd; &#1234;</text></svg>', { input: 'file', path: 'input.svg' });
    expect(result.data).toEqual('<svg><text class="\u04d2 \uabcd">\uabcd \u04d2</text></svg>');
  });

  it('should escape and not double-escape numeric character references representing <', async () => {
    const result = optimize('<svg><text font-family="&#60; and &#x3c;">&#x3c; and &#60;</text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result5', result);
    expect(result.data).toEqual('<svg><text font-family="&lt; and &lt;">&lt; and &lt;</text></svg>');
  });
  it('should escape and not double-escape numeric character references representing &', async () => {
    const result = optimize('<svg><text font-family="&#38; and &#x26;">&#x26; and &#38;</text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result6', result);
    expect(result.data).toEqual('<svg><text font-family="&amp; and &amp;">&amp; and &amp;</text></svg>');
  });

  // '<svg><text><![CDATA ]&#x3e; and ]&#62; ]></text></svg>'
  // '<svg><text class="&#34; and &#39;">&#34; and &#39;</text></svg>',
  // '<svg><text class="&#x22; and &#x27;">&#x22; and &#x27;</text></svg>',
  it('should escape and not double-escape numeric character references representing >', async () => {
    const result = optimize('<svg><text>CDATA1: <![CDATA[ ]&#x3e; and ]&#62; ]]></text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result7', result);
    expect(result.data).toEqual('<svg><text>CDATA1: <![CDATA[ ]&#x3e; and ]&#62; ]]></text></svg>');
  });
  it('should escape and not double-escape numeric character references representing \'', async () => {
    const result = optimize('<svg><text class="&#34; and &#39;">&#34; and &#39;</text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result8', result);
    expect(result.data).toEqual('<svg><text class="&quot; and \'">&quot; and &apos;</text></svg>');
  });
  it('should escape and not double-escape numeric character references representing "', async () => {
    const result = optimize('<svg><text class="&#x22; and &#x27;">&#x22; and &#x27;</text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result9', result);
    expect(result.data).toEqual('<svg><text class="&quot; and \'">&quot; and &apos;</text></svg>');
  });

  it('should escape and not double-escape numeric character references representing \'', async () => {
    const result = optimize('<svg><text class=\'&#34; and &#39;\'>&#34; and &#39;</text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result8', result);
    expect(result.data).toEqual('<svg><text class="&quot; and \'">&quot; and &apos;</text></svg>');
  });
  it('should escape and not double-escape numeric character references representing "', async () => {
    const result = optimize('<svg><text class="&#x22; and &#x27;">&#x22; and &#x27;</text></svg>', { input: 'file', path: 'input.svg' });
    console.log('result9', result);
    expect(result.data).toEqual('<svg><text class="&quot; and \'">&quot; and &apos;</text></svg>');
  });


  it('should preserve style specifity over attributes', async () => {
    const [original, expected] = await parseFixture('style-specifity.svg');
    const result = optimize(original, {
      input: 'file',
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should inline entities', async () => {
    const [original, expected] = await parseFixture('entities.svg');
    const result = optimize(original, {
      path: 'input.svg',
      plugins: [],
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should preserve whitespaces between tspan tags', async () => {
    const [original, expected] = await parseFixture('whitespaces.svg');
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
});
