(function($) {
  $(function () {
    // initialize on logged-in state only
    if ($('body').hasClass('logged-in')) {
      // ms to idle can be updated via 'data-idle-timeout' attribute on body tag
      var idleTimeout = $('body').attr('data-idle-timeout');
      // fade out main stage when idle
      var timer;
      $(document).on('mousemove', function() {
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
        $('body').removeClass('idle');
        timer = setTimeout(function() {
          $('body').addClass('idle');
        }, idleTimeout);
      });      
      
      // initialize image panels
      dispatch.init();
    } else {
      // initialize swiper
      init();
    }
    
    // ensure main content is above the fold
    resize();
    $(window).on('resize', resize);
      
    // newsletter signup
    $newsletter = $('#newsletter'),
    $newsletterSignup = $('#newsletter-signup'),
    $checkbox = $newsletterSignup.find('input'),
    $submit = $newsletterSignup.find('button');
    $checkbox.attr('checked', false).on('click', function() {
      $(this).parent().toggleClass('checked');
      $submit.toggleClass('active');
    });
    $newsletterSignup.on('submit', function() {
      if ($submit.hasClass('active')) {
        $.ajax({url:$newsletterSignup.attr('action'),type:"post"})
         .done(function() {
           $newsletter.addClass('success');
         })
         .fail(function() {
           $newsletterSignup.find('.error-msg').show();
         });
      }
      return false;
    });
    
    // share container
    $('#share').on('mouseenter', function() {
      $(this).addClass('hover');
    }).on('mouseleave', function() {
      $(this).removeClass('hover');
    });
    
    // country selector
    var countryTimer = 0,
        $country = $('#country-select'),
        $currentFlag = $country.find('.current-flag');
    $country.on('mouseover', function() {
      if (countryTimer) {
        clearTimeout(countryTimer);
        countryTimer = 0;
      }
      $country.addClass('open');
    }).on('mouseout', function() {
      countryTimer = setTimeout(function() {
        $country.removeClass('open');
      }, 1000);
    });
    $country.find('a').on('mouseover', function() {
      $currentFlag.removeClass($currentFlag.attr('data-current-flag'))
                  .addClass($(this).attr('class'));
    }).on('mouseout', function() {
      $currentFlag.removeClass($(this).attr('class'))
                  .addClass($currentFlag.attr('data-current-flag'));
    });
    
    // toggle the #show-alerts div to show/hide the #entitlement-alert div
    var $dogtag = $('#dogtag'),
        $alert = $('#entitlement-alert'),
        $alertClose = $alert.find('.close'),
        toggleAlert = function() {
          $dogtag.toggleClass('open');
          $alert.toggleClass('open');
          // check localStorage support
          if (typeof(Storage) !== 'undefined') localStorage.entitlementAlert = ($dogtag.hasClass('open')) ? 'open' : 'closed';
        };
    $dogtag.on('click', toggleAlert);
    $alertClose.on('click', toggleAlert);
    // open/close entitlement-alert based on localStorage
    // default to open state if either localStorage is not supported, or if localStorage key is not yet set
    if (typeof(Storage) === 'undefined' || !localStorage.entitlementAlert || (localStorage.entitlementAlert && localStorage.entitlementAlert === 'open')) {
      $dogtag.addClass('open');
      $alert.addClass('open');
    }
    // convert escaped tags
    unescapeHtml('#entitlement-alert h2');
    unescapeHtml('#guest h1');
    unescapeHtml('#guest h2');
    $('#guest').show();
    
    // toggle the #breaking-news > h1 to be collapsible.  it should also change the image from the collapse to expand versions.
    var $module = $('#main-module'),
        $moduleHeader = $module.find('> h2');
    $moduleHeader.on('click', function() {
      $module.toggleClass('open');
      // check localStorage support
      if (typeof(Storage) !== 'undefined') localStorage.mainModule = ($module.hasClass('open')) ? 'open' : 'closed';
    });
    // open/close main-module based on localStorage
    // default to open state if either localStorage is not supported, or if localStorage key is not yet set
    if (typeof(Storage) === 'undefined' || !localStorage.mainModule || (localStorage.mainModule && localStorage.mainModule === 'open')) {
      $module.addClass('open');
    }
    
    function resize() {
      var viewableHeight = $(window).height() - 50;
      $('#body .main-side').css('height', viewableHeight);
    }
    
    function unescapeHtml(selector) {
      var $selector = $(selector);
      if ($selector.length) {
        var text = $selector.text();
        $selector.html(text.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>'));
      }
    }
    
    function init(){
        /**
         * $el - jquery wrapped element
         * strokeWidth(optional) - default: 100(Number) - radius of the brush
         * fadingRatio(optional) - default: 0.01(0>=Number>=1) -  - the fading ratio. * It is using framerate dependent interpolation 
         * strokeCanvasRatio(optional) - default: 0.5(1>=Number>=0.001) -  downscaling ratio for the brush for improving the performacne on old devices
         * onReadyCallback(optional) - default(null) - callback function will be dispatched when the images are loaded and ready to render
         */

        var swiper = new Swiper({$el : $('#swiper'), strokeWidth: 50, fadingRatio: 0.02, strokeCanvasRatio: 1, onReadyCallback: function(){
            //callback when the images are ready

            // to remove the swiper, use swiper.remove();
            // swiper.remove();
        }});
        
        // initialize, we still need to initialize it for non-canvas browser as we need to resize the fallback image to the size of the container
        swiper.init();

        // to detect if it support canvas. You can also use Swiper.isActive before creating the swiper instance if you dont want to show the image at all.
        if(swiper.isActive) {
            // start. If the swiper instance is not ready, it will start rendering when it is ready.
            swiper.start();
        } else {
            //console.log('browser doesnt support canvas element.');
        }

    }    
  });  
})(jQuery);

