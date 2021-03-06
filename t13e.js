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

    static plural(num, obj, min, max) {
        return `${T13E.number(num, min, max)} ${obj[(num >= 2) ? 2 : Math.trunc(num)]}`;
    }

    static range(min, max, steps) {
        return Math.floor(Math.random() * (max - min) / steps) * steps + min;
    }

    static arange(arr) {
        return arguments[(Math.floor(Math.random() * arguments.length))];
    }

    static number(num, min, max) {
        //num = parseFloat(num);
        return Intl.NumberFormat(T13E.locale, {
            minimumFractionDigits: min,
            maximumFractionDigits: max
        }).format(num);
    }

    static currency(num, code) {
        return Intl.NumberFormat(T13E.locale, {
            style: "currency",
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
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

        const regex = /([\#]\{([\w\/\+\-\*\.\)\(\[\]]+?)\}\:([A-z])\(([\w\"\'"]*?)\))/g;
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

    static process(template, node) {
        const source = function (obj) {
            //obj = JSON.stringify(obj).replace(/"/g, '');
            const funcs = {}
            funcs.range = T13E.range;
            funcs.arange = T13E.arange;

            const values = Object.keys(funcs).map(function (key) { return funcs[key] });
            const args = [null].concat(Object.keys(funcs)).concat(`"use strict"; return ${obj};`);
            return new (Function.bind.apply(Function, args))().apply(null, values);
        }(template.dataset.source);

        node.innerHTML = "";
        node.appendChild(template.content.cloneNode(true));

        Array.prototype.forEach.call(node.querySelectorAll('[t13e]'), function (value) {

            value.textContent = function (value, obj) {
                let str = value.textContent;

                obj.lt = function(a, b, c, d) {
                    return (a < b) ? c : d;
                }               
                obj.gt = function(a, b, c, d) {
                    return (a > b) ? c : d;
                }
                obj.currency = T13E.currency;
                obj.number = T13E.number;
                obj.plural = T13E.plural;
                obj.xlink = function (k, v) {
                    value.setAttributeNS("http://www.w3.org/1999/xlink", k, `#${v.toLowerCase()}`);
                }
                obj.attr = function (k, v) {
                    value.setAttribute(k, v);
                }
                const values = Object.keys(obj).map(function (key) { return obj[key] });
                const args = [null]
                    .concat(Object.keys(obj))
                    .concat(`"use strict"; return ${str};`);
                return new (Function.bind.apply(Function, args))().apply(value, values);
            }(value, source);
        });
    }
}