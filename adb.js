'use strict';

/**
 * @overview Android Debug Bridge Library for Chrome Application
 *
 * @version 1.0.0
 * @author Johnson Lee <g.johnsonlee@gmail.com>
 */
(function(global) {

    var Socket = chrome.sockets.tcp;

    function arrayBufferToString(buf, callback) {
        var b = new Blob([new Uint8Array(buf)]);
        var f = new FileReader();
        f.onload = function (e) {
            callback(e.target.result);
        };
        f.readAsText(b);
    }

    function stringToArrayBuffer(str, callback) {
        console.log(str);
        var b = new Blob([str]);
        var f = new FileReader();
        f.onload = function (e) {
            callback(e.target.result);
        };
        f.readAsArrayBuffer(b);
    }

    function obtainMessage(msg) {
        var data = [];
        var len = msg.length.toString(16).toUpperCase();

        for (var i = len.length; i < 4; i++) {
            data.push('0');
        }

        data.push(len);
        data.push(msg);
        return data.join('');
    }

    function connect(host, port) {
        return new Promise(function(resolve, reject) {
            Socket.create({}, function(createInfo) {
                console.log('Create socket ' + JSON.stringify(createInfo));
                Socket.connect(createInfo.socketId, host || 'localhost', port || 5037, function(errno) {
                    if (errno < 0) {
                        console.error('Connect to socket ' + createInfo.socketId + ' error: ' + errno);
                        Socket.close(createInfo.socketId);
                        reject(errno);
                    } else {
                        console.log('Connect to socket ' + createInfo.socketId + ' success');
                        resolve(createInfo.socketId);
                    }
                });
            });
        });
    }

    function send(socketId, data) {
        return new Promise(function(resolve, reject) {
            stringToArrayBuffer(obtainMessage(data), function(bytes) {
                console.log('Sending data to socket ' + socketId);
                Socket.onReceive.addListener(function(info) {
                    if (info.socketId === socketId) {
                        console.log('Receive data from socket ' + socketId + ':');
                        console.log(info.data);

                        if (info.data.byteLength === 4) {
                            return;
                        }

                        resolve(info.data);
                    }
                });
                Socket.onReceiveError.addListener(function(info) {
                    if (info.socketId === socketId) {
                        console.error('Receive error from socket ' + socketId + ': ' + info.resultCode);
                        reject(info.resultCode);
                    }
                });
                Socket.send(socketId, bytes, function(sendInfo) {
                    if (sendInfo.resultCode < 0) {
                        console.error('Sent data to socket ' + socketId + ' error: ' + sendInfo.resultCode);
                        reject(sendInfo.resultCode);
                    } else {
                        console.info('Send data to socket ' + socketId + ' success');
                    }
                });
            });
        });
    }

    /**
     * @namespace adb
     */
    global.adb = {

        /**
         * Retreive the version number of ADB server
         *
         * @param {String} [host=localhost]
         *        The host of adb server
         * @param {Number} [port=5037]
         *        The port of adb server
         * @return {Promise} a instance of Promise
         * @memberof adb
         * @instance
         */
        getHostVersion : function(host, port) {
            return new Promise(function(resolve, reject) {
                connect(host, port).then(function(socketId) {
                    return send(socketId, 'host:version').then(function(data) {
                        arrayBufferToString(data, function(str) {
                            Socket.disconnect(socketId);
                            Socket.close(socketId);
                            resolve(str.match(/^OKAY/) ? str.substr(4) : str);
                        });
                    }, function(error) {
                        Socket.disconnect(socketId);
                        Socket.close(socketId);
                        reject(error);
                    });
                }, reject);
            });
        },

        /**
         * List all devices
         *
         * @param {String} [host=localhost]
         *        The host of adb server
         * @param {Number} [port=5037]
         *        The port of adb server
         * @return {Promise} a instance of Promise
         * @memberof adb
         * @instance
         */
        listDevices : function(host, port) {
            return new Promise(function(resolve, reject) {
                connect(host, port).then(function(socketId) {
                    return send(socketId, 'host:devices-l').then(function(data) {
                        arrayBufferToString(data, function(str) {
                            var devices = [];
                            var lines = (str.match(/^OKAY/) ? str.substr(4) : str).trim().split('\n');

                            for (var i = 0; i < lines.length; i++) {
                                var line = lines[i].trim().split(/\s+/g);
                                var device = {
                                    serial  : line[0],
                                    state   : line[1],
                                    usb     : null,
                                    product : null,
                                    model   : null,
                                    device  : null,
                                };

                                for (var j = 2; j < line.length; j++) {
                                    if (line[j].match(/^usb:/)) {
                                        device.usb = line[j].substr(4);
                                    } else if (line[j].match(/^product:/)) {
                                        device.product = line[j].substr(8);
                                    } else if (line[j].match(/^model:/)) {
                                        device.model = line[j].substr(6);
                                    } else if (line[j].match(/^device:/)) {
                                        device.device = line[j].substr(7);
                                    }
                                }

                                devices.push(device);
                            }

                            Socket.disconnect(socketId);
                            Socket.close(socketId);
                            resolve(devices);
                        });
                    }, function(error) {
                        Socket.disconnect(socketId);
                        Socket.close(socketId);
                        reject(error);
                    });
                }, reject);
            });
        },

    };

})(this);
