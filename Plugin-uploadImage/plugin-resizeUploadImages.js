(function ($) {
  $.resizeUploadImages = function (event, params) {
    console.log("now resize images");
    var defaultSettings = {
      maxWidth: 1024,
      maxHeight: 768,
    };
    params = $.extend({}, defaultSettings, params);
    // Read in file
    return new Promise(function (resolve, reject) {
      var files = event.target.files;
      var fileCount = 0;
      var finalFiles = [];

      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        // Create Reader Start
        var reader = new FileReader();

        reader.onload = function (readerEvent) {
          var image = new Image();
          image.onload = function (imageEvent) {

            // Resize the image
            var canvas = document.createElement('canvas'),
              max_width_size = params.maxWidth,
              max_height_size = params.maxHeight,
              width = image.width,
              height = image.height;

            if (width > 1024) {
              height *= max_width_size / width;
              width = max_width_size;
            }
            if (height > 768) {
              width *= max_height_size / height;
              height = max_height_size;
            }

            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
            var dataUrl = canvas.toDataURL('image/jpeg');

            /*
            var resizedImage = dataURLToBlob(dataUrl);
            */
            fileCount++;
            finalFiles.push(dataURLToBlob(dataUrl));

            if (fileCount == files.length) {
              console.log(finalFiles);
              resolve(finalFiles);
            }
          };
          image.src = readerEvent.target.result;
        };
        //Create Reader End

        // Ensure it's an image
        if (file.type.match(/image.*/)) {
          console.log((i + 1) + ' image has been loaded');
          reader.readAsDataURL(file);
        }
      }
    });
  };

  /* Utility function to convert a canvas to a BLOB */
  var dataURLToBlob = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    var parts, contentType, raw;
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
      parts = dataURL.split(',');
      contentType = parts[0].split(':')[1];
      raw = parts[1];

      return new Blob([raw], {
        type: contentType
      });
    }

    parts = dataURL.split(BASE64_MARKER);
    contentType = parts[0].split(':')[1];
    raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {
      type: contentType
    });
  };
  /* End Utility function to convert a canvas to a BLOB*/
})(jQuery);
