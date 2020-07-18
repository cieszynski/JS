// Copyright (C) 2020 Stephan Cieszynski
// 
// This file is part of JS.
// 
// assets is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// assets is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with assets.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

class T13E { // TemplateEngine

    static get locale() {
        return navigator.language;
    }

    static plural(num, obj) {
        return `${num} ${obj[(num > 2) ? 2 : num]}`;
    }

    static range(min, max, steps) {
        return Math.floor(Math.random() * (max - min) / steps) * steps + min;
    }

    static arange(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static number(num, min, max) {
        return Intl.NumberFormat(T13E.locale, {
            minimumFractionDigits: min,
            maximumFractionDigits: max
        }).format(num);
    }

    static currency(num, code) {
        return Intl.NumberFormat(T13E.locale, {
            style: "currency",
            currency: code
        }).format(num);
    }

    static prepare(obj) {
        obj = (typeof obj === "string") ? obj : JSON.stringify(obj);
        const funcs = {
            range: T13E.range,
            arange: T13E.arange
        }
        const values = Object.keys(funcs).map(function (key) { return funcs[key] });
        const args = [null].concat(Object.keys(funcs)).concat(`"use strict"; return ${obj};`);
        return new (Function.bind.apply(Function, args))().apply(null, values);
    }

    static format(str, obj) {

        const regex = /(\#\{([\w\/\+\-\*\.\)\(]+?)\}\:([A-z])\(([\w\""]*?)\))/g;
        const render = function (match, p1, p2, p3, p4, offset, string) {
            let code = '"use strict";return '
            switch (p3) {
                case 'c':   // currency
                    code += `T13E.currency(${p2},${p4}).replace(/\\s+/g, "\u00a0");`;
                    break;
                case 'n':   // number
                    code += `T13E.number(parseFloat(${p2}), ${p4 || 2}, ${p4 || 2}).replace(/\\s+/g, "\u00a0");`;
                    break;
                case 's':   // string
                    code += `${p2};`;
                    break;
                case 'u':   // unit
                    code += `${p2}+"\u00a0".concat(${p4})`;
                    break;
                case 'P':   // plural
                    code += `T13E.plural(${p2},${p4}).replace(/\\s+/g, "\u00a0");`;
                    break;
            }

            const values = Object.keys(obj).map(function (key) { return obj[key] });
            const args = [null].concat(Object.keys(obj)).concat(code);
            return new (Function.bind.apply(Function, args))().apply(null, values);
        }
        return str.replace(regex, render);
    }
}