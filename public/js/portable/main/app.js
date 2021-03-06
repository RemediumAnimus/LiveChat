(function ($) {
	'use strict';

	  window.app = {
      name: 'Glavbuh',
      setting: {
        folded: true,
        container: false,
        color: 'primary',
        bg: ''
      }
    };

    var setting = 'jqStorage-'+app.name+'-Setting',
        storage = $.localStorage,
        color;
    
    if( storage.isEmpty(setting) ){
        storage.set(setting, app.setting);
    }else{
        app.setting = storage.get(setting);
    }

    // click to switch
    $(document).on('click.setting', '.switcher input', function(e){
      var $this = $(this), $target;
      $target = $this.closest('[data-target]').attr('data-target');
      app.setting[$target] = $this.is(':checkbox') ? $this.prop('checked') : $(this).val();
      storage.set(setting, app.setting);
    });

})(jQuery);
