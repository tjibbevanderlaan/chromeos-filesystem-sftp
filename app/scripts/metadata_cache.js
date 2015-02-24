"use strict";

(function() {

    var MetadataCache = function() {
        this.directories_ = {};
    };

    MetadataCache.prototype.put = function(directoryPath, metadataList) {
        delete this.directories_[directoryPath];
        var entries = {};
        for (var i = 0; i < metadataList.length; i++) {
            var metadata = metadataList[i];
            entries[metadata.name] = metadata;
        }
        this.directories_[directoryPath] = entries;
    };

    MetadataCache.prototype.get = function(entryPath) {
        if (entryPath === "/") {
            return {
                needFetch: true,
                exists: true
            };
        } else {
            var lastDelimiterPos = entryPath.lastIndexOf("/");
            var directoryPath;
            var name;
            if (lastDelimiterPos === 0) {
                directoryPath = "/";
                name = entryPath.substring(1);
            } else {
                directoryPath = entryPath.substring(0, lastDelimiterPos);
                name = entryPath.substring(lastDelimiterPos + 1);
            }
            var entries = this.directories_[directoryPath];
            if (entries) {
                var entry = entries[name];
                if (entry) {
                    return {
                        needFetch: false,
                        exists: true,
                        metadata: entry
                    };
                } else {
                    return {
                        needFetch: false,
                        exists: false
                    };
                }
            } else {
                return {
                    needFetch: true,
                    exists: true
                };
            }
        }
    };

    window.MetadataCache = MetadataCache;

})();
