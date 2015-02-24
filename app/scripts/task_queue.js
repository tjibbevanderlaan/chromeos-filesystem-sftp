"use strict";

(function() {

    var TaskQueue = function() {
        this.queue_ = [];
    };

    TaskQueue.prototype.addTask = function(task) {
        this.queue_.push(task);
        if (this.queue_.length === 1) {
            setTimeout(function() {
                console.log("TaskQueue: addTask - Call consume task: length=" + this.queue_.length);
                this.consumeTask();
            }.bind(this), 10);
        }
    };

    TaskQueue.prototype.consumeTask = function() {
        if (this.queue_.length > 0) {
            var task = this.queue_[0];
            if (task) {
                console.log("TaskQueue: consumeTask - execute task: length=" + this.queue_.length);
                task();
            } else {
                this.queue_.shift();
                this.consumeTask();
            }
        } else {
            console.log("TaskQueue: consumeTask - queue: empty");
        }
    };

    TaskQueue.prototype.shiftAndConsumeTask = function() {
        this.queue_.shift();
        this.consumeTask();
    };

    window.TaskQueue = TaskQueue;


})();