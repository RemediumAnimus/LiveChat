// Модуль корзины
var app = (function($) {

    var cartData,
        opts = {};

    // Инициализация модуля
    function init(options) {
		
        // Инициализируем настройки
		_initOptions(options);
		
		// Навешивам события
       _bindHandlers();
    }

	// Инициализируем настройки
	function _initOptions(options) {
		
		opts = options;
	}
	
	// Навешивам события
	function _bindHandlers() {
		_onClickIconBtn();
	}
	
	// Удалим анимацию
	function removeActive(page) {
        $('#'+page).removeClass('visible');
    };

	function _onClickIconBtn() {
		
		$('.icon-link').on('click', function() {

            /*var opening_page = $(this).data('page');
            var current_page = $(this).closest('.row-main').attr('id');

			if($('#'+opening_page).hasClass('hidden')) {
                $('#'+current_page).removeClass('visible');
			} else {
                $('#'+current_page).addClass('hidden');
			}

            $('#'+opening_page).addClass('visible').removeClass('hidden');

            $('#'+current_page).on("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function() {
                removeActive(current_page)
            });

            $('#'+opening_page).unbind("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend");*/
		});
		
		$('.row-tap').on('click', function() {
			
			var tab = $(this).data('tab');
			
			$(this).closest('.row-tab').find('.row-tap').removeClass('active');
			$(this).addClass('active');
			
			$(this).closest('.row-main').find('.row-tab').removeClass('visible');
			$('#'+tab).addClass('visible');
		});
	}

    // Экспортируем наружу
    return {
        init: init
    }

})(jQuery);

// Модуль приложения
var main = (function($) {
	
    var options = {
		body: 'body'
	};

	// Запускаем модули в зависимости от их потребности на запрошенной странице
    function init() {
        app.init(options);
    }
    
    return {
        init: init
    }    

})(jQuery);

jQuery(document).ready(main.init);