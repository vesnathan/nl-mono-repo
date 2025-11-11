/*jshint jquery:true */
/*global $:true */

var $ = jQuery.noConflict();

$(document).ready(function ($) {
  "use strict";

  $(".couterup").countTo();

  /* global google: false */
  /*jshint -W018 */

  /*-------------------------------------------------*/
  /* =  portfolio isotope
	/*-------------------------------------------------*/

  var winDow = $(window);
  // Needed variables
  var $container = $(".iso-call");
  var $filter = $(".filter");

  try {
    $container.imagesLoaded(function () {
      $container.trigger("resize");
      $container.isotope({
        filter: "*",
        layoutMode: "masonry",
        animationOptions: {
          duration: 750,
          easing: "linear",
        },
      });
    });
  } catch (err) {}

  winDow.bind("resize", function () {
    var selector = $filter.find("a.active").attr("data-filter");

    try {
      $container.isotope({
        filter: selector,
        animationOptions: {
          duration: 750,
          easing: "linear",
          queue: false,
        },
      });
    } catch (err) {}
    return false;
  });

  // Isotope Filter
  $filter.find("a").on("click", function () {
    var selector = $(this).attr("data-filter");

    try {
      $container.isotope({
        filter: selector,
        animationOptions: {
          duration: 750,
          easing: "linear",
          queue: false,
        },
      });
    } catch (err) {}
    return false;
  });

  var filterItemA = $(".filter li a");

  filterItemA.on("click", function () {
    var $this = $(this);
    if (!$this.hasClass("active")) {
      filterItemA.removeClass("active");
      $this.addClass("active");
    }
  });

  /*-------------------------------------------------*/
  /* =  browser detect
	/*-------------------------------------------------*/
  try {
    $.browserSelector();
    // Adds window smooth scroll on chrome.
    if ($("html").hasClass("chrome")) {
      $.smoothScroll();
    }
  } catch (err) {}

  /*-------------------------------------------------*/
  /* =  Search animation
	/*-------------------------------------------------*/

  var searchToggle = $(".open-search"),
    inputAnime = $(".form-search"),
    body = $("body");

  searchToggle.on("click", function (event) {
    event.preventDefault();

    if (!inputAnime.hasClass("active")) {
      inputAnime.addClass("active");
    } else {
      inputAnime.removeClass("active");
    }
  });

  body.on("click", function () {
    inputAnime.removeClass("active");
  });

  var elemBinds = $(".open-search, .form-search");
  elemBinds.on("click", function (e) {
    e.stopPropagation();
  });

  /* ---------------------------------------------------------------------- */
  /*	Accordion
	/* ---------------------------------------------------------------------- */
  var clickElem = $("a.accord-link");

  clickElem.on("click", function (e) {
    e.preventDefault();

    var $this = $(this),
      parentCheck = $this.parents(".accord-elem"),
      accordItems = $(".accord-elem"),
      accordContent = $(".accord-content");

    if (!parentCheck.hasClass("active")) {
      accordContent.slideUp(400, function () {
        accordItems.removeClass("active");
      });
      parentCheck.find(".accord-content").slideDown(400, function () {
        parentCheck.addClass("active");
      });
    } else {
      accordContent.slideUp(400, function () {
        accordItems.removeClass("active");
      });
    }
  });

  /*-------------------------------------------------*/
  /* =  Fancy Box
	/*-------------------------------------------------*/

  $("a.fancybox").fancybox();

  $(".video-fancybox").on("click", function () {
    $(this).fancybox({
      padding: 0,
      autoScale: false,
      transitionIn: "none",
      transitionOut: "none",
      title: this.title,
      width: 640,
      height: 385,
      href: this.href.replace(new RegExp("watch\\?v=", "i"), "v/"),
      type: "swf",
      swf: { wmode: "transparent", allowfullscreen: "true" },
    });
    return false;
  });

  /*-------------------------------------------------*/
  /* =  Animated content
	/*-------------------------------------------------*/

  try {
    /* ================ ANIMATED CONTENT ================ */
    if ($(".animated")[0]) {
      $(".animated").css("opacity", "0");
    }

    $(".triggerAnimation").waypoint(
      function () {
        var animation = $(this).attr("data-animate");
        $(this).css("opacity", "");
        $(this).addClass("animated " + animation);
      },
      {
        offset: "75%",
        triggerOnce: true,
      },
    );
  } catch (err) {}

  /*-------------------------------------------------*/
  /* =  remove animation in mobile device
	/*-------------------------------------------------*/
  if (winDow.width() < 992) {
    $("div.triggerAnimation").removeClass("animated");
    $("div.triggerAnimation").removeClass("triggerAnimation");
  }

  try {
    var SliderPost = $(".flexslider");

    SliderPost.flexslider({
      slideshowSpeed: 3000,
      easing: "swing",
    });
  } catch (err) {}

  /*-------------------------------------------------*/
  /* = slider Testimonial
	/*-------------------------------------------------*/

  var slidertestimonial = $(".bxslider");
  try {
    slidertestimonial.bxSlider({
      mode: "vertical",
    });
  } catch (err) {}

  /*-------------------------------------------------*/
  /* = prodcut Testimonial
	/*-------------------------------------------------*/
  var productslider = $("#tg-product-slider");
  try {
    productslider.owlCarousel({
      autoPlay: false, //Set AutoPlay to 3 seconds

      items: 4,
      itemsDesktop: [1170, 3],
      itemsDesktopSmall: [979, 2],
    });
  } catch (err) {}

  /*-------------------------------------------------*/
  /* = Gallery Slider 
	/*-------------------------------------------------*/

  var sync1 = $("#sync1");
  var sync2 = $("#sync2");

  sync1.owlCarousel({
    singleItem: true,
    slideSpeed: 1000,
    navigation: true,
    navigationText: [
      "<i class='fa fa-chevron-circle-left owl-button'></i>",
      "<i class='fa fa-chevron-circle-right owl-button'></i>",
    ],
    pagination: false,
    afterAction: syncPosition,
    responsiveRefreshRate: 200,
  });

  sync2.owlCarousel({
    items: 8,
    itemsDesktop: [1199, 10],
    itemsDesktopSmall: [979, 10],
    itemsTablet: [768, 8],
    itemsMobile: [479, 4],
    pagination: false,
    responsiveRefreshRate: 100,
    afterInit: function (el) {
      el.find(".owl-item").eq(0).addClass("synced");
    },
  });

  function syncPosition(el) {
    var current = this.currentItem;
    $("#sync2")
      .find(".owl-item")
      .removeClass("synced")
      .eq(current)
      .addClass("synced");
    if ($("#sync2").data("owlCarousel") !== undefined) {
      center(current);
    }
  }

  $("#sync2").on("click", ".owl-item", function (e) {
    e.preventDefault();
    var number = $(this).data("owlItem");
    sync1.trigger("owl.goTo", number);
  });

  function center(number) {
    var sync2visible = sync2.data("owlCarousel").owl.visibleItems;

    var num = number;
    var found = false;
    for (var i in sync2visible) {
      if (num === sync2visible[i]) {
        var found = true;
      }
    }

    if (found === false) {
      if (num > sync2visible[sync2visible.length - 1]) {
        sync2.trigger("owl.goTo", num - sync2visible.length + 2);
      } else {
        if (num - 1 === -1) {
          num = 0;
        }
        sync2.trigger("owl.goTo", num);
      }
    } else if (num === sync2visible[sync2visible.length - 1]) {
      sync2.trigger("owl.goTo", sync2visible[1]);
    } else if (num === sync2visible[0]) {
      sync2.trigger("owl.goTo", num - 1);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*	Contact Form
	/* ---------------------------------------------------------------------- */

  var submitContact = $("#submit_contact"),
    message = $("#msg");

  submitContact.on("click", function (e) {
    e.preventDefault();

    var $this = $(this);

    $.ajax({
      type: "POST",
      url: "contact.php",
      dataType: "json",
      cache: false,
      data: $("#contact-form").serialize(),
      success: function (data) {
        if (data.info !== "error") {
          $this
            .parents("form")
            .find("input[type=text],textarea,select")
            .filter(":visible")
            .val("");
          message
            .hide()
            .removeClass("success")
            .removeClass("error")
            .addClass("success")
            .html(data.msg)
            .fadeIn("slow")
            .delay(5000)
            .fadeOut("slow");
        } else {
          message
            .hide()
            .removeClass("success")
            .removeClass("error")
            .addClass("error")
            .html(data.msg)
            .fadeIn("slow")
            .delay(5000)
            .fadeOut("slow");
        }
      },
    });
  });

  /* ---------------------------------------------------------------------- */
  /*	Header animate after scroll
	/* ---------------------------------------------------------------------- */

  (function () {
    var docElem = document.documentElement,
      didScroll = false,
      changeHeaderOn = 50;
    document.querySelector("header");
    function init() {
      window.addEventListener(
        "scroll",
        function () {
          if (!didScroll) {
            didScroll = true;
            setTimeout(scrollPage, 100);
          }
        },
        false,
      );
    }

    function scrollPage() {
      var sy = scrollY();
      if (sy >= changeHeaderOn) {
        $("header").addClass("active");
      } else {
        $("header").removeClass("active");
      }
      didScroll = false;
    }

    function scrollY() {
      return window.pageYOffset || docElem.scrollTop;
    }

    init();
  })();
});

/* ---------------------------------------------------------------------- */
/*	map street view mode function
/* ---------------------------------------------------------------------- */
var contact = { lat: "-33.880641", lon: "151.204298" }; //Change a map coordinate here!

try {
  var mapContainer = $("#map");
  mapContainer.gmap3(
    {
      action: "addMarker",
      marker: {
        options: {
          icon: new google.maps.MarkerImage("images/marker.png"),
        },
      },
      latLng: [contact.lat, contact.lon],
      map: {
        center: [contact.lat, contact.lon],
        zoom: 16,
      },
    },
    { action: "setOptions", args: [{ scrollwheel: false }] },
  );
} catch (err) {}

/*-------------------------------------------------*/
/* =  Revolution Slider
/*-------------------------------------------------*/

jQuery(".tp-banner")
  .show()
  .revolution({
    dottedOverlay: "none",
    delay: 10000,
    startwidth: 1140,
    startheight: 800,
    hideThumbs: 200,

    thumbWidth: 100,
    thumbHeight: 50,
    thumbAmount: 5,

    navigationType: "bullet",
    navigationArrows: "none",

    touchenabled: "on",
    onHoverStop: "off",

    swipe_velocity: 0.7,
    swipe_min_touches: 1,
    swipe_max_touches: 1,
    drag_block_vertical: false,

    parallax: "mouse",
    parallaxBgFreeze: "on",
    parallaxLevels: [7, 4, 3, 2, 5, 4, 3, 2, 1, 0],

    keyboardNavigation: "off",

    navigationHAlign: "center",
    navigationVAlign: "bottom",
    navigationHOffset: 0,
    navigationVOffset: 40,

    shadow: 0,

    spinner: "spinner4",

    stopLoop: "off",
    stopAfterLoops: -1,
    stopAtSlide: -1,

    shuffle: "off",

    autoHeight: "off",
    forceFullWidth: "off",

    hideThumbsOnMobile: "off",
    hideNavDelayOnMobile: 1500,
    hideBulletsOnMobile: "off",
    hideArrowsOnMobile: "off",
    hideThumbsUnderResolution: 0,

    hideSliderAtLimit: 0,
    hideCaptionAtLimit: 0,
    hideAllCaptionAtLilmit: 0,
    startWithSlide: 0,
    fullScreenOffsetContainer: ".header",
  });
