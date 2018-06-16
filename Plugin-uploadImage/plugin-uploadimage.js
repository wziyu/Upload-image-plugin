(function ($) {
  'use strict';

  // necessary global config
  $.loadImagePlugin = function (el, options) {
    var defaultSettings = {
      cloudinaryPrefix: CLOUDINARY + '/',
      imageEmptyHolderSelector: '.blueimp-image-empty-container',
      localImagePrefix: WEB_DOMAIN + '/cache/images/', // necessary!!!
      type: {
        type: 'product', //store||product,
        imageType: '', //store image types
      },
      imageOptions: {
        multiUpload: true,
        maxWidth: undefined,
        maxHeight: undefined,
      },
      maxImages:2,
    };
    console.log("elll",el);
    console.log("options",options);
    // To avoid scope issues, use 'plugin' instead of 'this'
    // to reference this class from internal events and functions.
    var plugin = this;
    console.log('plugin thisssssssss',this);
    // Access to jQuery and DOM versions of element
    plugin.$el = $(el);
    plugin.el = el;

    // Add a reverse reference to the DOM object
    if (plugin.$el.data()['loadImagePlugin']) {
      plugin.$el.data()['loadImagePlugin'].destory();
    }
    plugin.$el.data("loadImagePlugin", plugin);
    //custome variables
    plugin.cloudinaryImages = []; // This array will contain URL of existing images on Cloudinary
    plugin.newImages = []; // This array will contain URL of images that has been uploaded to 'cache/images/...'

    plugin.init = function () {
      plugin.options = $.extend({}, defaultSettings, options);
      // init function
      plugin.firstLoad = true; //for generateData currentImageListWithOrder

      if (!$.isArray(plugin.options.imageList)) {
        plugin.options.imageList = [];
      }
      $.each(plugin.options.imageList, function (i, val) {
        plugin.cloudinaryImages[i] = plugin.options.cloudinaryPrefix + val;
      });
      //load
      // plugin.loadImgs(plugin.options['dontLoadCache']);
      //add listener
      plugin.initImages();
      plugin.addListeners();

      plugin.$el.show();
      $(plugin.options.imageEmptyHolderSelector).hide();
      return plugin;
    };

    plugin.destory = function () {
      plugin.$el.removeData('loadImagePlugin');
      plugin.$el.html('');
      plugin.$el.off();
    };

    //load dom
    plugin.initImages = function () {
      console.log("now refreshing images1234567890");
      var blueimpLinkHtml = '';
      //determain if #file-form is visiable
      
      var fileInputElement = `
      <div class="file-form" >
        <form class="image-drop-form" enctype="multipart/form-data">
          <div class="file-area">
            <input type="text" name="type" value="POST" hidden/>
            <input class="file-input" type="file" name="fileToUpload[]" accept="image/x-png,image/jpeg" required="required" />
            <div class="file-dummy">
              <div class="default"> Upload img</div>
              <div class="photo-icon"></div>
              <div class="success">Uploading images... <span class="upload-progress"></span></div>
            </div>
          </div>
        </form>
      </div>`;
      plugin.$el.html(fileInputElement);

    };

    plugin.refreshImages = function (images) {
      
      var blueimpLinkHtml = '';
      //determain if #file-form is visiable
      for (var i = 0; i < images.length; i++) {
        blueimpLinkHtml += `
        <li>
          <div class="delete">x</div>
          <a href="` + images[i] + `" title="Store Image` + i + `" data-gallery class="m-sm">
            <div class="img-box">
              <img src="` + images[i] + `" alt="Store Image` + i + `" class="">
            </div>
          </a>
        </li>`;
      }
      var fileInputElement = `
      <div class="file-form" >
        <form class="image-drop-form" enctype="multipart/form-data">
          <div class="file-area">
            <input type="text" name="type" value="POST" hidden/>
            <input class="file-input" type="file" name="fileToUpload[]" accept="image/x-png,image/jpeg" required="required" />
            <div class="file-dummy">
              <div class="default"> Upload img</div>
              <div class="photo-icon"></div>
              <div class="success">Uploading images... <span class="upload-progress"></span></div>
            </div>
          </div>
        </form>
      </div>`;

      if(images.length<=defaultSettings.maxImages)
      	plugin.$el.html(blueimpLinkHtml + fileInputElement);
      else
	plugin.$el.html(blueimpLinkHtml);
    };

    //hehe
    //add listener
    plugin.addListeners = function () {
      //for delete icon
      plugin.$el.on('click', '.delete', function () {
        var $li_img = $(this).parent();
          var tmpImageUrl = $li_img.find('a').attr('href');
          if (tmpImageUrl.match(plugin.options.cloudinaryPrefix)) {
            // remove from plugin.cloudinaryImages
            if (plugin.cloudinaryImages.indexOf(tmpImageUrl) != -1) {
              plugin.cloudinaryImages.splice(plugin.cloudinaryImages.indexOf(tmpImageUrl), 1);
            }
            // remove image from web page
            $li_img.remove();
	    plugin.loadImgs();
          } else {
            // delete image from local server if it's not a Cloudinary img
            plugin.deleteFromLocal(tmpImageUrl, function () {
              $li_img.remove();
	      plugin.loadImgs();
            });
          }
      });

      // Check for file size before uploading
      plugin.$el.on('change', '.file-input', function (event) {
        var _event = event;
          $.resizeUploadImages(_event, {
            maxWidth: plugin.options.imageOptions.maxWidth,
            maxHeight: plugin.options.imageOptions.maxHeight,
          }).then(plugin.uploadImages);
      });
    };

    plugin.uploadImages = function (finalBlobFiles) {
      console.log('now uploadimages');
      console.log(finalBlobFiles);
      // Custom submit function with upload process indication, upload images to 'test/imageUpload/uploads/'
      var formData = new FormData();
      for (var i = 0; i < finalBlobFiles.length; i++) {
        formData.append('fileToUpload[]', finalBlobFiles[i]);
      }
      formData.append('action', 'add_image_cache');
      formData.append('type', plugin.options.type.type);
      if (plugin.options.type.type === 'store' && plugin.options.type.imageType) {
        formData.append('imageType', plugin.options.type.imageType);
      }
      formData.append('cloudinaryImagesCount', plugin.cloudinaryImages.length);
      console.log('now formdata');
      for(var pair of formData.entries()) {//hehe
        console.log(pair[1]); 
     }
      $.ajax({
        type: 'POST',
        url: '/oauth/',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        dataType: "json",
        xhr: function () {
          var myXhr = $.ajaxSettings.xhr();
          if (myXhr.upload) {
            // show upload process as a number in upload box (0%~100%)
            myXhr.upload.addEventListener('progress', function (e) {
              if (e.lengthComputable) {
                var max = e.total;
                var current = e.loaded;
                var Percentage = (current * 100) / max;
                plugin.$el.find('.upload-progress').html(String(Percentage.toFixed(2)) + "%");
                if (Percentage >= 100) {
                  // process completed
                }
              }
            }, false);
          }
          return myXhr;
        },
        error: function (res) {
          console.log(res);
          plugin.$el.find('.file-input').val('');
        }
      }).done(function (res) {
        if (!$.tools.checkResponse(res)) {
          alert(res.records.error);
        }
        console.log('upload images success');
        plugin.loadImgs();
      });
    };

    plugin.clearImgs = function () {
      console.log('cleariMGS');
      var data = {
        action: 'clear_image_cache',
        type: 'GET',
      };

      return $.ajax({
        url: "/oauth/",
        type: "POST",
        data: data,
        dataType: "json",
        timeout: 30000,
      });
    };

    plugin.clearAllImage = function () {
      console.log('clearAllImages');
      plugin.options.imageList = [];
      plugin.cloudinaryImages = [];
      plugin.newImages;
      plugin.$el.find('.img-box').remove();
      return plugin.clearImgs();
    }

    // ajax functions
    plugin.loadImgs = function (dontLoadCache) {
      console.log("now loadimgs in plugin");
      if (!dontLoadCache) {
        var data = {
          action: 'load_image_cache',
          type: 'POST', //doesn't matter
          data: {
            type: plugin.options.type.type,
            imageType: plugin.options.type.imageType
          }
        };

        $.ajax({
          url: "/oauth/",
          type: "POST",
          data: data,
          dataType: "json",
          timeout: 30000,
        }).done(function (res) {
          $.tools.checkResponse(res);
          plugin.newImages = res['records']['images'];
          console.log('before refresh image',plugin.newImages);
          var images = plugin.newImages;
          console.log('after change',images);

          plugin.refreshImages(images);
        });
      } else {
        var images = plugin.options.imageList.map(function (currentImageUrl) {
          return plugin.options.cloudinaryPrefix + currentImageUrl;
        });
        plugin.refreshImages(images);
      }
    };

    plugin.mergeImageWithOrder = function (currentImageListWithOrder, newCachedImageList) {
      newCachedImageList.map(function (currentCachedImage) {
        if (currentImageListWithOrder.indexOf(currentCachedImage) == -1) {
          currentImageListWithOrder.push(currentCachedImage);
        }
      });
      return currentImageListWithOrder;
    };

    plugin.deleteFromLocal = function (imgUrl, callback) {
      var data = {
        action: 'delete_image_cache',
        type: 'POST',
        data: {
          image_file: imgUrl.split('/').reverse()[0],
          type: plugin.options.type.type,
          imageType: plugin.options.type.imageType
        }
      };

      $.ajax({
        url: "/oauth/",
        type: "POST",
        data: data,
        dataType: "json",
        timeout: 30000,
      }).done(function (res) {
        $.tools.checkResponse(res);
        if (plugin.newImages.indexOf(imgUrl) != -1) {
          plugin.newImages.splice(plugin.newImages.indexOf(imgUrl), 1);
        }
        if (res['RC'] == 200) {
          callback && callback();
        }
      });
    };

   

    // plugin.generateData = function () {
    //   var currentImageListWithOrder;

    //   // first time load, may not have img-box img
    //   if (plugin.firstLoad === true) {
    //     currentImageListWithOrder = plugin.cloudinaryImages.concat(plugin.newImages);
    //     plugin.firstLoad = false;
    //   } else {
    //     currentImageListWithOrder = plugin.$el.find('.img-box img').map(function () {
    //       return $(this).attr('src');
    //     });
    //   }

    //   return {
    //     cloudinaryImages: plugin.cloudinaryImages,
    //     newImages: plugin.newImages,
    //     currentImageListWithOrder: $.makeArray(currentImageListWithOrder),
    //   };
    // };

    // Run initializer
    plugin.init();
  };



  $.fn.loadImagePlugin = function (options) {
    return this.each(function () {
      (new $.loadImagePlugin(this, options));
    });
  };
})(jQuery);
