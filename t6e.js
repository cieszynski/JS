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

class t6e {

    static rand(min, max, steps) {
        return Math.floor(Math.random() * (max - min) / (steps || 1)) * (steps || 1) + min;
    }

    static toFixed(num, digs, grp) {
        return Intl.NumberFormat(navigator.language, {
            minimumFractionDigits: digs || 0,
            maximumFractionDigits: digs || 0,
            useGrouping: grp || 0
        }).format(num);
    }

    static run(str, obj) {
        const regex = /{{(.*?)}}/g;
        return str.replace(regex, function (match, exp) {
            obj.rand = t6e.rand;
            obj.toFixed = t6e.toFixed;
            const values = Object.keys(obj).map(function (key) { return obj[key] });
            const args = [null]
                .concat(Object.keys(obj))
                .concat(`"use strict"; return ${exp};`);
            return new (Function.bind.apply(Function, args))().apply(null, values);
        })
    }
}