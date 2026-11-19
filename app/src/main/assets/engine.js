// Motor de cálculo científico (sin eval). Usable en navegador y en Node.
(function (root) {
  'use strict';

  // Tokens de entrada: {k: tipo, s: texto en pantalla}
  // tipos: d (dígito o '.'), op (+ - * / ^ root E), f (función con "("),
  // lp, rp, c (constante pi/e/ans), pf (postfijo: sq cube inv fact pct)
  var T = {
    '0': { k: 'd', v: '0', s: '0' }, '1': { k: 'd', v: '1', s: '1' }, '2': { k: 'd', v: '2', s: '2' },
    '3': { k: 'd', v: '3', s: '3' }, '4': { k: 'd', v: '4', s: '4' }, '5': { k: 'd', v: '5', s: '5' },
    '6': { k: 'd', v: '6', s: '6' }, '7': { k: 'd', v: '7', s: '7' }, '8': { k: 'd', v: '8', s: '8' },
    '9': { k: 'd', v: '9', s: '9' }, '.': { k: 'd', v: '.', s: '.' },
    '+': { k: 'op', v: '+', s: '+' }, '-': { k: 'op', v: '-', s: '−' },
    '*': { k: 'op', v: '*', s: '×' }, '/': { k: 'op', v: '/', s: '÷' },
    '^': { k: 'op', v: '^', s: '^' }, 'root': { k: 'op', v: 'root', s: 'ˣ√' },
    'E': { k: 'op', v: 'E', s: 'ᴇ' },
    'P': { k: 'op', v: 'P', s: 'P' }, 'C': { k: 'op', v: 'C', s: 'C' },
    'neg': { k: 'u', v: 'neg', s: '⁻' },
    'abs': { k: 'f', v: 'abs', s: 'Abs(' },
    'sinh': { k: 'f', v: 'sinh', s: 'sinh(' }, 'cosh': { k: 'f', v: 'cosh', s: 'cosh(' }, 'tanh': { k: 'f', v: 'tanh', s: 'tanh(' },
    'asinh': { k: 'f', v: 'asinh', s: 'sinh⁻¹(' }, 'acosh': { k: 'f', v: 'acosh', s: 'cosh⁻¹(' },
    'atanh': { k: 'f', v: 'atanh', s: 'tanh⁻¹(' },
    'mem': { k: 'c', v: 'mem', s: 'M' }, 'ran': { k: 'c', v: 'ran', s: 'Ran#' },
    'sin': { k: 'f', v: 'sin', s: 'sin(' }, 'cos': { k: 'f', v: 'cos', s: 'cos(' }, 'tan': { k: 'f', v: 'tan', s: 'tan(' },
    'asin': { k: 'f', v: 'asin', s: 'sin⁻¹(' }, 'acos': { k: 'f', v: 'acos', s: 'cos⁻¹(' },
    'atan': { k: 'f', v: 'atan', s: 'tan⁻¹(' },
    'log': { k: 'f', v: 'log', s: 'log(' }, 'ln': { k: 'f', v: 'ln', s: 'ln(' },
    'sqrt': { k: 'f', v: 'sqrt', s: '√(' }, 'cbrt': { k: 'f', v: 'cbrt', s: '∛(' },
    'pow10': { k: 'f', v: 'pow10', s: '10^(' }, 'exp': { k: 'f', v: 'exp', s: 'e^(' },
    '(': { k: 'lp', v: '(', s: '(' }, ')': { k: 'rp', v: ')', s: ')' },
    'pi': { k: 'c', v: 'pi', s: 'π' }, 'e': { k: 'c', v: 'e', s: 'e' }, 'ans': { k: 'c', v: 'ans', s: 'Ans' },
    'sq': { k: 'pf', v: 'sq', s: '²' }, 'cube': { k: 'pf', v: 'cube', s: '³' },
    'inv': { k: 'pf', v: 'inv', s: '⁻¹' }, 'fact': { k: 'pf', v: 'fact', s: '!' },
    'pct': { k: 'pf', v: 'pct', s: '%' }
  };

  function CalcError(msg) { this.message = msg; }

  function evaluate(tokens, opts) {
    var deg = opts.deg, ans = opts.ans || 0;
    var i = 0;

    // Agrupa dígitos en números
    var toks = [];
    for (var j = 0; j < tokens.length; j++) {
      var t = tokens[j];
      if (t.k === 'd') {
        var s = '';
        while (j < tokens.length && tokens[j].k === 'd') { s += tokens[j].v; j++; }
        j--;
        if ((s.match(/\./g) || []).length > 1 || s === '.') throw new CalcError('Syntax ERROR');
        toks.push({ k: 'n', v: parseFloat(s) });
      } else toks.push(t);
    }

    function peek() { return toks[i]; }
    function next() { return toks[i++]; }
    function startsPrimary(t) { return t && (t.k === 'n' || t.k === 'c' || t.k === 'f' || t.k === 'lp' || t.k === 'u'); }

    function toRad(x) { return deg ? x * Math.PI / 180 : x; }
    function fromRad(x) { return deg ? x * 180 / Math.PI : x; }
    function clean(x) { return Math.abs(x) < 1e-12 ? 0 : x; }

    function applyF(name, x) {
      switch (name) {
        case 'sin': return clean(Math.sin(toRad(x)));
        case 'cos': return clean(Math.cos(toRad(x)));
        case 'tan':
          if (deg && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) throw new CalcError('Math ERROR');
          return clean(Math.tan(toRad(x)));
        case 'asin': if (x < -1 || x > 1) throw new CalcError('Math ERROR'); return fromRad(Math.asin(x));
        case 'acos': if (x < -1 || x > 1) throw new CalcError('Math ERROR'); return fromRad(Math.acos(x));
        case 'atan': return fromRad(Math.atan(x));
        case 'log': if (x <= 0) throw new CalcError('Math ERROR'); return Math.log10(x);
        case 'ln': if (x <= 0) throw new CalcError('Math ERROR'); return Math.log(x);
        case 'sqrt': if (x < 0) throw new CalcError('Math ERROR'); return Math.sqrt(x);
        case 'cbrt': return Math.cbrt(x);
        case 'pow10': return Math.pow(10, x);
        case 'exp': return Math.exp(x);
        case 'abs': return Math.abs(x);
        case 'sinh': return Math.sinh(x);
        case 'cosh': return Math.cosh(x);
        case 'tanh': return Math.tanh(x);
        case 'asinh': return Math.asinh(x);
        case 'acosh': if (x < 1) throw new CalcError('Math ERROR'); return Math.acosh(x);
        case 'atanh': if (x <= -1 || x >= 1) throw new CalcError('Math ERROR'); return Math.atanh(x);
      }
      throw new CalcError('Syntax ERROR');
    }

    function fact(x) {
      if (x < 0 || x > 170 || Math.abs(x - Math.round(x)) > 1e-9) throw new CalcError('Math ERROR');
      var r = 1; for (var k = 2; k <= Math.round(x); k++) r *= k; return r;
    }

    function pow(a, b) {
      if (a < 0 && Math.abs(b - Math.round(b)) > 1e-12) {
        // raíz impar de negativo: (-8)^(1/3)
        var inv = 1 / b;
        if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b);
        throw new CalcError('Math ERROR');
      }
      if (a === 0 && b < 0) throw new CalcError('Math ERROR');
      return Math.pow(a, b);
    }

    function expr() {
      var v = term();
      while (peek() && peek().k === 'op' && (peek().v === '+' || peek().v === '-')) {
        var o = next().v, r = term();
        v = o === '+' ? v + r : v - r;
      }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var t = peek();
        if (t && t.k === 'op' && (t.v === '*' || t.v === '/')) {
          next(); var r = unary();
          if (t.v === '/') { if (r === 0) throw new CalcError('Math ERROR'); v = v / r; } else v = v * r;
        } else if (startsPrimary(t)) {
          v = v * power(); // multiplicación implícita: 2π, 3(4), 2sin(30)
        } else break;
      }
      return v;
    }
    function unary() {
      var t = peek();
      if (t && ((t.k === 'op' && (t.v === '-' || t.v === '+')) || t.k === 'u')) { next(); var v = unary(); return t.v === '+' ? v : -v; }
      return comb();
    }
    function nint(x) { if (x < 0 || Math.abs(x - Math.round(x)) > 1e-9) throw new CalcError('Math ERROR'); return Math.round(x); }
    function comb() {
      var v = power();
      while (peek() && peek().k === 'op' && (peek().v === 'P' || peek().v === 'C')) {
        var o = next().v, n = nint(v), r = nint(power());
        if (r > n) throw new CalcError('Math ERROR');
        var p = 1; for (var q = 0; q < r; q++) p *= (n - q);
        if (o === 'C') p = p / fact(r);
        v = Math.round(p);
      }
      return v;
    }
    function power() {
      var v = postfix();
      var t = peek();
      if (t && t.k === 'op' && t.v === '^') { next(); return pow(v, unary()); }
      if (t && t.k === 'op' && t.v === 'root') { next(); var b = unary(); if (v === 0) throw new CalcError('Math ERROR'); return pow(b, 1 / v); }
      return v;
    }
    function postfix() {
      var v = primary();
      for (;;) {
        var t = peek();
        if (!t || t.k !== 'pf') break;
        next();
        if (t.v === 'sq') v = v * v;
        else if (t.v === 'cube') v = v * v * v;
        else if (t.v === 'inv') { if (v === 0) throw new CalcError('Math ERROR'); v = 1 / v; }
        else if (t.v === 'fact') v = fact(v);
        else if (t.v === 'pct') v = v / 100;
      }
      return v;
    }
    function primary() {
      var t = next();
      if (!t) throw new CalcError('Syntax ERROR');
      var v;
      if (t.k === 'n') {
        v = t.v;
        if (peek() && peek().k === 'op' && peek().v === 'E') {
          next();
          var neg = false;
          if (peek() && peek().k === 'op' && (peek().v === '-' || peek().v === '+')) { neg = next().v === '-'; }
          var ex = next();
          if (!ex || ex.k !== 'n') throw new CalcError('Syntax ERROR');
          v = v * Math.pow(10, neg ? -ex.v : ex.v);
        }
        return v;
      }
      if (t.k === 'c') return t.v === 'pi' ? Math.PI : t.v === 'e' ? Math.E : t.v === 'mem' ? (opts.mem || 0) : t.v === 'ran' ? Math.floor(Math.random() * 1000) / 1000 : ans;
      if (t.k === 'f' || t.k === 'lp') {
        v = expr();
        if (peek() && peek().k === 'rp') next();
        else if (peek()) throw new CalcError('Syntax ERROR'); // los ")" finales se pueden omitir
        return t.k === 'f' ? applyF(t.v, v) : v;
      }
      throw new CalcError('Syntax ERROR');
    }

    if (!toks.length) return null;
    var res = expr();
    if (i < toks.length) throw new CalcError('Syntax ERROR');
    if (!isFinite(res) || isNaN(res)) throw new CalcError('Math ERROR');
    if (Math.abs(res) >= 1e100) throw new CalcError('Math ERROR');
    return res;
  }

  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

  // Formato tipo calculadora: 10 dígitos significativos
  function format(x) {
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 1e10 || a < 1e-9) {
      var e = Math.floor(Math.log10(a));
      var m = x / Math.pow(10, e);
      if (Math.abs(m) >= 9.9999999995) { m /= 10; e += 1; }
      var ms = String(parseFloat(m.toPrecision(10)));
      var es = String(e).split('').map(function (c) { return SUP[c]; }).join('');
      return ms + '×10' + es;
    }
    var s = String(parseFloat(x.toPrecision(10)));
    if (s.indexOf('e') >= 0) s = x.toFixed(9).replace(/\.?0+$/, '');
    return s;
  }

  var api = { T: T, evaluate: evaluate, format: format, CalcError: CalcError };
  if (typeof module !== 'undefined') module.exports = api; else root.CalcEngine = api;
})(this);
