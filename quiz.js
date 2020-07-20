
"use strict";

const prepare = function (obj, a) {
    obj.a = a + 1 || obj.a;
    obj.i = 0;  // interval
    return obj;
}



const Quiz = class {

    get name() { return 'Quiz'; }

    setRange(lowX, highX, lowY, highY) {
        this.lowX = lowX;
        this.highX = highX;
        this.lowY = lowY;
        this.highY = highY;
    }

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

                const store = this.db.createObjectStore(this.name, { keyPath: "a" });
                store.createIndex("interval", ["i", "x", "y"], { unique: false });
                store.transaction.oncomplete = function (e) {

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

                            objectStore.add({ a: 0, date: null });
                            for (let a = 0; a < json.length; a++) {
                                objectStore.add(prepare(json[a], a));
                            }
                            resolve(this);
                        }.bind(this))
                        .catch(function (e) {
                            console.error('CATCH ' + e)
                        });
                }.bind(this)

            }.bind(this)
        }.bind(this));
    }

    next(prev, grade) {

        return new Promise(function (resolve) {
            const lowX = this.lowX || 0,
                lowY = this.lowY || 0,
                highX = this.highX || Number.MAX_VALUE,
                highY = this.highY || Number.MAX_VALUE;
            this.db
                .transaction(this.name)
                .objectStore(this.name)
                .count()
                .onsuccess = function (e) {
                    if (prev, grade) {
                        prev.i += (e.target.result) / (6 - grade);
                    } else prev = { a: 0, date: new Date() };
                    this.db
                        .transaction(this.name, "readwrite")
                        .objectStore(this.name)
                        .put(prev)
                        .onsuccess = function (e) {
                            e.target.transaction.db
                                .transaction(this.name)
                                .objectStore(this.name)
                                .index("interval")
                                .openCursor(IDBKeyRange.bound(
                                    [0, lowX, lowY],
                                    [Number.MAX_VALUE, highX, highY]))
                                .onsuccess = function (e) {

                                    if (e.target.result) {
                                        var cursor = e.target.result, x = cursor.key[1], y = cursor.key[2];
                                        if (!(lowX <= x && x <= highX)) {
                                            cursor.continue();
                                        } else if (y < lowY) {
                                            cursor.continue([x, lowY]);
                                        } else if (y > highY) {
                                            cursor.continue([x + 1, lowY]);
                                        } else {
                                            resolve(e.target.result.value);// we got one!
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
                        cursor.update(prepare(cursor.value));
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