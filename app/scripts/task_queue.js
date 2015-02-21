"use strict";

(function() {

    var TaskQueue = function() {
        this.queue_ = [];
    };

    TaskQueue.prototype.addTask = function(task) {
        console.log("TaskQueue: addTask - length(1)=" + this.queue_.length);
        this.queue_.push(task);
        console.log("TaskQueue: addTask - length(2)=" + this.queue_.length);
        if (this.queue_.length === 1) {
            setTimeout(function() {
                console.log("TaskQueue: addTask - Call consume task: length=" + this.queue_.length);
                this.consumeTask();
            }.bind(this), 10);
        }
        // task();
    };

    TaskQueue.prototype.consumeTask = function() {
        console.log("TaskQueue: consumeTask - length=" + this.queue_.length);
        if (this.queue_.length > 0) {
            var task = this.queue_[0];
            // var task = this.taskQueue_.shift();
            if (task) {
                console.log("TaskQueue: consumeTask - execute task: length=" + this.queue_.length);
                task();
            } else {
                this.queue_.shift();
                console.log("TaskQueue: consumeTask - dequeue task(1): length=" + this.queue_.length);
                this.consumeTask();
            }
        } else {
            console.log("TaskQueue: consumeTask - queue: empty");
        }
    };

    TaskQueue.prototype.shiftAndConsumeTask = function() {
        console.log("TaskQueue: shiftAndConsumeTask - length=" + this.queue_.length);
        this.queue_.shift();
        console.log("TaskQueue: shiftAndConsumeTask - dequeue task(2): length=" + this.queue_.length);
        this.consumeTask();
    };

    window.TaskQueue = TaskQueue;


})();