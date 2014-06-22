(function () {
    "use strict";

    var Imaging = Windows.Graphics.Imaging;

    function cropSquare(image, callback) {
        try {
            image.properties.getImagePropertiesAsync().then(function (imageProperties) {
                var height = imageProperties.height;
                var width = imageProperties.width;
                var startX = 0;
                var startY = 0;

                if (height == width) callback(null, image);
                else if (width > height) {
                    startX = (width - height)/2;
                    width = height;
                }
                else {
                    //startY = (height - width)/2; // not working for some reason?
                    height = width;
                }

                crop(image, startX, startY, width, height, callback);
            },
            function (err) {
                callback(err, image);
            });
        }
        catch (e) {
            //image is a stream...need to investigate. For now just return original image.
            callback("Couldn't crop image, returning original", image);
        }
    }

    function crop(image, x, y, width, height, callback) {
        try {
            image.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {
                cropFromStream(stream, x, y, width, height, image.fileType, callback);
            },
            function(err) {
                callback(err); 
            });
        }
        catch (e) {
            //image is already a stream
            cropFromStream(image, x, y, width, height, image.fileType, callback);
        }
    }

    function cropFromStream(imageStream, x, y, width, height, fileType, callback) {
        var tempFileName = Math.floor((Math.random() * 10000)) + "-crop" + fileType;
        
        Imaging.BitmapDecoder.createAsync(imageStream).then(function (bd) {
            bd.getPixelDataAsync().then(function (pdp) {
                var pixelData = pdp.detachPixelData();
                Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync(tempFileName, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
                    file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (stream) {
                        Imaging.BitmapEncoder.createForTranscodingAsync(stream, bd).then(function (encoder) {

                            encoder.bitmapTransform.bounds = {
                                height: height,
                                width: width,
                                x: x,
                                y: y
                            };

                            encoder.flushAsync().then(function () {
                                stream.flushAsync().then(function () {
                                    stream.close();
                                    imageStream.close();
                                    callback(null, file);
                                },
                                function (err) {
                                    callback(err);
                                });
                            },
                            function (err) {
                                callback(err);
                            });
                        },
                        function (err) {
                            callback(err);
                        });
                    },
                    function (err) {
                        callback(err);
                    });
                },
                function (err) {
                    callback(err);
                });
            },
            function (err) {
                callback(err);
            });
        },
        function (err) {
            callback(err);
        });
    }

    WinJS.Namespace.define("ImageCrop", {
        cropSquare: cropSquare,
        crop: crop,
        cropFromStream: cropFromStream
    });
})();