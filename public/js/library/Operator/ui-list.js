(function ($) {
  "use strict";
  
  $(document).on('click', '[data-ui-list] .list-item', function (e) {

    var $this = $(this)
        , $active
        , $ul = $this.closest('[data-ui-list]')
        , $class = $ul.attr('data-ui-list')
        , $target = $ul.attr('data-ui-list-target')
        , $targetClass = $ul.attr('data-ui-list-target-class')
        ;

    $active = $this.siblings('.'+$class.split(' ').join('.'));
    $this.addClass($class).addClass('active');
    $active.removeClass($class).removeClass('active');

    $target && $($target).addClass($targetClass);

  });

})(jQuery);
