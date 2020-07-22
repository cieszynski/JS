// Copyright (C) 2020 Stephan Cieszynski
// 
// This file is part of JS.
// 
// JS is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// JS is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with JS.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

const Quiz = class {

    get name() { return 'Quiz'; }

    constructor(version) {
        return new Promise(function (resolve, reject) {
            const req_open = indexedDB.open(this.name, version || 1);
            req_open.onsuccess = function (e) {
                this.db = e.target.result;
                resolve(this);
            }.bind(this)
            req_open.onerror = function (e) { reject(e); }
            req_open.onupgradeneeded = function (e) {
                req_open.onsuccess = null;
                this.db = e.target.result;
                if (e.oldVersion > 0) {
                    try { db.deleteObjectStore(this.name); }
                    catch (ex) {
                        reject(new ErrorEvent('DOMException', {
                            message: ex.message,
                            error: ex
                        }));
                    }
                }

                const store = this.db.createObjectStore(this.name, { keyPath: "id" });
                store.createIndex("interval", "i", { unique: false });
                store.transaction.oncomplete = function (e) {
                    this.load(resolve, reject)
                }.bind(this)

            }.bind(this)
        }.bind(this));
    }

    prepare(obj, id) {
        obj.id = id + 1 || obj.id
        obj.i = Math.random() * 10;  // interval
        return obj;
    }

    load(resolve, reject) {
        fetch(`${this.name}.json`)
            .then(function (response) {
                if (!response.ok) {
                    throw Error(response.status);
                }
                return response.json();
            })
            .then(function (json) {
                const objectStore = this.db
                    .transaction(this.name, "readwrite")
                    .objectStore(this.name);

                objectStore.add({ id: 0, date: null });
                for (let a = 0; a < json.length; a++) {
                    objectStore.add(this.prepare(json[a], a));
                }
                resolve(this);
            }.bind(this))
            .catch(function (e) {
                console.error('CATCH ' + e)
            });
    }

    next(prev, grade) {

        return new Promise(function (resolve) {
            const min_group = this.min_group || 1,
                min_level = this.min_level || 1,
                max_group = this.max_group || 2,
                max_level = this.max_level || 2;

            this.db
                .transaction(this.name)
                .objectStore(this.name)
                .count()
                .onsuccess = function (e) {
                    if (prev && grade) {
                        let a = ((e.target.result / ((max_group - min_group) ? 1 : 2)) / ((max_level - min_level) ? 1 : 2));
                        prev.i += a / (6 - grade);
                    } else prev = { id: 0, date: new Date() };
                    this.db
                        .transaction(this.name, "readwrite")
                        .objectStore(this.name)
                        .put(prev)
                        .onsuccess = function (e) {
                            e.target.transaction.db
                                .transaction(this.name)
                                .objectStore(this.name)
                                .index("interval")
                                .openCursor()
                                .onsuccess = function (e) {
                                    let first = null
                                    if (e.target.result) {
                                        const cursor = e.target.result;
                                        const value = cursor.value;
                                        if (!(min_group <= value.group && value.group <= max_group)) {
                                            cursor.continue();
                                        } else if (!(min_level <= value.level && value.level <= max_level)) {
                                            cursor.continue();
                                        } else {
                                            resolve(e.target.result.value);
                                        }
                                    }
                                }
                        }.bind(this)
                }.bind(this)
        }.bind(this));
    }

    reset() {
        return new Promise(function (resolve) {
            this.db
                .transaction(this.name, "readwrite")
                .objectStore(this.name)
                .index("interval")
                .openCursor()
                .onsuccess = function (e) {
                    const cursor = e.target.result;
                    if (cursor) {
                        cursor.update(this.prepare(cursor.value));
                        cursor.continue();
                    } else resolve(true);
                }.bind(this)
        }.bind(this));
    }

    time() {
        return new Promise(function (resolve) {
            this.db
                .transaction(this.name)
                .objectStore(this.name)
                .get(0)
                .onsuccess = function (e) {
                    resolve(e.target.result.date);
                }
        }.bind(this));
    }
}