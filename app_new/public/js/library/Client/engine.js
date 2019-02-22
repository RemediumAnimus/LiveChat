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
	function removeActive(selected_page) {
		$('#'+selected_page).removeClass('visible');
	};
	
	function _onClickIconBtn() {
		
		$('.icon-link').on('click', function() {
			
			var page = $(this).data('page');
			var selected_page = $(this).closest('.row-main').attr('id');
			
			$('#'+selected_page).removeClass('transition');
			$('#'+page).addClass('visible');
			
			$('#'+page).on("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend", function() {
				removeActive(selected_page)
			});
			
			$('#'+page).addClass('transition');
			
			$('#'+selected_page).unbind("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend");
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